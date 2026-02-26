from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import timedelta
import uuid
import sys
import os
import json
import asyncio
from jose import JWTError, jwt
from dotenv import load_dotenv
from sse_starlette.sse import EventSourceResponse

# Load environment variables from backend/.env
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(env_path)

# Ensure NO_PROXY is set for local connections to avoid 502 errors from system proxies
if "NO_PROXY" not in os.environ:
    os.environ["NO_PROXY"] = "localhost,127.0.0.1"
elif "localhost" not in os.environ["NO_PROXY"]:
    os.environ["NO_PROXY"] += ",localhost,127.0.0.1"

# Ensure backend directory is in path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agent.workflow import run_agent, agent_graph
from agent.state import AgentState
from database import engine, SessionLocal, Base, get_db
from models import Job, User
from auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY

# Create tables (SQLite) - in production use Alembic
Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0-v2-dev"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JobRequestModel(BaseModel):
    type: str
    goal: str
    email: Optional[str] = None
    model: Optional[str] = "gemini-3-flash"

class JobResponseModel(BaseModel):
    job_id: str
    status: str
    result: Optional[dict] = None # Return result as dict

def process_job(job_id: str, goal: str, model_id: str, db: Session):
    """
    Background task wrapper for the agent (Legacy Sync version).
    """
    print(f"Processing job {job_id}...")
    
    # Re-fetch job in new session (passed in or created new? BackgroundTasks runs in separate context)
    # Better to create a new session for the background task to avoid thread issues
    db_bg = SessionLocal()
    try:
        job = db_bg.query(Job).filter(Job.id == job_id).first()
        if not job:
            return
            
        job.status = "processing"
        db_bg.commit()
        
        # Run the synchronous agent workflow
        result = run_agent(goal, model_id, task_type=job.type)
        
        
        job.status = "completed"
        job.result = json.dumps(result) # Store as JSON string
        
        # Persist metrics to individual columns
        job.input_tokens = str(result.get("input_tokens", 0))
        job.output_tokens = str(result.get("output_tokens", 0))
        job.cost = str(round(result.get("cost", 0.0), 6))
        
        db_bg.commit()
        print(f"Job {job_id} completed.")
    except Exception as e:
        print(f"Job {job_id} failed: {e}")
        if job:
             job.status = "failed"
             job.result = json.dumps({"error": str(e)})
             db_bg.commit()
    finally:
        db_bg.close()

@app.get("/")
def read_root():
    return {"message": "Automated AI Labor API is Running", "status": "active"}

@app.get("/health")
def health_check_root():
    return {"status": "ok"}

class UserCreate(BaseModel):
    email: str
    password: str

