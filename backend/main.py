from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
import uuid
import sys
import os
import json

# Ensure backend directory is in path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agent.workflow import run_agent
from database import engine, SessionLocal, Base, get_db
from models import Job

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JobRequestModel(BaseModel):
    type: str
    goal: str
    email: Optional[str] = None

class JobResponseModel(BaseModel):
    job_id: str
    status: str
    result: Optional[dict] = None # Return result as dict

def process_job(job_id: str, goal: str, db: Session):
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
        result = run_agent(goal)
        
        job.status = "completed"
        job.result = json.dumps(result) # Store as JSON string
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

@app.post("/api/jobs")
def create_job(job_req: JobRequestModel, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    job_id = str(uuid.uuid4())
    
    new_job = Job(
        id=job_id,
        type=job_req.type,
        goal=job_req.goal,
        email=job_req.email,
        status="queued"
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    # Run the agent in the background
    background_tasks.add_task(process_job, job_id, job_req.goal, db)
    
    print(f"Queued job {job_id} for {job_req.type}: {job_req.goal}")
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
        "goal": job.goal
    }
