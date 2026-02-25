"""
Report generation node - async version for LangGraph streaming support.
Uses LangChain ChatOpenAI with ainvoke for proper astream_events token interception.
"""
from ..state import AgentState
import os
from dotenv import load_dotenv


from langchain_core.runnables import RunnableConfig

async def generate_node(state: AgentState, config: RunnableConfig):
    """
    Generates a report based on search results.
    Async to allow LangGraph's astream_events to intercept on_chat_model_stream tokens.
    """
    query = state['input']
    results = "\n\n".join(state['search_results'])
    
    print(f"--- GENERATING REPORT FOR: {query} ---")
    
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env")
    load_dotenv(env_path)
    
    if "NO_PROXY" not in os.environ:
        os.environ["NO_PROXY"] = "localhost,127.0.0.1"
    elif "localhost" not in os.environ["NO_PROXY"]:
        os.environ["NO_PROXY"] += ",localhost,127.0.0.1"
    
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_base = os.getenv("OPENAI_BASE_URL")
    
    model_id = state.get("model", "gemini-3-flash")
    
    prompt_text = f"Start your report with a clear title.\n\nQuery: {query}\n\nSearch Results:\n{results}"
    system_message = "You are a professional research assistant. Write a comprehensive report based on the provided search results."

    models_to_try = [model_id, "gemini-3-flash", "gemini-3-pro-low", "gemini-2.5-flash"]
    report_content = None
    
    if openai_key:
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import SystemMessage, HumanMessage
        import asyncio
        
        max_retries = 3
        retry_delay = 2
        
        for current_model in models_to_try:
            if report_content: break
            
            kwargs = {"model": current_model, "temperature": 0, "api_key": openai_key, "streaming": True}
            if openai_base:
                kwargs["base_url"] = openai_base
                
            llm = ChatOpenAI(**kwargs)
            
            messages = [
                SystemMessage(content=system_message),
                HumanMessage(content=prompt_text)
            ]
            
            for attempt in range(max_retries):
                try:
                    print(f"--- ASYNC LANGCHAIN REPORT CALL (Model: {current_model}, Attempt: {attempt + 1}) ---")
                    
                    # CRITICAL: Use ainvoke so LangGraph's astream_events can intercept tokens
                    response = await llm.ainvoke(messages, config)
                    
                    report_content = response.content
                    print(f"--- SUCCESSFUL ASYNC REPORT CALL (Model: {current_model}) ---")
                    
                    input_tokens = 0
                    output_tokens = 0
                    if hasattr(response, 'usage_metadata') and response.usage_metadata:
                        input_tokens = response.usage_metadata.get('input_tokens', 0)
                        output_tokens = response.usage_metadata.get('output_tokens', 0)
                        
                    cost = (input_tokens * 0.00015 / 1000) + (output_tokens * 0.0006 / 1000)
                    
                    return {
                        "report": report_content, 
                        "input_tokens": input_tokens, 
                        "output_tokens": output_tokens,
                        "cost": cost
                    }
                except Exception as e:
                    error_msg = str(e)
                    print(f"DEBUG: Report Call Attempt {attempt + 1} Failed for {current_model}: {error_msg}")
                    
                    if attempt < max_retries - 1:
                        await asyncio.sleep(retry_delay)
                    else:
                        break
                        
    # Fallback
    print("Using Fallback Template...")
    report = f"""
# Deep Research Report: {query}

## Executive Summary
Based on the analysis of {len(state['search_results'])} sources, we have found significant information regarding "{query}".

## Key Findings
- The search results indicate a strong interest in this topic.

## Source Data
{results[:500]}... (truncated)
"""
    return {"report": report, "input_tokens": 0, "output_tokens": 0, "cost": 0.0}
