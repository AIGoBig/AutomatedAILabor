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
from .nodes.research import research_node
from .nodes.generate import generate_node
from .nodes.code_node import code_node
from .nodes.supervisor_node import supervisor_clarify_node, supervisor_review_node
from .state import AgentState


async def executor_node(state: AgentState):
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
    
    # Temporarily override input for the sub-nodes
    modified_state = dict(state)
    modified_state["input"] = enhanced_input
    
    if task_type == "research":
        # Only do research on the first pass (research_node is sync/simulated, that's OK)
        if revision == 0:
            research_output = research_node(modified_state)
            modified_state.update(research_output)
        
        generate_output = await generate_node(modified_state)
        return generate_output
    
    elif task_type == "code":
        code_output = await code_node(modified_state)
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
workflow.add_node("executor", executor_node)
workflow.add_node("supervisor_review", supervisor_review_node)

# Wire the edges
workflow.set_entry_point("supervisor_clarify")
workflow.add_edge("supervisor_clarify", "executor")
workflow.add_edge("executor", "supervisor_review")
workflow.add_conditional_edges(
    "supervisor_review",
    review_decision,
    {
        "approved": END,
        "revision_needed": "executor"
    }
)

# Compile the graph
agent_graph = workflow.compile()


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
