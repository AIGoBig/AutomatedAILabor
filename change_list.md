# AutomatedAILabor 修复记录 (2026-02-26)

> 本文档记录了本次会话中发现并修复的所有问题，可在其他设备上参照执行。

---

## 修复 1：数据库 `updated_at` 字段缺失

**现象**：任务创建/更新时报错 `OperationalError: no such column: jobs.updated_at`

**原因**：`models.py` 中 `Job` 模型新增了 `updated_at` 字段，但旧数据库表没有该列。SQLite 不支持 `ALTER TABLE ADD COLUMN` 自动同步。

**修复方式**：

#### 文件：`backend/models.py`

确保 `Job` 模型包含 `updated_at` 字段：

```python
from sqlalchemy import Column, String, DateTime, func

class Job(Base):
    # ... 其他字段 ...
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
```

#### 操作：删除旧数据库

```bash
# 停止后端服务
pkill -f uvicorn

# 删除旧数据库（重启后自动重建）
rm -f backend/automated_ai_labor.db

# 重新启动服务
bash start.sh
```

---

## 修复 2：LangGraph Checkpointer 缺少 `thread_id`

**现象**：`Checkpointer requires one or more of the following 'configurable' keys: thread_id`

**原因**：`run_agent()` 调用 `agent_graph.invoke(state)` 时没有传 `config`，而 `MemorySaver` checkpointer 强制要求 `thread_id`。

**修复方式**：

#### 文件：`backend/agent/workflow.py` — `run_agent` 函数

```diff
 def run_agent(input_query: str, model_id: str = "qwen3.5-plus", task_type: str = "research"):
     state: AgentState = { ... }
 
-    final_state = agent_graph.invoke(state)
+    import uuid
+    config = {"configurable": {"thread_id": str(uuid.uuid4())}}
+    final_state = agent_graph.invoke(state, config=config)
     return final_state
```

---

## 修复 3：`interrupt()` 导致 `get_config outside of a runnable context`

**现象**：SSE 流式执行时报错 `Called get_config outside of a runnable context`

**原因**：`langgraph.types.interrupt()` 内部调用 `get_config()`，在 `astream_events` 上下文 + Python 3.9 环境下不兼容。

**修复方式**：将 `interrupt()` 替换为编译时 `interrupt_before` 参数。

#### 文件：`backend/agent/workflow.py`

**1) 移除 `interrupt` 导入**

```diff
 from langgraph.graph import StateGraph, END
 from langgraph.checkpoint.memory import MemorySaver
-from langgraph.types import interrupt
```

**2) 重写 `human_interaction_node`**（不再调用 `interrupt()`）

```python
def human_interaction_node(state: AgentState):
    """
    Graph pauses BEFORE this node via interrupt_before.
    When resumed, feedback is already in state["messages"].
    """
    user_messages = [m for m in state.get("messages", []) if m.get("role") == "user"]
    
    if user_messages:
        latest_feedback = user_messages[-1].get("content", "")
        if latest_feedback:
            state["task_spec"] += f"\n\n[User Supplementary Request]:\n{latest_feedback}"
            state["logs"].append("👨‍💻 收到用户实时反馈协助，调整执行策略中...")
    else:
        state["logs"].append("👨‍💻 用户直接确认通过，进入执行状态...")

    return {"task_spec": state["task_spec"], "messages": state["messages"], "logs": state["logs"]}
```

**3) 编译时使用 `interrupt_before`**

```diff
 memory = MemorySaver()
-agent_graph = workflow.compile(checkpointer=memory)
+agent_graph = workflow.compile(checkpointer=memory, interrupt_before=["human_interaction"])
```

#### 文件：`backend/main.py` — `/continue` 端点

