from sqlalchemy import Column, String, Text, DateTime
from datetime import datetime
from database import Base

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
