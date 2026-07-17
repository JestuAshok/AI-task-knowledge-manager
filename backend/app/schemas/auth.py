from pydantic import BaseModel
from app.schemas.user import UserWithRoleResponse

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserWithRoleResponse

class TokenPayload(BaseModel):
    sub: str = None