@app.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    new_user = User(id=str(uuid.uuid4()), email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Auto-login
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Optional Auth Dependency
def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        if not token:
            return None
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        username: str = payload.get("sub")
        if username is None:
            return None
    except:
        return None
        
    user = db.query(User).filter(User.email == username).first()
    return user

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user = get_current_user_optional(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@app.post("/api/jobs", response_model=JobResponseModel)
def create_job(
    job_req: JobRequestModel, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional) # Optional auth
):
    job_id = str(uuid.uuid4())
    user_id = current_user.id if current_user else None
    
    new_job = Job(
        id=job_id,
        type=job_req.type,
        goal=job_req.goal,
        email=job_req.email,
        status="queued",
        owner_id=user_id, # Create link if user is logged in
        model=job_req.model
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    # Instead of running the legacy background process_job, we leave it queued.
    # The client will hit /stream, which will actually execute the job streamingly.
    # Note: for MVP Phase 3 testing, we just queue it here and the stream endpoint executes it.
    
    print(f"Queued job {job_id} for streaming execution. Goal: {job_req.goal}")
    return {"job_id": job_id, "status": "queued"}

@app.get("/api/jobs/{job_id}/stream")
async def stream_job(job_id: str, request: Request, db: Session = Depends(get_db)):
    """
    SSE endpoint to stream the LangGraph execution back to the client.
    Because LangGraph execution is CPU/Network intensive, we run it in isolation
    while streaming `astream_events`.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status == "completed" or job.status == "failed":
        # Handle jobs that are already finished
        async def mock_stream_finished():
            yield {"event": "status", "data": json.dumps({"status": job.status})}
            yield {"event": "end", "data": job.result or "{}"}
        return EventSourceResponse(mock_stream_finished())

    # Mark as processing if new
    if job.status not in ["processing", "awaiting_input"]:
        job.status = "processing"
        db.commit()

    async def event_generator():
        config = {"configurable": {"thread_id": job_id}}
        
        # Check current state from checkpoint memory
        current_state = agent_graph.get_state(config)
        
        # If there's an existing state, we are resuming; otherwise start fresh
        is_resuming = current_state.created_at is not None
        
        state: AgentState = None
        if not is_resuming:
            # Initialize fresh AgentState
            state = {
                "input": job.goal,
                "search_results": [],
                "report": "",
                "revision_number": 0,
                "max_revisions": 3,
                "model": job.model or "gemini-1.5-flash",
                "logs": ["初始化多智能体流水线 (SSE Streaming)..."],
                "task_type": job.type,
                "code_blocks": [],
                "file_structure": [],
                "input_tokens": 0,
                "output_tokens": 0,
                "cost": 0.0,
                # Supervisor fields
                "phase": "clarify",
                "task_spec": "",
                "review_feedback": "",
                "review_approved": False,
                "messages": []
            }
            
            yield {"event": "status", "data": json.dumps({"status": "processing"})}
            yield {"event": "log", "data": "Multi-Agent Pipeline Connected. Supervisor taking over..."}
        else:
            yield {"event": "status", "data": json.dumps({"status": "processing"})}
            yield {"event": "log", "data": "Resuming Multi-Agent Pipeline from checkpoint..."}

        try:
            final_state = None
            input_data = None if is_resuming else state
            
            # Intercept real-time events from LangGraph
            async for event in agent_graph.astream_events(input_data, config=config, version="v2"):
                # Handle client disconnect
                if await request.is_disconnected():
                    print(f"Client disconnected during job {job_id}")
                    break
                
                kind = event["event"]
                name = event.get("name", "")
                
                # Debug: log all event types to backend terminal
                if kind not in ("on_chain_start", "on_chain_end", "on_chain_stream"):
                    print(f"SSE_DEBUG [{job_id[:8]}]: kind={kind}, name={name}")

                # Supervisor & Node lifecycle events
                if kind == "on_chain_start":
                    if name == "supervisor_clarify":
                        yield {"event": "phase", "data": json.dumps({"phase": "clarify", "label": "🧑‍💼 监督智能体 — 需求分析中"})}
                    elif name == "executor":
                        yield {"event": "phase", "data": json.dumps({"phase": "execute", "label": "⚙️ 执行智能体 — 生产中"})}
                    elif name == "supervisor_review":
                        yield {"event": "phase", "data": json.dumps({"phase": "review", "label": "🔍 监督智能体 — 质量评审中"})}

                elif kind == "on_chat_model_stream":
                    content = event["data"]["chunk"].content
                    if content:
                        yield {"event": "token", "data": json.dumps({"text": content})}
                
                elif kind == "on_llm_stream":
                    # Alternative event name in some LangGraph versions
                    chunk = event.get("data", {}).get("chunk", "")
                    if hasattr(chunk, "content") and chunk.content:
                        yield {"event": "token", "data": json.dumps({"text": chunk.content})}
                    elif isinstance(chunk, str) and chunk:
                        yield {"event": "token", "data": json.dumps({"text": chunk})}
                        
                elif kind == "on_chain_end" and name == "LangGraph":
                    # Capture the final state from the overarching graph
                    final_state = event["data"].get("output")
                    
            # Check if graph paused due to interrupt
            post_state = agent_graph.get_state(config)
            
            if post_state.next:
                 # Graph is paused at `human_interaction_node`
                 db_bg = SessionLocal()
                 try:
                     update_job = db_bg.query(Job).filter(Job.id == job_id).first()
                     if update_job:
                         update_job.status = "awaiting_input"
                         db_bg.commit()
                 finally:
                     db_bg.close()
                 
                 yield {"event": "interrupt", "data": json.dumps({"message": "Ready for user feedback"})}
                 return
                    
            if final_state:
                # Execution finished successfully
                db_bg = SessionLocal()
                try:
                    update_job = db_bg.query(Job).filter(Job.id == job_id).first()
                    if update_job:
                        update_job.status = "completed"
                        update_job.result = json.dumps(final_state)
                        update_job.input_tokens = str(final_state.get("input_tokens", 0))
                        update_job.output_tokens = str(final_state.get("output_tokens", 0))
                        update_job.cost = str(round(final_state.get("cost", 0.0), 6))
                        db_bg.commit()
                finally:
                    db_bg.close()
                
                yield {"event": "status", "data": json.dumps({"status": "completed"})}
                yield {"event": "end", "data": json.dumps(final_state)}
            else:
                 yield {"event": "error", "data": "Graph completed but no final state was generated."}

        except Exception as e:
            print(f"Error during streaming execution of {job_id}: {e}")
            db_bg = SessionLocal()
            try:
                fail_job = db_bg.query(Job).filter(Job.id == job_id).first()
                if fail_job:
                    fail_job.status = "failed"
                    fail_job.result = json.dumps({"error": str(e)})
                    db_bg.commit()
            finally:
                db_bg.close()
            yield {"event": "status", "data": json.dumps({"status": "failed"})}
            yield {"event": "error", "data": str(e)}

    return EventSourceResponse(event_generator())

@app.get("/api/jobs/{job_id}")
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Parse result back to JSON if it exists
    result_dict = None
    if job.result:
        try:
            result_dict = json.loads(job.result)
        except:
            result_dict = {"raw": job.result}
            
    return {
        "job_id": job.id,
        "status": job.status,
        "type": job.type,
        "goal": job.goal,
        "result": result_dict,
        "input_tokens": job.input_tokens,
        "output_tokens": job.output_tokens,
        "cost": job.cost,
        "created_at": job.created_at,
        "updated_at": job.updated_at
    }

class ContinueRequestModel(BaseModel):
    feedback: str

@app.post("/api/jobs/{job_id}/continue")
def continue_job(job_id: str, req: ContinueRequestModel, db: Session = Depends(get_db)):
    """
    Endpoint to receive human feedback and resume the interrupted LangGraph execution.
    """
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

@app.get("/api/jobs")
def list_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    List all jobs for the authenticated user.
    """
    jobs = db.query(Job).filter(Job.owner_id == current_user.id).order_by(Job.created_at.desc()).all()
    return [
        {
            "job_id": job.id,
            "type": job.type,
            "goal": job.goal,
            "status": job.status,
            "created_at": job.created_at
        } 
        for job in jobs
    ]
    
@app.post("/api/jobs/{job_id}/retry")
def retry_job(job_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id, Job.owner_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Reset job for retry
    job.status = "queued"
    job.result = None
    job.input_tokens = None
    job.output_tokens = None
    job.cost = None
    db.commit()
    
    background_tasks.add_task(process_job, job.id, job.goal, job.model, db)
    return {"status": "success", "message": "Job retried"}

@app.post("/api/jobs/{job_id}/cancel")
def cancel_job(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id, Job.owner_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status not in ["queued", "processing"]:
        raise HTTPException(status_code=400, detail="Only queued or processing jobs can be cancelled")
    
    job.status = "cancelled"
    db.commit()
    return {"status": "success", "message": "Job cancelled"}

@app.get("/api/users/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email}

@app.get("/api/models")
def list_available_models():
    """
    List models supported by the backend and proxy.
    """
    return {
        "models": [
            {"id": "gemini-3-flash", "provider": "Google", "description": "极速预览"},
            {"id": "gemini-3-pro-high", "provider": "Google", "description": "最强推理"},
            {"id": "gemini-3-pro-low", "provider": "Google", "description": "轻量极速"},
            {"id": "gemini-3-pro-image", "provider": "Google", "description": "图片生成 (1:1)"},
            {"id": "gemini-2.5-flash", "provider": "Google", "description": "极速响应"},
            {"id": "gemini-2.5-flash-thinking", "provider": "Google", "description": "思维链"},
            {"id": "claude-sonnet-4-5", "provider": "Anthropic", "description": "代码推理信号 (4.5)"},
            {"id": "claude-sonnet-4-5-thinking", "provider": "Anthropic", "description": "思维链 (4.5)"},
            {"id": "claude-opus-4-5-thinking", "provider": "Anthropic", "description": "最强思维 (4.5)"}
        ]
    }

class ModelTestRequest(BaseModel):
    model_id: str
    prompt: str = "Hello, this is a test connectivity request."

@app.post("/api/models/test")
def test_model_connectivity(req: ModelTestRequest):
    """
    Directly test a model via the OpenAI client bridge.
    """
    from openai import OpenAI
    import os
    load_dotenv(env_path)
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_base = os.getenv("OPENAI_BASE_URL")
    
    if not openai_key or not openai_base:
        raise HTTPException(status_code=500, detail="Missing API credentials")
        
    try:
        client = OpenAI(base_url=openai_base, api_key=openai_key)
        response = client.chat.completions.create(
            model=req.model_id,
            messages=[{"role": "user", "content": req.prompt}],
            max_tokens=50
        )
        return {
            "status": "success",
            "response": response.choices[0].message.content,
            "usage": {
                "input": response.usage.prompt_tokens,
                "output": response.usage.completion_tokens
            }
        }
    except Exception as e:
        return {"status": "error", "detail": str(e)}

@app.get("/api/stats")
def get_usage_stats(db: Session = Depends(get_db)):
    """
    Simple usage statistics aggregated from the jobs table.
    """
    from sqlalchemy import func
    
    # Total Jobs
    total_jobs = db.query(func.count(Job.id)).scalar() or 0
    
    # Success vs Failed
    status_counts = db.query(Job.status, func.count(Job.id)).group_by(Job.status).all()
    status_map = {s: c for s, c in status_counts}
    
    # Jobs by Type
    type_counts = db.query(Job.type, func.count(Job.id)).group_by(Job.type).all()
    
    # Resource Usage
    all_metrics = db.query(Job.input_tokens, Job.output_tokens, Job.cost).all()
    total_in = 0
    total_out = 0
    total_cost = 0.0
    for jin, jout, jcost in all_metrics:
        try:
            if jin: total_in += int(jin)
            if jout: total_out += int(jout)
            if jcost: total_cost += float(jcost)
        except:
            continue
    
    # Trend Data (Last 7 Days)
    from datetime import datetime, timedelta
    today = datetime.utcnow().date()
    trends = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%m-%d")
        
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        
        day_metrics = db.query(Job.input_tokens, Job.output_tokens).filter(
            Job.created_at >= day_start,
            Job.created_at <= day_end
        ).all()
        
        day_in = 0
        day_out = 0
        for jin, jout in day_metrics:
            try:
                if jin: day_in += int(jin)
                if jout: day_out += int(jout)
            except: continue
        
        trends.append({
            "date": day_str,
            "input": day_in,
            "output": day_out
        })
    
    return {
        "total_missions": total_jobs,
        "status_distribution": status_map,
        "type_distribution": {t: c for t, c in type_counts},
        "resource_usage": {
            "total_input_tokens": total_in,
            "total_output_tokens": total_out,
            "total_cost": round(total_cost, 4)
        },
        "recent_trends": trends
    }
