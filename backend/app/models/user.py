from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    role = relationship("Role", back_populates="users")
    
    # We reference foreign keys explicitly using string notations to avoid circular import issues
    assigned_tasks = relationship("Task", foreign_keys="[Task.assigned_to]", back_populates="assigned_user")
    created_tasks = relationship("Task", foreign_keys="[Task.created_by]", back_populates="creator")
    documents = relationship("Document", back_populates="uploader")
    activity_logs = relationship("ActivityLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
