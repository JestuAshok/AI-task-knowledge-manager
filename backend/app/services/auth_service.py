from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserCreate

class AuthService:
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def authenticate(db: Session, username_or_email: str, password: str) -> Optional[User]:
        # Authenticate by username or email
        user = db.query(User).filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        ).first()
        
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    @staticmethod
    def register(db: Session, user_in: UserCreate) -> User:
        # Check if username or email already exists
        if AuthService.get_user_by_username(db, user_in.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
            
        if AuthService.get_user_by_email(db, user_in.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Default role is "user" if role_id not specified
        if user_in.role_id is None:
            user_role = db.query(Role).filter(Role.name == "user").first()
            if not user_role:
                # If roles not seeded, default to role ID 2 (standard user fallback)
                role_id = 2
            else:
                role_id = user_role.id
        else:
            role_id = user_in.role_id

        db_user = User(
            username=user_in.username,
            email=user_in.email,
            password_hash=get_password_hash(user_in.password),
            role_id=role_id
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

auth_service = AuthService()
