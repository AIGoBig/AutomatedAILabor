from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends, status
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
from jose import JWTError, jwt
from dotenv import load_dotenv

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

from agent.workflow import run_agent
from database import engine, SessionLocal, Base, get_db
from models import Job, User
from auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY

# Create tables (SQLite) - in production use Alembic
Base.metadata.create_all(bind=engine)

app = FastAPI()

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
    Background task wrapper for the agent.
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
def health_check():
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
            status_code=status.HTTP_410_GONE,
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
    
    # Run the agent in the background
    background_tasks.add_task(process_job, job_id, job_req.goal, job_req.model, db)
    
    print(f"Queued job {job_id} for {job_req.type}: {job_req.goal} (User: {user_id})")
    return {"job_id": job_id, "status": "queued"}

@app.get("/api/jobs/{job_id}")
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Parse result back to JSON if it exists
    result_data = None
    if job.result:
        try:
            result_data = json.loads(job.result)
        except:
            result_data = {"raw": job.result}
            
    return {
        "job_id": job.id,
        "status": job.status,
        "result": result_data,
        "type": job.type,
        "goal": job.goal,
        "input_tokens": job.input_tokens,
        "output_tokens": job.output_tokens,
        "cost": job.cost
    }

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
    
    return {
        "total_missions": total_jobs,
        "status_distribution": status_map,
        "type_distribution": {t: c for t, c in type_counts},
        "resource_usage": {
            "total_input_tokens": total_in,
            "total_output_tokens": total_out,
            "total_cost": round(total_cost, 4)
        },
        "recent_trends": []
    }
