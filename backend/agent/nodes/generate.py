from ..state import AgentState

def generate_node(state: AgentState):
    """
    Generates a report based on search results.
    """
    query = state['input']
    results = "\n\n".join(state['search_results'])
    
    # Placeholder for LLM call
    # In a real scenario, we would use ChatOpenAI or similar here.
    # For MVP verification without API keys, we simulate a response if no keys are present.
    
    print(f"--- GENERATING REPORT FOR: {query} ---")
    
    # Check for API Keys
    import os
    from dotenv import load_dotenv
    # Load from backend/.env (up one level from nodes/)
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env")
    load_dotenv(env_path)
    
    # Ensure NO_PROXY is set for local connections
    if "NO_PROXY" not in os.environ:
        os.environ["NO_PROXY"] = "localhost,127.0.0.1"
    elif "localhost" not in os.environ["NO_PROXY"]:
        os.environ["NO_PROXY"] += ",localhost,127.0.0.1"
    
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_base = os.getenv("OPENAI_BASE_URL")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    print(f"DEBUG: openai_key prefix: {openai_key[:10] if openai_key else 'NONE'}")
    print(f"DEBUG: openai_base: {openai_base}")
    print(f"DEBUG: ENV GOOGLE: { {k:v for k,v in os.environ.items() if 'GOOGLE' in k.upper()} }")
    print(f"DEBUG: ENV OPENAI: { {k:v for k,v in os.environ.items() if 'OPENAI' in k.upper()} }")
    
    model_id = state.get("model", "gemini-3-flash")
    
    prompt_text = f"Start your report with a clear title.\n\nQuery: {query}\n\nSearch Results:\n{results}"
    system_message = "You are a professional research assistant. Write a comprehensive report based on the provided search results."

    # Robust fallback list
    models_to_try = [model_id, "gemini-3-flash", "gemini-3-pro-low", "gemini-2.5-flash"]
    report_content = None
    input_tokens = 0
    output_tokens = 0
    cost = 0.0
    
    if openai_key:
        print(f"--- ATTEMPTING LANGCHAIN CALL (Model: {model_id}) ---")
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import SystemMessage, HumanMessage
        
        max_retries = 3
        retry_delay = 2 # seconds
        
        for current_model in models_to_try:
            if report_content: break
            
            # Use provided base_url if it exists, otherwise default
            kwargs = {"model": current_model, "temperature": 0, "api_key": openai_key}
            if openai_base:
                kwargs["base_url"] = openai_base
                
            llm = ChatOpenAI(**kwargs)
            
            messages = [
                SystemMessage(content=system_message),
                HumanMessage(content=prompt_text)
            ]
            
            for attempt in range(max_retries):
                try:
                    state['logs'].append(f"正在尝试使用 {current_model} 进行专家级合成 (第 {attempt + 1}/{max_retries} 次尝试)...")
                    print(f"--- ATTEMPTING LANGCHAIN CALL (Model: {current_model}, Attempt: {attempt + 1}) ---")
                    
                    # We use invoke here for synchronous background tasks, 
                    # but because it's a Runnable, astream_events will be able to intercept the stream later.
                    response = llm.invoke(messages)
                    
                    report_content = response.content
                    state['logs'].append(f"模型 {current_model} 响应成功，正在格式化 Markdown 报告...")
                    print(f"--- SUCCESSFUL LANGCHAIN CALL (Model: {current_model}) ---")
                    
                    # Metrics (approximate for standard OpenAI format if usage metadata is present)
                    input_tokens = 0
                    output_tokens = 0
                    if hasattr(response, 'usage_metadata') and response.usage_metadata:
                        input_tokens = response.usage_metadata.get('input_tokens', 0)
                        output_tokens = response.usage_metadata.get('output_tokens', 0)
                        
                    cost = (input_tokens * 0.00015 / 1000) + (output_tokens * 0.0006 / 1000) # Simple pricing
                    
                    return {
                        "report": report_content, 
                        "input_tokens": input_tokens, 
                        "output_tokens": output_tokens,
                        "cost": cost
                    }
                except Exception as e:
                    error_msg = str(e)
                    print(f"DEBUG: Langchain Call Attempt {attempt + 1} Failed for {current_model}: {error_msg}")
                    
                    if "502" in error_msg or "504" in error_msg or "Expecting value" in error_msg:
                        state['logs'].append(f"代理协议错误 (502/504/JSON Failure)。正在重试...")
                    else:
                        state['logs'].append(f"API 调用失败: {error_msg[:100]}...")
                    
                    if attempt < max_retries - 1:
                        import time
                        time.sleep(retry_delay)
                    else:
                        print(f"DEBUG: Exhausted retries for {current_model}")
                        # Move to next model in models_to_try
                        break
                        
    # Fallback Template (only if all above failed)
    print("Using Fallback Template due to cumulative failures...")
    report = f"""
# Deep Research Report: {query}

## [FAILED TO GENERATE REAL REPORT]
Debug Info:
- Model: {model_id}
- Base URL: {openai_base}
- OpenAI Key Configured: {'Yes' if openai_key else 'No'}

## Executive Summary
Based on the analysis of {len(state['search_results'])} sources, we have found significant information regarding "{query}".

## Key Findings
- The search results indicate a strong interest in this topic.
- Key trends include: [Extracted from Search Results]

## Source Data
{results[:500]}... (truncated for brevity)
"""
    return {"report": report, "input_tokens": 0, "output_tokens": 0, "cost": 0.0}
