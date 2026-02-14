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
    
    # Try raw OpenAI client first as it's proven to work in the test script
    if openai_key and openai_base:
        from openai import OpenAI
        client = OpenAI(base_url=openai_base, api_key=openai_key)
        
        max_retries = 3
        retry_delay = 2 # seconds

        for current_model in models_to_try:
            if report_content: break
            for attempt in range(max_retries):
                try:
                    state['logs'].append(f"正在尝试使用 {current_model} 进行专家级合成 (第 {attempt + 1}/{max_retries} 次尝试)...")
                    print(f"--- ATTEMPTING RAW OPENAI CALL (Model: {current_model}, Attempt: {attempt + 1}) ---")
                    
                    response = client.chat.completions.create(
                        model=current_model,
                        messages=[
                            {"role": "system", "content": system_message},
                            {"role": "user", "content": prompt_text}
                        ],
                        temperature=0
                    )
                    report_content = response.choices[0].message.content
                    state['logs'].append(f"模型 {current_model} 响应成功，正在格式化 Markdown 报告...")
                    print(f"--- SUCCESSFUL RAW OPENAI CALL (Model: {current_model}) ---")
                    
                    # Metrics
                    input_tokens = response.usage.prompt_tokens
                    output_tokens = response.usage.completion_tokens
                    cost = (input_tokens * 0.00015 / 1000) + (output_tokens * 0.0006 / 1000) # Simple pricing
                    
                    return {
                        "report": report_content, 
                        "input_tokens": input_tokens, 
                        "output_tokens": output_tokens,
                        "cost": cost
                    }
                except Exception as e:
                    error_msg = str(e)
                    print(f"DEBUG: Raw OpenAI Call Attempt {attempt + 1} Failed for {current_model}: {error_msg}")
                    
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

    llm = None
    if openai_key:
        print(f"--- ATTEMPTING LANGCHAIN CALL (Model: {model_id}) ---")
        from langchain_openai import ChatOpenAI
        
        # Use provided base_url if it exists, otherwise default
        kwargs = {"model": model_id, "temperature": 0, "api_key": openai_key}
        if openai_base:
            kwargs["base_url"] = openai_base
            
        llm = ChatOpenAI(**kwargs)
    elif anthropic_key:
        print(f"Using Anthropic Claude 3.5 Sonnet...")
        from langchain_anthropic import ChatAnthropic
        llm = ChatAnthropic(model="claude-3-5-sonnet-20240620", temperature=0)
        
    if llm:
        try:
            from langchain_core.prompts import ChatPromptTemplate
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", system_message),
                ("user", "{prompt_text}")
            ])
            
            chain = prompt | llm
            response = chain.invoke({"prompt_text": prompt_text})
            
            # Metrics (LangChain simplified)
            usage = getattr(response, "usage_metadata", {})
            input_tokens = usage.get("input_tokens", 0)
            output_tokens = usage.get("output_tokens", 0)
            cost = (input_tokens * 0.00015 / 1000) + (output_tokens * 0.0006 / 1000)

            return {
                "report": response.content,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "cost": cost
            }
        except Exception as e:
            print(f"DEBUG: LLM Generation (LangChain) Failed: {str(e)}")
            if hasattr(e, 'response') and hasattr(e.response, 'json'):
                 print(f"DEBUG: Error Response JSON: {e.response.json()}")
            elif hasattr(e, 'response'):
                 print(f"DEBUG: Error Response Content: {e.response.text}")
            # Fallback to template if LLM fails
    
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

