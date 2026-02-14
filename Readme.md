# Automated AI Labor Project (Project Zero-Labor)

> **Mission:** Transform AI from a "Tool" to a "Workforce".
> **Core Philosophy:** Pay for Results, Not Process.

## 1. 核心理念 (Core Concepts)

### The "Result-First" Paradigm
传统的 SaaS (Software as a Service) 模式让用户租赁工具，用户需要自己学习使用工具并为过程付费。
**Automated AI Labor** (AAL) 采用 **RaaS (Result as a Service)** 模式：
1.  **结果导向 (Outcome Oriented):** 用户定义“目标” (Goal)，我们交付“成果” (Asset)。
2.  **零风险承诺 (Zero Risk):** 只有当AI交付了符合标准的成果时，用户才付费。失败由平台承担。
3.  **最后一公里 (The Last Mile):** 这里的 AI 不仅仅是 Chatbot，而是 Agentic Workflow。它拥有执行能力，能够调用工具、浏览网页、编写代码、生成文件。

## 2. 产品规划 (Product Design)

### MVP Focus: "The Deep Research Analyst"
初期聚焦于高价值、可验证的“知识劳动”。
-   **Input:** 用户输入研究主题、目标受众、格式要求。
-   **Process:** AI 分解任务 -> 搜索 -> 阅读 -> 汇总 -> 撰写 -> 自我审查。
-   **Output:** 一份深度、结构化、包含引用来源的行业研究报告 (PDF/Markdown)。

### Future Capabilities
-   **Automated Coder:** "Fix this GitHub Issue" -> Pull Request.
-   **Content Marketer:** "Write a week's worth of LinkedIn posts based on this news" -> Scheduled Drafts.

## 3. 技术架构 (Technical Architecture)

### Stack Strategy
-   **Frontend:** Next.js (React) + TailwindCSS (Vercel deployment).
    -   *Why:* Fast, SEO-optimized, great UI libraries for dashboards.
-   **Backend:** Python (FastAPI).
    -   *Why:* Native ecosystem for AI/LLM orchestration (LangChain, LangGraph).
-   **AI Orchestration:**
    -   **LangGraph:** 用于构建有状态的、循环的 Agent 工作流 (Stateful workflows with cycles).
    -   **Supervisor Pattern:** 一个“工头”Agent管理多个“工人”Agent (Researcher, Writer, Reviewer).

## 4. 市场与增长 (Marketing & GTM)

### Go-To-Market Strategy
1.  **"Proof of Work" Campaign:** 公开展示 AI 生成的高质量报告，对比人类专家的工作。
2.  **Risk-Reversal Offer:** "Satisfied or Free" (满意再付费)。这是打破信任壁垒的关键。
3.  **Viral Loop:** 分享生成的报告（带水印/链接）以解锁更多配额或折扣。

## 5. Roadmap
- [ ] **Phase 1: Foundation (Now)** - Define architecture, set up repo, build basic "Research Agent".
- [ ] **Phase 2: MVP Launch** - Web interface, Stripe pre-auth integration, first public release.
- [ ] **Phase 3: Scale** - Add more "Worker Types" (Coding, Design), optimize agent costs.

---
## 6. 常见问题排查 (Troubleshooting)

### 1. 502 Bad Gateway / Connection Error
如果出现 `openai.InternalServerError: Error code: 502`，通常是因为终端的全局代理（如 VPN, Conda 代理）拦截了本地流量。
- **解决方法**: 在 `.env` 文件中确保包含 `NO_PROXY=localhost,127.0.0.1`。
- **手动修复**: 在终端运行 `export NO_PROXY=localhost,127.0.0.1`。

### 2. Architecture Mismatch (arm64 vs x86_64)
如果遇到 `ImportError: ... incompatible architecture`，说明你的 Python 解释器与安装的二进制库不匹配。
- **解决方法**: 始终使用项目自带的虚拟环境运行脚本：
  ```bash
  cd backend
  ./venv/bin/python3 main.py
  ```

### 3. Failed to Fetch (Frontend)
如果前端报错 `Failed to fetch`，请检查：
- 后端是否已启动 (`localhost:8000`)。
- `frontend/.env.local` 中的 `NEXT_PUBLIC_API_URL` 是否设置为 `http://localhost:8000`。
- 浏览器控制台是否有 CORS 相关报错。

---
*Initiated by the Automated AI Labor Team.*


## AI员工

### 全能专家助手
你作为一个专业的全能专家助手，是一个AI专家、技术专家、产品专家、市场营销专家，需要针 AI Labor Project ，进行构建和持续迭代优化。首先请参考@beautifulMention中的一点想法，开始进行多轮完善补充，构建从介绍页设计、产品设计、代码架构设计、代码构建，到产品、到市场营销的完整规划，实现最终将产品走向市场并盈利。