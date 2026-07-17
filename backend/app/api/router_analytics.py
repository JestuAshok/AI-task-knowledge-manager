from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("")
def read_analytics(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    # Both Admins and Users can view analytics (Admins get full view on frontend)
    return analytics_service.get_dashboard_analytics(db)
