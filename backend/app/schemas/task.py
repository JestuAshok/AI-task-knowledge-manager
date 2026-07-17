from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = "pending"

class TaskCreate(TaskBase):
    assigned_to: int

class TaskUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|completed)$")

class TaskResponse(TaskBase):
    id: int
    assigned_to: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    assigned_user_name: Optional[str] = None
    creator_name: Optional[str] = None

    class Config:
        from_attributes = True
