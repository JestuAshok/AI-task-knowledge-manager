from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api import deps
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.services.doc_service import doc_service
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service

router = APIRouter(prefix="/documents", tags=["Documents"])

def build_doc_response(doc: Document, db: Session) -> DocumentResponse:
    # Helper to resolve username mappings
    uploader = db.query(User).filter(User.id == doc.uploaded_by).first()
    return DocumentResponse(
        id=doc.id,
        title=doc.title,
        file_path=doc.file_path,
        file_type=doc.file_type,
        uploaded_by=doc.uploaded_by,
        uploaded_at=doc.uploaded_at,
        uploader_name=uploader.username if uploader else "Unknown"
    )

@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(deps.RoleChecker(["admin"])),
    db: Session = Depends(deps.get_db)
):
    filename = file.filename
    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File has no filename"
        )
        
    # Check file extension
    ext = filename.split(".")[-1].lower()
    if ext not in ["txt", "pdf"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and TXT files are supported"
        )
        
    file_bytes = await file.read()
    
    # Delegate parsing, storage, and indexing
    doc = doc_service.create_document(
        db=db,
        title=title,
        file_bytes=file_bytes,
        filename=filename,
        file_type=ext,
        uploader_id=current_user.id
    )
    
    # Audit log document upload
    audit_service.log_activity(
        db,
        user_id=current_user.id,
        action="document_upload",
        details=f"Admin uploaded document '{title}' ({ext})"
    )
    
    # Notify other users about the new knowledge asset
    users = db.query(User).all()
    for u in users:
        if u.id != current_user.id:
            notification_service.create_notification(
                db,
                user_id=u.id,
                title="New Knowledge Asset Available",
                message=f"A new knowledge asset has been uploaded: '{doc.title}' ({doc.file_type.upper()})"
            )
            
    return build_doc_response(doc, db)

@router.get("", response_model=List[DocumentResponse])
def get_documents(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    docs = doc_service.get_all_documents(db)
    return [build_doc_response(doc, db) for doc in docs]