```python
@app.post("/api/jobs/{job_id}/continue")
def continue_job(job_id: str, req: ContinueRequestModel, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "awaiting_input":
        raise HTTPException(status_code=400, detail="Job is not awaiting input")
        
    config = {"configurable": {"thread_id": job_id}}
    state = agent_graph.get_state(config)
    
    if not state.next:
        raise HTTPException(status_code=400, detail="Graph is not currently interrupted")

    # 注入用户反馈到图状态
    try:
        current_messages = list(state.values.get("messages", []))
        current_messages.append({"role": "user", "content": req.feedback})
        agent_graph.update_state(config, {"messages": current_messages})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update graph state: {e}")

    job.status = "processing"
    db.commit()
    return {"status": "success", "message": "Graph resumed"}
```

---

## 修复 4：前端输入框始终禁用 & 无倒计时

**现象**：
- 输入框显示"等待智能体分析完毕"始终无法输入
- "等待您的干预与确认"卡住，没有倒计时自动继续

**原因**：
1. 输入框 `disabled` 判断用的是 `job.status`（仅初始 fetch 设置），而非 `stream.status`（SSE 实时更新）
2. 没有自动继续机制

**修复方式**：

#### 文件：`frontend/app/dashboard/[id]/page.tsx`

**1) 新增状态变量**

```tsx
const [countdown, setCountdown] = useState<number | null>(null);
const countdownRef = useRef<NodeJS.Timeout | null>(null);
```

**2) 同步 stream.status → job.status**

```tsx
useEffect(() => {
    if (stream.status === 'awaiting_input') {
        setJob((prev: any) => prev ? { ...prev, status: 'awaiting_input' } : prev);
    }
}, [stream.status]);
```

**3) 10 秒倒计时 + 自动继续**

```tsx
// 倒计时启动/关闭
useEffect(() => {
    if (stream.status === 'awaiting_input') {
        setCountdown(10);
        countdownRef.current = setInterval(() => {
            setCountdown(prev => (prev === null || prev <= 1) ? 0 : prev - 1);
        }, 1000);
    } else {
        setCountdown(null);
        if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    }
    return () => { if (countdownRef.current) { clearInterval(countdownRef.current); } };
}, [stream.status]);

// 倒计时归零时自动继续
useEffect(() => {
    if (countdown === 0 && stream.status === 'awaiting_input' && !isSendingFeedback) {
        handleAutoProceed();
    }
}, [countdown]);
```

**4) 自动继续函数**

```tsx
const handleAutoProceed = async () => {
    setIsSendingFeedback(true);
    setCountdown(null);
    const token = localStorage.getItem('token');
    try {
        const res = await apiPost(`/api/jobs/${id}/continue`, { feedback: '请继续执行' }, token);
        if (res.ok) { stopStream(); startStream(id, token); }
    } catch (err) { console.error('Auto-proceed failed:', err); }
    finally { setIsSendingFeedback(false); }
};
```

**5) 输入框改用 `stream.status` 判断**

```diff
-disabled={isSendingFeedback || job?.status !== 'awaiting_input'}
+disabled={isSendingFeedback || stream.status !== 'awaiting_input'}
```

**6) 倒计时横幅 UI**

在输入框上方添加：

```tsx
{stream.status === 'awaiting_input' && countdown !== null && countdown > 0 && (
    <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
        <span className="text-xs text-amber-400 font-bold">⏱ 等待您的干预指令，{countdown}秒后自动继续执行...</span>
        <button onClick={handleAutoProceed} className="text-xs text-amber-300 hover:text-white font-bold underline">
            立即继续
        </button>
    </div>
)}
```

---

## 修复 5：`---TASK_SPEC---` 等标记未格式化

**现象**：`---TASK_SPEC---`、`---END_SPEC---` 等标记与正文内容混在一起，无换行无强调。

**修复方式**：

#### 文件：`frontend/app/dashboard/[id]/page.tsx`

在 Markdown 组件之前添加预处理函数：

```tsx
const formatStructuralMarkers = (content: string): string => {
    return content
        .replace(/---TASK_SPEC---/g, '\n\n---\n\n**📋 任务规格说明**\n\n---\n\n')
        .replace(/---END_SPEC---/g, '\n\n---\n\n**✅ 规格说明结束**\n\n---\n\n')
        .replace(/---REVIEW---/g, '\n\n---\n\n**🔍 评审意见**\n\n---\n\n')
        .replace(/---END_REVIEW---/g, '\n\n---\n\n**✅ 评审结束**\n\n---\n\n');
};
```

