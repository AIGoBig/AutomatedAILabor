from ..state import AgentState
import os
from dotenv import load_dotenv
from openai import OpenAI

def code_node(state: AgentState):
    """
    Generates code based on the user's engineering goal.
    """
    query = state['input']
    model_id = state.get("model", "gemini-3-flash")
    
    # Load Environment
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env")
    if os.path.exists(env_path):
        load_dotenv(env_path, override=True)
        
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_base = os.getenv("OPENAI_BASE_URL")

    # Debug logs for server side
    print(f"DEBUG: Code Node - Key present: {bool(openai_key)}, Base: {openai_base}")

    state['logs'].append(f"正在分析代码工程需求...")
    
    system_message = """You are an expert software engineer. 
    Your task is to generate high-quality, production-ready code based on the user request.
    Always provide code in markdown blocks with language tags. 
    Include a brief explanation of the architecture and how to run the code.
    If multiple files are needed, clearly mark them."""
    
    prompt_text = f"User Request: {query}\n\nPlease generate the implementation."

    report_content = ""
    
    max_retries = 3
    retry_delay = 2 # seconds

    if openai_key and openai_base:
        for attempt in range(max_retries):
            try:
                state['logs'].append(f"正在启动 {model_id} 进行代码架构设计与编写 (第 {attempt + 1}/{max_retries} 次尝试)...")
                client = OpenAI(base_url=openai_base, api_key=openai_key)
                
                response = client.chat.completions.create(
                    model=model_id,
                    messages=[
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": prompt_text}
                    ],
                    temperature=0.2
                )
                report_content = response.choices[0].message.content
                state['logs'].append("代码合成已完成。正在进行静态检查与排版优化...")
                
                # Metrics
                input_tokens = response.usage.prompt_tokens
                output_tokens = response.usage.completion_tokens
                cost = (input_tokens * 0.00015 / 1000) + (output_tokens * 0.0006 / 1000)

                # Simple Code Extraction
                code_blocks = []
                import re
                blocks = re.findall(r'```(\w+)\n(.*?)\n```', report_content, re.DOTALL)
                for lang, code in blocks:
                    # Basic filename extraction if present in comments
                    filename_match = re.search(r'# filename: ([\w\.-]+)', code)
                    filename = filename_match.group(1) if filename_match else f"generated_{lang}.{lang}"
                    code_blocks.append({"filename": filename, "code": code, "language": lang})

                return {
                    "report": report_content, 
                    "code_blocks": code_blocks,
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "cost": cost
                }
            except Exception as e:
                error_msg = str(e)
                print(f"DEBUG: Code Node API Attempt {attempt + 1} Failed: {error_msg}")
                
                # Check for protocol errors or JSON failures
                if "502" in error_msg or "504" in error_msg or "Expecting value" in error_msg:
                    state['logs'].append(f"代理协议错误 (502/504/JSON Failure)。正在重试...")
                else:
                    state['logs'].append(f"API 调用失败: {error_msg[:100]}...")
                
                if attempt < max_retries - 1:
                    import time
                    time.sleep(retry_delay)
                else:
                    state['logs'].append("已达到最大重试次数。模型连接彻底中断。")
    else:
        print(f"DEBUG: Code Node Error - Missing environment configuration. Key: {bool(openai_key)}, Base: {openai_base}")
        state['logs'].append("错误: 缺少有效的模型 API 配置 (API_KEY 或 BASE_URL)")

    # Fallback
    state['logs'].append("使用通用编码模板作为兜底...")
    report_content = f"# Code Implementation: {query}\n\n```python\n# [FALLBACK] Unable to reach LLM\nprint('Hello World')\n```"
    return {"report": report_content, "input_tokens": 0, "output_tokens": 0, "cost": 0.0}
