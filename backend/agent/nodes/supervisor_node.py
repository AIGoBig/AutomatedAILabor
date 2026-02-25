"""
Supervisor Agent Node - Handles requirement clarification and quality review.

The Supervisor operates in two phases:
1. Clarify: Analyzes user input, determines if requirements are clear enough 
   to proceed. If ambiguous, generates clarifying questions.
2. Review: After executor completes work, reviews the output against the 
   original TaskSpec. If quality is insufficient, generates revision instructions.
"""
from ..state import AgentState
import os
from dotenv import load_dotenv


def _get_llm():
    """Create a LangChain ChatOpenAI instance for the supervisor."""
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env")
    load_dotenv(env_path)
    
    if "NO_PROXY" not in os.environ:
        os.environ["NO_PROXY"] = "localhost,127.0.0.1"
    elif "localhost" not in os.environ["NO_PROXY"]:
        os.environ["NO_PROXY"] += ",localhost,127.0.0.1"
    
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_base = os.getenv("OPENAI_BASE_URL")
    
    if not openai_key:
        return None
    
    from langchain_openai import ChatOpenAI
    kwargs = {"model": "gemini-3-flash", "temperature": 0.3, "api_key": openai_key}
    if openai_base:
        kwargs["base_url"] = openai_base
    return ChatOpenAI(**kwargs)


def supervisor_clarify_node(state: AgentState):
    """
    Phase 1: Requirement Clarification.
    
    Analyzes the user's raw input and either:
    - Generates a clear TaskSpec if requirements are unambiguous
    - Asks clarifying questions (for future multi-turn support)
    
    For now (MVP), this node always generates a TaskSpec and proceeds.
    Future: will support multi-turn SSE-based user interaction.
    """
    user_input = state["input"]
    task_type = state.get("task_type", "research")
    
    state["logs"].append("🧑‍💼 监督智能体已激活，正在分析需求...")
    
    llm = _get_llm()
    
    if llm:
        from langchain_core.messages import SystemMessage, HumanMessage
        
        system_prompt = """你是一位资深项目总监（Supervisor Agent）。你的职责是：
1. 分析用户需求，判断需求是否足够清晰
2. 如果需求清晰，生成一份结构化的 TaskSpec（任务规格书）
3. TaskSpec 必须包含：目标(Goal)、交付物类型(Deliverable Type)、具体要求(Requirements)、验收标准(Acceptance Criteria)

输出格式（严格遵循）:
---TASK_SPEC---
目标: [一句话目标]
交付物类型: [html_page | chart | report | code]
具体要求:
- [要求1]
- [要求2]
验收标准:
- [标准1]
- [标准2]
---END_SPEC---

重要：始终倾向于生成 TaskSpec 并推进执行。只有在需求极度模糊时才提出澄清问题。"""

        try:
            response = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"任务类型: {task_type}\n用户需求: {user_input}")
            ])
            
            task_spec = response.content
            state["logs"].append("📋 需求分析完成，已生成任务规格书 (TaskSpec)")
            
            return {
                "task_spec": task_spec,
                "phase": "execute",
                "logs": state["logs"]
            }
        except Exception as e:
            state["logs"].append(f"监督智能体分析失败: {str(e)[:100]}，将直接进入执行阶段")
    
    # Fallback: pass through with basic task spec
    fallback_spec = f"""---TASK_SPEC---
目标: {user_input}
交付物类型: {'report' if task_type == 'research' else 'code'}
具体要求:
- 根据用户原始需求执行
验收标准:
- 输出内容完整且相关
---END_SPEC---"""
    
    return {
        "task_spec": fallback_spec,
        "phase": "execute",
        "logs": state["logs"]
    }


def supervisor_review_node(state: AgentState):
    """
    Phase 2: Quality Review.
    
    Reviews the executor's output against the TaskSpec.
    Determines if the result meets acceptance criteria.
    If not, generates specific revision instructions for the executor.
    """
    report = state.get("report", "")
    task_spec = state.get("task_spec", "")
    revision_number = state.get("revision_number", 0)
    max_revisions = state.get("max_revisions", 3)
    
    state["logs"].append(f"🔍 监督智能体正在评审执行结果 (第 {revision_number + 1} 轮)...")
    
    # If max revisions reached, auto-approve
    if revision_number >= max_revisions:
        state["logs"].append(f"⚠️ 已达最大修正轮次 ({max_revisions})，自动通过验收")
        return {
            "review_approved": True,
            "review_feedback": "已达最大修正轮次，自动通过",
            "phase": "done",
            "logs": state["logs"]
        }
    
    # If no report was generated, fail
    if not report or len(report.strip()) < 50:
        return {
            "review_approved": False,
            "review_feedback": "执行智能体未能生成有效内容，请重新生成",
            "revision_number": revision_number + 1,
            "phase": "execute",
            "logs": state["logs"]
        }
    
    llm = _get_llm()
    
    if llm:
        from langchain_core.messages import SystemMessage, HumanMessage
        
        system_prompt = """你是一位严格的质量评审专家（Review Agent）。你的职责是：
1. 对比 TaskSpec（任务规格书）和执行结果
2. 逐条检查验收标准是否满足
3. 给出明确的评审结论

输出格式（严格遵循）:
---REVIEW---
结论: [APPROVED | REVISION_NEEDED]
评分: [1-10]
评语: [一段话总结]
修改建议: 
- [建议1] (如果APPROVED则写"无")
---END_REVIEW---"""

        try:
            response = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"TaskSpec:\n{task_spec}\n\n执行结果:\n{report[:3000]}")
            ])
            
            review_text = response.content
            is_approved = "APPROVED" in review_text and "REVISION_NEEDED" not in review_text
            
            if is_approved:
                state["logs"].append("✅ 监督智能体评审通过！结果已达到验收标准")
                return {
                    "review_approved": True,
                    "review_feedback": review_text,
                    "phase": "done",
                    "logs": state["logs"]
                }
            else:
                state["logs"].append(f"🔄 监督智能体要求修订 (第 {revision_number + 1}/{max_revisions} 轮)")
                return {
                    "review_approved": False,
                    "review_feedback": review_text,
                    "revision_number": revision_number + 1,
                    "phase": "execute",
                    "logs": state["logs"]
                }
                
        except Exception as e:
            state["logs"].append(f"评审调用失败: {str(e)[:100]}，自动通过")
    
    # Fallback: auto-approve
    return {
        "review_approved": True,
        "review_feedback": "评审系统不可用，自动通过",
        "phase": "done",
        "logs": state["logs"]
    }