在 `<ReactMarkdown>` 渲染时应用：

```diff
 <ReactMarkdown remarkPlugins={[remarkGfm]} components={getMarkdownComponents(job?.type)}>
-    {msg.content}
+    {formatStructuralMarkers(msg.content)}
 </ReactMarkdown>
```

---

## 修复 6：产物工作台 (Product Workbench) 排版错位问题

**现象**：由于 CSS Grid 属性冲突（`h-full` 与 `min-h-0` 结合时的列坍塌），导致开启 Side-by-Side 视图（双栏版面）时，右侧工作栏被错误地挤压换行（Vertical Stacking）展示在聊天记录下方，而非在右侧横向分割屏幕。

**修复方式**：

#### 文件：`frontend/app/dashboard/[id]/page.tsx`

**1) 将最外层主容器加宽并修复弹性布局**

```diff
- <main className="flex-1 min-h-0 px-8 max-w-7xl mx-auto w-full relative z-10 pb-4">
+ <main className="flex-1 w-full max-w-[1600px] mx-auto overflow-hidden px-4 md:px-8 pb-8 flex flex-col pt-2 relative z-10">
```

**2) 更新 Grid 列划分与滚动断点**
将 `lg` 级断点（1024px）放宽到 `xl`（1280px）以容纳左右双栏大画布：

```diff
- <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
+ <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 md:gap-8 flex-1 min-h-[0]">
```

**3) 为两列表设置正确的伸缩比例**

```diff
- <div className={`${hasWorkbench ? 'lg:col-span-2' : 'lg:col-span-3'} flex flex-col h-full min-h-0 overflow-y-auto pr-2 scroll-smooth transition-all duration-500`}>
+ <div className={`${hasWorkbench ? 'xl:col-span-2' : 'xl:col-span-3'} flex flex-col h-full min-h-[0] overflow-y-auto pr-2 scroll-smooth transition-all duration-500`}>

- <div className={`${hasWorkbench ? 'lg:col-span-2' : 'lg:col-span-1'} space-y-4 h-full overflow-y-auto pr-1 transition-all duration-500`}>
+ <div className={`${hasWorkbench ? 'xl:col-span-2' : 'xl:col-span-1'} space-y-4 h-full overflow-y-auto pr-1 transition-all duration-500`}>
```

---

## 修复 7：多智能体拓扑图 (Topology Map) 在产物出现时消失

**现象**：产物工作台 (Workbench) 渲染前，右侧显示“状态图”与“元数据”，但当智能体开始流式输出报告激活双栏视图时，状态图突然消失（被条件渲染覆盖）。

**修复方式**：

#### 文件：`frontend/app/dashboard/[id]/page.tsx`

**1) 将状态面板从 `else` 分支中剥离并置顶**

将包含 `<AgentTopologyMap />` 的 `<section>` 代码块向上移动，放在 `{hasWorkbench ?` 三元表达式判断的**正上方**，确保常驻显示。

```tsx
<div className={`${hasWorkbench ? 'xl:col-span-2' : 'xl:col-span-1'} ...`}>
    
    {/* Always Visible: Agent Activity Panel */}
    <section className="p-6 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 ...">
        {/* ... Topology Map ... */}
    </section>

    {/* Conditionally Visible: Workbench OR MetaData */}
    {hasWorkbench ? (
        <div className="Workbench-Container">...</div>
    ) : (
        <section className="MetaData-Container">...</section>
    )}
</div>
```

**2) 修复 JSX 碎片闭合标签错误**
在重构三元表达式时，移除了无效的 `<>` 以及 `</>` 幽灵标签，确保 React Node 节点解析合法。

---

## 修复 8：启动脚本端口残留冲突 (Port Binding & Zombie Processes)

