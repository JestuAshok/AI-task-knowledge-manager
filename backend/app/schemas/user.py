from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: str = Field(..., max_length=150)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)
    role_id: Optional[int] = None

class UserResponse(UserBase):
    id: int
    role_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserWithRoleResponse(UserResponse):
    role_name: str
