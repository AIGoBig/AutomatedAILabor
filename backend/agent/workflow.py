"""
Multi-Agent Workflow Graph.

Architecture:
  supervisor_clarify → executor (research|code) → supervisor_review
                                                        │
                                               ┌───────┴────────┐
                                               │                │
                                          (approved)       (revision)
                                              END        → executor (loop)
"""
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from .nodes.research import research_node
from .nodes.generate import generate_node
from .nodes.code_node import code_node
from .nodes.local_execution_node import local_execution_node
from .nodes.supervisor_node import supervisor_clarify_node, supervisor_review_node
from .state import AgentState

from langchain_core.runnables import RunnableConfig

def human_interaction_node(state: AgentState):
    """
    Graph pauses BEFORE this node via interrupt_before.
    When resumed, feedback is already in state["messages"].
    """
    user_messages = [m for m in state.get("messages", []) if m.get("role") == "user"]
    
    if user_messages:
        latest_feedback = user_messages[-1].get("content", "")
        if latest_feedback:
            state["task_spec"] += f"\n\n[User Supplementary Request]:\n{latest_feedback}"
            state["logs"].append("👨‍💻 收到用户实时反馈协助，调整执行策略中...")
    else:
        state["logs"].append("👨‍💻 用户直接确认通过，进入执行状态...")

    return {"task_spec": state["task_spec"], "messages": state["messages"], "logs": state["logs"]}

async def executor_node(state: AgentState, config: RunnableConfig):
    """
    Unified executor that routes to research+generate or code based on task_type.
    Async to support proper astream_events token interception.
    """
    task_type = state.get("task_type", "research")
    revision = state.get("revision_number", 0)
    review_feedback = state.get("review_feedback", "")
    
    # If this is a revision cycle, prepend feedback to the input
    original_input = state["input"]
    task_spec = state.get("task_spec", "未提供明确的任务规格")
    
    # 强制整合原始需求与 TaskSpec 作为最高优先级上下文
    enhanced_input = f"【原始用户需求】\n{original_input}\n\n【架构师设定的任务规格(TaskSpec)】\n{task_spec}"
    
    if revision > 0 and review_feedback:
        enhanced_input += f"\n\n====================\n🚨【重要：前一轮评审打回原因与修改指示 (第{revision}轮)】🚨\n{review_feedback}\n\n⚠️ 你必须严格针对上述反馈进行修复，不能无视评审智能体的意见！\n===================="
        
    # Append any user messages from human_interaction_node to the instruction
    user_supplementary = "\n\n".join([m["content"] for m in state.get("messages", []) if m["role"] == "user"])
    if user_supplementary:
        enhanced_input += f"\n\n【用户的实时干预与补充要求】:\n{user_supplementary}"
    
    # Temporarily override input for the sub-nodes
    modified_state = dict(state)
    modified_state["input"] = enhanced_input
    
    if task_type == "research":
        # Only do research on the first pass (research_node is sync/simulated, that's OK)
        if revision == 0:
            research_output = research_node(modified_state)
            modified_state.update(research_output)
        
        generate_output = await generate_node(modified_state, config)
        return generate_output
    
    elif task_type == "code":
        code_output = await code_node(modified_state, config)
        return code_output
    
    # Fallback
    return {"report": "Unknown task type"}


def review_decision(state: AgentState):
    """Routing function after supervisor review."""
    if state.get("review_approved", False):
        return "approved"
    else:
        return "revision_needed"


# Build the graph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("supervisor_clarify", supervisor_clarify_node)
workflow.add_node("human_interaction", human_interaction_node)
workflow.add_node("executor", executor_node)
workflow.add_node("local_execution", local_execution_node)
workflow.add_node("supervisor_review", supervisor_review_node)

# Wire the edges
workflow.set_entry_point("supervisor_clarify")
workflow.add_edge("supervisor_clarify", "human_interaction")
workflow.add_edge("human_interaction", "executor")
workflow.add_edge("executor", "local_execution")
workflow.add_edge("local_execution", "supervisor_review")
workflow.add_conditional_edges(
    "supervisor_review",
    review_decision,
    {
        "approved": END,
        "revision_needed": "executor"
    }
)

# Compile the graph with memory checkpointer
memory = MemorySaver()
agent_graph = workflow.compile(checkpointer=memory, interrupt_before=["human_interaction"])

def run_agent(input_query: str, model_id: str = "gemini-1.5-flash", task_type: str = "research"):
    """
    Legacy synchronous runner. Kept for backward compatibility with the 
    existing /api/jobs endpoint. The streaming endpoint uses agent_graph directly.
    """
    state: AgentState = {
        "input": input_query,
        "search_results": [],
        "report": "",
        "revision_number": 0,
        "max_revisions": 3,
        "model": model_id,
        "logs": ["初始化多智能体流水线..."],
        "task_type": task_type,
        "code_blocks": [],
        "file_structure": [],
        "input_tokens": 0,
        "output_tokens": 0,
        "cost": 0.0,
        # Supervisor fields
        "phase": "clarify",
        "task_spec": "",
        "review_feedback": "",
        "review_approved": False,
        "messages": []
    }
    
    import uuid
    config = {"configurable": {"thread_id": str(uuid.uuid4())}}
    final_state = agent_graph.invoke(state, config=config)
    return final_state