**现象**：由于旧的 Node.js 或 Python 后台进程未完全退出，导致 `Address already in use` 占用 8000 端口，前端 Next.js 服务也被迫挂载至 3001 端口导致无法通讯。

**修复方式**：

#### 文件：`start.sh`

改写了守护式端口清理命令，利用管道确保杀掉所有的阻塞进程：

```bash
# Automatically clear out zombie processes occupying the API ports
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null
pkill -f dev_manager.py 2>/dev/null
...
```

---

## 扩展 6：增加“任务转 Workflow”技能选项占位符

**需求**：在前端起始类型页，新增一项用于标识“任务 -> Workflow”流转支持的 UI。

**加入方式**：

#### 文件：`frontend/app/start/page.tsx`

引入了 `Workflow` React Lucide 图标，并在界面的第一部分 `SetStep == 1` 下方追加了橙色主题的 Action Tile 按钮。

```tsx
<button onClick={() => setFormData({ ...formData, type: 'workflow' })} ...>
    <Workflow size={28} />
    <h3>任务转 Workflow</h3>
    <p>将单次对话任务沉淀为标准化的工作流引擎节点 (即将上线)</p>
</button>
```

---

## 修复 9：沙盒代码执行导致服务热重启中断流 (Uvicorn Hot-Reload Crash)

**现象**：由于后端默认使用了 `uvicorn --reload` 模式，当 `local_execution_node.py` 将生成的脚本动态写入 `workspace/temp/` 时，Uvicorn 的 watchdog 监听到了当前目录的文件修改变化，从而触发了服务热重启 `Restarting...`。热重启会强制暴力切断正在流式传输的长连接 (ASGI callable returned without completing response)，导致前端直接卡死失去连接。

**修复方式**：

#### 文件：`dev_manager.py`

在 `BACKEND_CMD` 参数列表中新增了热重载排除路径 `--reload-exclude` 屏蔽沙盒生成目录：

```diff
 BACKEND_CMD = [
     os.path.join(BACKEND_DIR, "venv", "bin", "python3"),
     "-m", "uvicorn", "main:app",
     "--host", "127.0.0.1",
     "--port", "8000",
     "--reload",
+    "--reload-exclude", "workspace/*"
 ]
```

---

## 快速检查清单

在新设备部署后，按以下顺序验证：

- [ ] `backend/models.py` 包含 `updated_at` 字段
- [ ] `backend/agent/workflow.py` 无 `interrupt()` 调用，使用 `interrupt_before` 编译
- [ ] `backend/agent/workflow.py` 的 `run_agent` 传了 `thread_id` config
- [ ] `backend/main.py` 的 `/continue` 端点使用 `update_state` 注入消息
- [ ] `frontend/.../page.tsx` 输入框用 `stream.status` 判断
- [ ] `frontend/.../page.tsx` 有倒计时 + 自动继续逻辑
- [ ] `frontend/.../page.tsx` 有 `formatStructuralMarkers` 预处理
- [ ] `frontend/.../page.tsx` Flex 和 Grid 采用 `xl:col-span-2` 支持左右分栏双视口展示
- [ ] 删除旧 `.db` 文件后重启服务

---

## 附录：沙盒机制测试规范 (Local Execution Sandbox)

**触发条件：**
`local_execution_node.py` 沙盒节点的执行取决于两个必要条件：
1. 主入口选择了 **"编程任务 (code)"** 作为 `task_type`。
2. Executor 代理在返回的报告中生成了带有 ` ```python ` 或者 ` ```py ` 标签的代码块。

**预设测试用例推荐：**
如果希望观测沙盒抓取 `stdout / stderr` 的完整联调环节，可以在前端起始页输入或点击以下自带的推荐问题：
1. `编写一个直接运行的 Python 脚本，计算并打印前20个斐波那契数列`
2. `用 Python 编写一个获取并验证特定网页连通性的脚本`

> 若任务类型选择为“深度研究(research)”，系统出于安全与资源控制考量，会跳过 Python 沙盒环境试运行环节，直接进行 Supervisor 交叉审核。