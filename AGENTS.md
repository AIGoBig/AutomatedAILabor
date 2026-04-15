# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

**Automated AI Labor** is a multi-agent AI system that delivers "Results as a Service" (RaaS). It uses a Supervisor-Executor pattern where a Supervisor Agent clarifies requirements and reviews outputs, while an Executor Agent performs research/code generation tasks.

**Stack**: Next.js 16 (frontend) + FastAPI + LangGraph (backend)

## Development Commands

### Backend (Python/FastAPI)

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run development server (port 8000)
./venv/bin/python3 main.py
# OR (if venv not available)
python3 main.py

# The backend auto-reloads and serves at http://localhost:8000
```

**Backend Environment** (`.env`):
```
OPENAI_API_KEY=...
OPENAI_BASE_URL=...
NO_PROXY=localhost,127.0.0.1  # Required to avoid 502 errors from system proxies
```

### Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Run development server (port 3000)
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

**Frontend Environment** (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Full Stack Development

1. Start backend: `cd backend && ./venv/bin/python3 main.py`
2. Start frontend: `cd frontend && npm run dev`
3. Access app at http://localhost:3000

## Server Deployment

### Server Connection

**SSH Access**:
```bash
ssh server-4c8g
```

**Server Project Path**: `/root/gubei_dev/AutomatedAILabor`

### Local Development → Server Sync Workflow

```bash
# 1. Connect to server
ssh server-4c8g

# 2. Navigate to project
cd /root/gubei_dev/AutomatedAILabor

# 3. Pull latest changes from git
git pull

# 4. Restart services (if needed)
# Backend: check if running with pm2/screen/systemd
# Frontend: rebuild if static build
```

### Git Workflow

```bash
# Local development - commit and push
git add .
git commit -m "your commit message"
git push

# On server - pull and restart
ssh server-4c8g "cd /root/gubei_dev/AutomatedAILabor && git pull"
```

### Server Environment Setup

Server uses the same `.env` structure as local. Ensure these files exist on server:
- `/root/gubei_dev/AutomatedAILabor/backend/.env`
- `/root/gubei_dev/AutomatedAILabor/frontend/.env.local` (if building static)

## Architecture Overview

### Multi-Agent Workflow (LangGraph)

The core AI logic is in `backend/agent/`:

```
┌─────────────────────────────────────────────────────────────────┐
│                    LangGraph StateGraph                          │
│                                                                  │
│  supervisor_clarify → human_interaction → executor →            │
│                       local_execution → supervisor_review       │
│                                              │                   │
│                    ┌─────────────────────────┘                   │
│                    ↓                                             │
│              (revision_needed) → executor (loop)                 │
│                    │                                             │
│              (approved) → END                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Key Files**:
- `backend/agent/workflow.py` - Graph definition and routing logic
- `backend/agent/state.py` - `AgentState` TypedDict defining all state fields
- `backend/agent/nodes/supervisor_node.py` - Clarification and review logic
- `backend/agent/nodes/generate.py` - Async report generation with token streaming
- `backend/agent/nodes/code_node.py` - Code generation tasks
- `backend/agent/nodes/local_execution_node.py` - Code execution in local environment

### Backend Structure (FastAPI)

```
backend/
├── main.py                 # FastAPI app, endpoints, SSE streaming
├── models.py               # SQLAlchemy models (Job, User)
├── database.py             # SQLite connection and session management
├── auth.py                 # JWT authentication utilities
└── agent/
    ├── workflow.py         # LangGraph compilation
    ├── state.py            # AgentState type definition
    └── nodes/              # Individual agent node implementations
```

**Key Endpoints**:
- `POST /api/jobs` - Create a new job (returns job_id)
- `GET /api/jobs/{id}/stream` - SSE endpoint for streaming execution
- `POST /api/jobs/{id}/continue` - Resume interrupted graph with user feedback
- `GET /api/jobs/{id}` - Get job status and result
- `GET /api/stats` - Usage analytics

**Streaming Architecture**: The `/stream` endpoint uses `agent_graph.astream_events()` to intercept real-time events from LangGraph and forward them as SSE events (`token`, `phase`, `workbench_update`, `interrupt`, `end`).

### Frontend Structure (Next.js App Router)

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with Geist font, AppShell
│   ├── globals.css         # Tailwind v4 + custom Mesh Gradient styles
│   ├── page.tsx            # Landing page
│   ├── dashboard/
│   │   ├── page.tsx        # Main dashboard (create jobs)
│   │   ├── [id]/page.tsx   # Job detail with streaming output
│   │   ├── analytics/page.tsx  # Token usage charts
│   │   └── models/page.tsx # Model selection UI
│   ├── login/page.tsx      # JWT login
│   └── signup/page.tsx     # User registration
├── components/
│   ├── AppShell.tsx        # Layout shell with navigation
│   └── ui/                 # shadcn-style UI components
├── lib/
│   ├── api.ts              # API client functions
│   ├── useAgentStream.ts   # SSE streaming hook
│   └── utils.ts            # cn() utility
└── context/
    └── (AuthContext if needed)
```

**Key Frontend Patterns**:
- **Streaming**: `useAgentStream.ts` manages SSE connection, token accumulation, and phase transitions
- **Glassmorphism UI**: Uses `backdrop-blur`, `bg-white/5`, and Mesh Gradient backgrounds
- **Authentication**: JWT stored in memory, login at `/login`

### Database Schema (SQLite)

**Job** table:
- `id` (UUID), `type` (research|code), `goal` (text), `status` (queued|processing|completed|failed|awaiting_input)
- `result` (JSON string), `owner_id` (FK to User)
- `input_tokens`, `output_tokens`, `cost` (metrics)
- `model` (selected model ID)

**User** table:
- `id`, `email`, `hashed_password`, `created_at`

### Agent State Flow

The `AgentState` (defined in `backend/agent/state.py`) flows through the graph:

1. **Input Phase**: `input` (user goal), `task_type`, `model`
2. **Clarification Phase**: `phase='clarify'`, `task_spec` (structured requirements)
3. **Execution Phase**: `phase='execute'`, `report`, `code_blocks`, `file_structure`
4. **Review Phase**: `phase='review'`, `review_feedback`, `review_approved`
5. **Loop or End**: If not approved, increment `revision_number` and loop back to executor

### Common Development Tasks

**Adding a New Agent Node**:
1. Create file in `backend/agent/nodes/`
2. Define async function accepting `(state: AgentState, config: RunnableConfig)`
3. Add to `backend/agent/workflow.py` graph
4. Update `AgentState` in `backend/agent/state.py` if new fields needed

**Adding a New API Endpoint**:
1. Add to `backend/main.py` with proper type hints
2. Use `SessionLocal()` for DB access in background/streaming contexts
3. Handle CORS preflight if needed

**Adding a Frontend Page**:
1. Create `app/newpage/page.tsx`
2. Add navigation link in `components/AppShell.tsx`
3. Use `useAgentStream.ts` pattern for streaming interactions

### Troubleshooting

**502 Bad Gateway / Connection Error**: Ensure `NO_PROXY=localhost,127.0.0.1` is set in `.env`

**Architecture Mismatch (arm64 vs x86_64)**: Always use the project venv: `./venv/bin/python3 main.py`

**Failed to Fetch (Frontend)**: Check backend is running on `:8000` and `NEXT_PUBLIC_API_URL` is set correctly

**Module Import Errors**: The backend adds its own directory to `sys.path` in `main.py` to handle imports
