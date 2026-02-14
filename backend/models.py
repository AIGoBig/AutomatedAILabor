from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    jobs = relationship("Job", back_populates="owner")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)
    type = Column(String, index=True)
    goal = Column(Text)
    status = Column(String, default="queued")
    result = Column(Text, nullable=True) # Storing JSON as text for SQLite simplicity
    created_at = Column(DateTime, default=datetime.utcnow)
    email = Column(String, nullable=True)
    payment_status = Column(String, default="pending") # pending, paid, failed
    amount = Column(String, default="5.00")
    model = Column(String, nullable=True, default="gemini-3-flash")

    
    owner_id = Column(String, ForeignKey("users.id"), nullable=True) # Check if we want to enforce user ownership later
    owner = relationship("User", back_populates="jobs")

    # Metrics
    input_tokens = Column(String, nullable=True)
    output_tokens = Column(String, nullable=True)
    cost = Column(String, nullable=True)
