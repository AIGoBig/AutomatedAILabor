# Automated AI Labor — Multi-Agent Architecture & Roadmap

## 1. 项目现状 (v1.1.0 Polished MVP)

### 已交付能力
- **前端**: Next.js + TailwindCSS 仪表盘，Apple 风格 Mesh Gradient 动态背景，全站 Glassmorphism，移动端响应式侧边栏
- **后端**: FastAPI + LangGraph Agent Pipeline，SQLite 持久化，JWT 鉴权
- **功能**: 任务创建 → 轮询 → 结果展示，重试/取消，7 天 Token 消耗分析
- **性能**: 智能轮询（任务完成即停止请求），统一 API 层

---

## 2. 多智能体架构设计 (Multi-Agent Architecture)

### 2.1 核心理念

> **系统目标：无人值守交付 (Autonomous Delivery)**
> 在用户不干预的情况下，系统应能自主完成从需求理解 → 执行 → 质检 → 交付的完整闭环。
> **交付导向**: 能交付 Web 页面就不交付代码；能交付数据图表就不交付原始数据。

### 2.2 智能体角色定义

```
┌─────────────────────────────────────────────────────┐
│                    用户 (User)                       │
└──────────────┬──────────────────────┬────────────────┘
               │ 需求输入              │ 结果反馈/沉默
               ▼                      ▼
┌──────────────────────────────────────────────────────┐
│              监督智能体 (Supervisor Agent)             │
│  ┌──────────────────────────────────────────────┐    │
│  │  Phase 1: 需求澄清 (Clarification)           │    │
│  │  - 与用户多轮交互，拆解模糊需求               │    │
│  │  - 确认目标、格式、约束条件                   │    │
│  │  - 生成结构化 TaskSpec                        │    │
│  ├──────────────────────────────────────────────┤    │
│  │  Phase 2: 质量评审 (Review)                   │    │
│  │  - 接收执行智能体的产出                       │    │
│  │  - 对比 TaskSpec 逐条检查                     │    │
│  │  - 用户 10s 无反馈 → 自动评审并给出意见       │    │
│  │  - 不合格 → 生成修改指令发回执行智能体        │    │
│  └──────────────────────────────────────────────┘    │
└──────────────┬──────────────────────┬────────────────┘
               │ TaskSpec              │ 修改指令
               ▼                      ▼
┌──────────────────────────────────────────────────────┐
│              执行智能体 (Executor Agent)               │
│  - 接收结构化 TaskSpec                                │
│  - 调用工具链: LLM 生成 / 搜索 / 代码执行             │
│  - 输出可交付资产 (HTML/图表/PDF)                     │
│  - 支持被监督智能体要求修改并重新执行                  │
└──────────────────────────────────────────────────────┘
```

### 2.3 交互流程 (Interaction Flow)

```
用户提交需求
    │
    ▼
[监督智能体] ──→ "您的需求是 X，请确认以下细节..."
    │                          ↑
    │ (多轮澄清)               │ 用户补充
    ▼                          │
[监督智能体] ──→ "需求已确认，正式进入生产流程。"
    │
    ▼
[监督智能体] ──→ 生成 TaskSpec ──→ [执行智能体] 开始工作
                                       │
                                       │ (SSE 流式输出执行过程)
                                       ▼
                              执行智能体完成 → 产出结果
                                       │
                 ┌─────────────────────┤
                 ▼                     ▼
            结果推送给用户        结果推送给监督智能体
                 │
                 ├── 用户在 10s 内反馈 → 人工意见覆盖
                 │
                 └── 用户 10s 无反馈 → 监督智能体自动评审
                                       │
                                       ├── 合格 → 标记交付完成 ✅
                                       └── 不合格 → 生成修改指令 → 执行智能体重做
                                                                    │
                                                                    └── (循环直到合格或达最大轮次)
```

### 2.4 交付物标准 (Deliverable Standards)

| 任务类型 | 交付物 | 而非 |
|---------|--------|------|
| Web 页面 | 可预览的 HTML 页面 (iframe 嵌入) | 源代码文本 |
| 数据分析 | 交互式图表 (ECharts/Chart.js) | 原始数据表 |
| 研究报告 | 格式化 Markdown + PDF 下载 | 纯文本 |
| 代码工程 | 可运行的代码 + 执行结果截图 | 仅代码 |

### 2.5 可扩展性设计

系统采用 **插件式智能体注册** 架构，后续可按需扩展：

| 智能体 | 职责 | 优先级 |
|--------|------|--------|
| 🧑‍💼 Supervisor Agent | 需求澄清、质量评审、自动验收 | ✅ 当前阶段 |
| ⚙️ Executor Agent | 研究/代码/内容生成 | ✅ 当前阶段 |
| 🔍 Research Agent | 深度网络搜索与信息聚合 | Phase 3 |
| 🎨 Design Agent | UI/UX 设计与资产生成 | Phase 4 |
| 🧪 QA Agent | 自动化测试与回归验证 | Phase 4 |

