from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate

class TaskService:
    @staticmethod
    def create_task(db: Session, task_in: TaskCreate, creator_id: int) -> Task:
        # Check if assigned user exists
        assigned_user = db.query(User).filter(User.id == task_in.assigned_to).first()
        if not assigned_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Assigned user with ID {task_in.assigned_to} not found"
            )
            
        db_task = Task(
            title=task_in.title,
            description=task_in.description,
            status=task_in.status or "pending",
            assigned_to=task_in.assigned_to,
            created_by=creator_id
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task

    @staticmethod
    def get_tasks(db: Session, status_filter: Optional[str] = None, assigned_to_filter: Optional[int] = None) -> List[Task]:
        query = db.query(Task)
        
        if status_filter:
            query = query.filter(Task.status == status_filter)
            
        if assigned_to_filter is not None:
            query = query.filter(Task.assigned_to == assigned_to_filter)
            
        return query.all()

    @staticmethod
    def update_task_status(db: Session, task_id: int, new_status: str, current_user: User, user_role: str) -> Task:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
            
        # Role authorization check: Users can only update their own assigned tasks. Admins can update any.
        if user_role != "admin" and task.assigned_to != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot update status for a task not assigned to you"
            )
            
        task.status = new_status
        db.commit()
        db.refresh(task)
        return task

task_service = TaskService()
