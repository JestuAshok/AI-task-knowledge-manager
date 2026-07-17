from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from app.api import deps
from app.core.security import create_access_token
from app.models.role import Role
from app.schemas.auth import Token
from app.schemas.user import UserCreate, UserWithRoleResponse
from app.services.auth_service import auth_service
from app.services.audit_service import audit_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserWithRoleResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(deps.get_db)):
    user = auth_service.register(db, user_in)
    role = db.query(Role).filter(Role.id == user.role_id).first()
    
    # Return user with role name
    response_data = UserWithRoleResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role_id=user.role_id,
        created_at=user.created_at,
        role_name=role.name if role else "user"
    )
    return response_data

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(deps.get_db)
):
    # Standard OAuth2 login path
    user = auth_service.authenticate(db, form_data.username, form_data.password)
    if not user:
        # Audit log failed login
        audit_service.log_activity(db, user_id=None, action="login", details=f"Failed login attempt for username: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    role = db.query(Role).filter(Role.id == user.role_id).first()
    role_name = role.name if role else "user"
    
    user_response = UserWithRoleResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role_id=user.role_id,
        created_at=user.created_at,
        role_name=role_name
    )
    
    access_token = create_access_token(subject=user.id)
    
    # Audit log successful login
    audit_service.log_activity(db, user_id=user.id, action="login", details=f"User {user.username} logged in successfully")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@router.get("/me", response_model=UserWithRoleResponse)
def read_current_user(
    current_user = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    return UserWithRoleResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role_id=current_user.role_id,
        created_at=current_user.created_at,
        role_name=role.name if role else "user"
    )

@router.get("/users", response_model=List[UserWithRoleResponse])
def read_users(
    current_user = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    from app.models.user import User
    users = db.query(User).all()
    response_users = []
    for u in users:
        role = db.query(Role).filter(Role.id == u.role_id).first()
        response_users.append(UserWithRoleResponse(
            id=u.id,
            username=u.username,
            email=u.email,
            role_id=u.role_id,
            created_at=u.created_at,
            role_name=role.name if role else "user"
        ))
    return response_users