---

## 3. 流式交互架构 (Streaming Architecture)

### 3.1 通信协议

**从轮询 (Polling) 升级为 Server-Sent Events (SSE)**

```
前端 (Next.js)                    后端 (FastAPI)
    │                                  │
    │── GET /api/jobs/{id}/stream ────→│
    │                                  │── agent_graph.astream_events()
    │←── event: status ───────────────│
    │←── event: token (逐字) ─────────│
    │←── event: action (工具调用) ─────│
    │←── event: review (监督评审) ─────│
    │←── event: end ──────────────────│
```

### 3.2 LangGraph StateGraph 编排

```python
# 简化的图结构
workflow = StateGraph(AgentState)

workflow.add_node("supervisor_clarify", supervisor_clarify_node)
workflow.add_node("executor", executor_node)
workflow.add_node("supervisor_review", supervisor_review_node)

# 路由
workflow.set_entry_point("supervisor_clarify")
workflow.add_edge("supervisor_clarify", "executor")
workflow.add_edge("executor", "supervisor_review")
workflow.add_conditional_edges(
    "supervisor_review",
    review_decision,
    {"approved": END, "revision_needed": "executor"}
)
```

### 3.3 前端组件

| 组件 | 功能 |
|------|------|
| `StreamingMarkdown` | 处理未闭合代码块的流式 Markdown 渲染 |
| `AgentActionBlock` | 工具调用可视化 (搜索中/代码执行中) |
| `SupervisorBubble` | 监督智能体的需求澄清对话气泡 |
| `ResultPreview` | 内嵌 iframe/图表的交付物预览 |
| `ChatInputArea` | 底部固定的多行输入框 |

---

## 4. 集成外部代理能力 (External Agent Integration)

### 4.1 方案 A: 原生构建 (LangGraph + Sandbox)
给 Executor Agent 提供 `bash_execute`, `read_file`, `write_file` 等工具，在 Docker 沙箱中执行。

### 4.2 方案 B: 桥接法 (Wrap OpenClaw / Claude Code)
通过 `subprocess.Popen` 唤起外部 CLI Agent，SSE 转发其终端输出，前端使用 `xterm.js` 渲染。

**当前策略**: 先完成方案 A 的基础能力，如果效果不足再引入方案 B。

---

## 5. 自动化测试用例 (Test Cases)

### 5.1 监督智能体测试

| # | 测试场景 | 输入 | 预期行为 |
|---|---------|------|---------|
| T1 | 模糊需求澄清 | "帮我做个网站" | 监督智能体追问: 什么类型? 目标受众? |
| T2 | 明确需求直通 | "用 ECharts 做一个2024年Q1-Q4的销售折线图，数据: [100,200,150,300]" | 跳过澄清，直接生成 TaskSpec |
| T3 | 超时自动评审 | 执行完成后用户 10s 无反馈 | 监督智能体自动评审结果质量 |

### 5.2 执行智能体测试

| # | 测试场景 | 输入 | 预期交付物 |
|---|---------|------|-----------|
| T4 | Web 页面生成 | "做一个深色主题的个人简历页面" | 可预览的 HTML 页面 (非源代码) |
| T5 | 数据可视化 | "分析以下销售数据并生成图表: ..." | 嵌入式 ECharts 图表 |
| T6 | 研究报告 | "2024年全球AI行业趋势分析" | 格式化 Markdown 报告 |

### 5.3 端到端闭环测试

| # | 测试场景 | 流程 | 预期 |
|---|---------|------|------|
| T7 | 全自动交付 | 用户提交明确需求 → 不干预 | 系统自主完成3轮: 执行→评审→修正→交付 |
| T8 | 人工介入 | 用户在评审阶段给出修改意见 | 系统按意见修正并重新交付 |
| T9 | 多轮修正收敛 | 故意给出需迭代的需求 | 最多3轮后收敛交付 |

---

## 6. 实施路线 (Implementation Roadmap)

### Phase 3.1: 流式管道 (当前进行中)
- [x] 后端 SSE 端点 (`/api/jobs/{id}/stream`)
- [x] LangGraph `StateGraph` 编译
- [x] `generate_node` 切换到 LangChain ChatOpenAI
- [ ] 前端流式解析 + 打字机效果

### Phase 3.2: 监督智能体
- [ ] `supervisor_clarify_node`: 需求澄清逻辑
- [ ] `supervisor_review_node`: 自动评审逻辑
- [ ] 10s 超时自动评审机制
- [ ] 前端 SupervisorBubble 组件

### Phase 3.3: 交付物引擎
- [ ] HTML 预览 (iframe sandbox)
- [ ] 图表渲染 (ECharts 集成)
- [ ] PDF 导出 (WeasyPrint)

### Phase 3.4: 代码执行沙箱
- [ ] Docker sandbox 集成
- [ ] `bash_execute` / `read_file` / `write_file` 工具
- [ ] 终端输出流式转发

---

*Architecture documented on 2026-02-25. Version: v2.0-draft*
