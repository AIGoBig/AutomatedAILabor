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
from langgraph.types import interrupt
from .nodes.research import research_node
from .nodes.generate import generate_node
from .nodes.code_node import code_node
from .nodes.supervisor_node import supervisor_clarify_node, supervisor_review_node
from .state import AgentState

from langchain_core.runnables import RunnableConfig

def human_interaction_node(state: AgentState):
    """
    Node that yields control back to the user to get feedback or approval before execution.
    By calling interrupt(), LangGraph pauses state here until resumed by the backend API.
    """
    feedback = interrupt("Ready for user feedback")
    
    # When resumed with feedback:
    if feedback and isinstance(feedback, str):
        # We append the user feedback to the state
        state["messages"].append({"role": "user", "content": feedback})
        # If user gives feedback, we might want to attach it to the task spec or input
        state["task_spec"] += f"\n\n[User Supplementary Request]:\n{feedback}"
        state["logs"].append(f"👨‍💻 收到用户实时反馈协助，调整执行策略中...")
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
    if revision > 0 and review_feedback:
        enhanced_input = f"{original_input}\n\n[监督智能体修改意见 (第{revision}轮)]:\n{review_feedback}"
    else:
        enhanced_input = original_input
        
    # Append any user messages from human_interaction_node to the instruction
    user_supplementary = "\n\n".join([m["content"] for m in state.get("messages", []) if m["role"] == "user"])
    if user_supplementary:
        enhanced_input += f"\n\n[用户的进一步补充要求]:\n{user_supplementary}"
    
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
workflow.add_node("supervisor_review", supervisor_review_node)

# Wire the edges
workflow.set_entry_point("supervisor_clarify")
workflow.add_edge("supervisor_clarify", "human_interaction")
workflow.add_edge("human_interaction", "executor")
workflow.add_edge("executor", "supervisor_review")
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
agent_graph = workflow.compile(checkpointer=memory)


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
    
    final_state = agent_graph.invoke(state)
    return final_state
