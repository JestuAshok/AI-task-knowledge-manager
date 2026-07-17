from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api import deps
from app.models.user import User
from app.models.role import Role
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.services.task_service import task_service
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service

router = APIRouter(prefix="/tasks", tags=["Tasks"])

def build_task_response(task, db: Session) -> TaskResponse:
    # Helper to resolve username mappings
    assigned_user = db.query(User).filter(User.id == task.assigned_to).first()
    creator = db.query(User).filter(User.id == task.created_by).first()
    
    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        status=task.status,
        assigned_to=task.assigned_to,
        created_by=task.created_by,
        created_at=task.created_at,
        updated_at=task.updated_at,
        assigned_user_name=assigned_user.username if assigned_user else "Unknown",
        creator_name=creator.username if creator else "Unknown"
    )

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(deps.RoleChecker(["admin"])),
    db: Session = Depends(deps.get_db)
):
    task = task_service.create_task(db, task_in, creator_id=current_user.id)
    
    # Audit log task creation
    audit_service.log_activity(
        db, 
        user_id=current_user.id, 
        action="task_create", 
        details=f"Admin created task '{task.title}' assigned to user ID {task.assigned_to}"
    )
    
    # Notify assignee
    notification_service.create_notification(
        db,
        user_id=task.assigned_to,
        title="New Task Assigned",
        message=f"You have been assigned a new task: '{task.title}'"
    )
    
    return build_task_response(task, db)

@router.get("", response_model=List[TaskResponse])
def get_tasks(
    status: Optional[str] = Query(None, description="Filter by status: 'pending' or 'completed'"),
    assigned_to: Optional[int] = Query(None, description="Filter by assignee user ID"),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    tasks = task_service.get_tasks(db, status_filter=status, assigned_to_filter=assigned_to)
    return [build_task_response(t, db) for t in tasks]

@router.patch("/{id}/status", response_model=TaskResponse)
def update_task_status(
    id: int,
    task_update: TaskUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    role_name = role.name if role else "user"
    
    task = task_service.update_task_status(
        db, 
        task_id=id, 
        new_status=task_update.status, 
        current_user=current_user, 
        user_role=role_name
    )
    
    # Audit log status update
    audit_service.log_activity(
        db, 
        user_id=current_user.id, 
        action="task_update", 
        details=f"Task '{task.title}' status updated to '{task_update.status}'"
    )
    
    # Notify appropriate user
    if current_user.id == task.assigned_to:
        notification_service.create_notification(
            db,
            user_id=task.created_by,
            title="Task Status Updated",
            message=f"User '{current_user.username}' marked task '{task.title}' as '{task.status}'"
        )
    else:
        notification_service.create_notification(
            db,
            user_id=task.assigned_to,
            title="Task Status Updated",
            message=f"Admin marked task '{task.title}' as '{task.status}'"
        )
    
    return build_task_response(task, db)
