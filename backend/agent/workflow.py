from .nodes.research import research_node
from .nodes.generate import generate_node
from .nodes.code_node import code_node
from .state import AgentState

def run_agent(input_query: str, model_id: str = "gemini-1.5-flash", task_type: str = "research"):
    """
    Orchestrates the agent workflow based on task type.
    """
    # Initialize State
    state: AgentState = {
        "input": input_query,
        "search_results": [],
        "report": "",
        "revision_number": 0,
        "max_revisions": 3,
        "model": model_id,
        "logs": ["初始化自主代理流..."],
        "task_type": task_type,
        "code_blocks": [],
        "file_structure": [],
        "input_tokens": 0,
        "output_tokens": 0,
        "cost": 0.0
    }

    if task_type == "research":
        print(f"Starting Research for: {input_query}")
        state["logs"].append(f"正在启动深度研究任务: {input_query}")
        research_output = research_node(state)
        state.update(research_output) 
        state["logs"].append(f"研究阶段完成，已提取 {len(state['search_results'])} 条关键来源。")

        # Step 2: Generate
        print("Generating Report...")
        state["logs"].append("正在启动 AI 报告生成引擎...")
        generate_output = generate_node(state)
        state.update(generate_output)
        state["logs"].append("报告合成已完成。正在导出至控制中心。")
    
    elif task_type == "code":
        print(f"Starting Code Engineering for: {input_query}")
        state["logs"].append(f"正在启动代码工程任务: {input_query}")
        code_output = code_node(state)
        state.update(code_output)
        state["logs"].append("代码编写与工程化处理已完成。")

    return state

    return state
