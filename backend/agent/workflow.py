from .nodes.research import research_node
from .nodes.generate import generate_node
from .state import AgentState

def run_agent(input_query: str):
    """
    Orchestrates the agent workflow: Research -> Generate.
    """
    # Initialize State
    state: AgentState = {
        "input": input_query,
        "search_results": [],
        "report": "",
        "revision_number": 0,
        "max_revisions": 3
    }

    # Step 1: Research
    print(f"Starting Research for: {input_query}")
    research_output = research_node(state)
    state.update(research_output) # Simple dict update

    # Step 2: Generate
    print("Generating Report...")
    generate_output = generate_node(state)
    state.update(generate_output)

    return state
