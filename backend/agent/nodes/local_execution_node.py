import os
import subprocess
import tempfile
from ..state import AgentState

async def local_execution_node(state: AgentState):
    """
    Looks for python code blocks in the state and executes them locally in a sandbox directory.
    If execution fails, the stderr is caught to feed back to the executor.
    """
    code_blocks = state.get("code_blocks", [])
    if not code_blocks:
        return {"logs": state.get("logs", [])}

    # Use /tmp to avoid triggering uvicorn's reload watchdog
    workspace_dir = os.path.join(tempfile.gettempdir(), "ailabor_sandbox")
    os.makedirs(workspace_dir, exist_ok=True)
    
    # We run the first Python script for simplicity
    python_blocks = [b for b in code_blocks if b.get("language") in ["python", "py"]]
    
    if not python_blocks:
        if state.get("task_type") == "code":
            state["logs"].append("⚡ 未发现可执行的 Python 脚本，跳过环境试运行")
        return {"logs": state["logs"]}
        
    script_block = python_blocks[-1] # Usually the most recent or main
    filename = script_block.get("filename", "main.py")
    
    # Clean up filename standard
    if not filename.endswith(".py"): 
        filename += ".py"
        
    script_path = os.path.join(workspace_dir, filename)
    
    with open(script_path, "w", encoding="utf-8") as f:
        f.write(script_block["code"])
        
    state["logs"].append(f"⚡ 开始在沙箱环境中试运行: {filename}...")
    
    try:
        # Avoid running infinite loops or dangerous commands
        result = subprocess.run(
            ["python3", script_path], 
            cwd=workspace_dir, 
            capture_output=True, 
            text=True, 
            timeout=15 # 15 second timeout to prevent hanging
        )
        
        if result.returncode == 0:
            out_sample = result.stdout[:500].replace('\n', ' ')
            state["logs"].append(f"✅ 执行成功! (Output: {out_sample}...)")
            
            # Append to report so Supervisor Reviewer can see it
            current_report = state.get("report", "")
            appended_report = current_report + f"\n\n### 🖥️ Local Execution Success\n```text\n{result.stdout}\n```"
            
            return {
                "execution_result": result.stdout,
                "execution_error": "",
                "report": appended_report,
                "logs": state["logs"]
            }
        else:
            error_msg = result.stderr
            state["logs"].append(f"❌ 运行报错，已捕获 Exception 堆栈，准备打回给 Executor 修复...")
            
            # Append error to report so Supervisor Reviewer rejects it
            current_report = state.get("report", "")
            appended_report = current_report + f"\n\n### ❌ Local Execution Error\n```text\n{error_msg}\n```"
            
            return {
                "execution_result": "",
                "execution_error": error_msg,
                "report": appended_report,
                "logs": state["logs"]
            }
            
    except subprocess.TimeoutExpired:
        state["logs"].append(f"❌ 执行超时 (15秒限制)")
        
        current_report = state.get("report", "")
        appended_report = current_report + f"\n\n### ❌ Local Execution Error\n```text\nTimeoutExpired: Script took too long to execute (15s limit).\n```"
        
        return {
            "execution_error": "TimeoutExpired: Script took too long to execute (15s limit).",
            "report": appended_report,
            "logs": state["logs"],
            "execution_result": ""
        }
    except Exception as e:
        state["logs"].append(f"❌ 沙箱系统错误: {str(e)}")
        
        current_report = state.get("report", "")
        appended_report = current_report + f"\n\n### ❌ Local Execution Error\n```text\nSystem Error: {str(e)}\n```"
        
        return {
            "execution_error": str(e),
            "report": appended_report,
            "logs": state["logs"],
            "execution_result": ""
        }
