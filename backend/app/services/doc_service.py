import os
import io
import pypdf
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.document import Document
from app.services.ai_service import ai_service

class DocService:
    @staticmethod
    def extract_text(file_bytes: bytes, file_type: str) -> str:
        if file_type == "txt":
            try:
                return file_bytes.decode("utf-8")
            except UnicodeDecodeError:
                try:
                    return file_bytes.decode("latin-1")
                except Exception as e:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Unable to decode text file: {e}"
                    )
        elif file_type == "pdf":
            try:
                pdf_file = io.BytesIO(file_bytes)
                reader = pypdf.PdfReader(pdf_file)
                extracted_text = ""
                for i, page in enumerate(reader.pages):
                    page_text = page.extract_text()
                    if page_text:
                        extracted_text += page_text + "\n"
                return extracted_text
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unable to parse PDF document: {e}"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file_type}. Only 'pdf' and 'txt' are allowed."
            )

    @staticmethod
    def create_document(
        db: Session, 
        title: str, 
        file_bytes: bytes, 
        filename: str, 
        file_type: str, 
        uploader_id: int
    ) -> Document:
        # 1. Extract text first to ensure it's valid before saving records
        extracted_text = DocService.extract_text(file_bytes, file_type)
        if not extracted_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Extracted document text is empty"
            )

        # 2. Ensure upload dir exists
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

        # 3. Create document record in DB to obtain unique auto-increment ID
        db_doc = Document(
            title=title,
            file_path="TEMPORARY_PATH",
            file_type=file_type,
            uploaded_by=uploader_id
        )
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)

        # 4. Save file to disk using ID prefix to prevent name conflicts
        clean_filename = f"doc_{db_doc.id}_{filename.replace(' ', '_')}"
        destination_path = os.path.join(settings.UPLOAD_DIR, clean_filename)
        
        try:
            with open(destination_path, "wb") as f:
                f.write(file_bytes)
        except Exception as e:
            # Rollback DB record if disk write fails
            db.delete(db_doc)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save document file to disk: {e}"
            )

        # Update correct path in database
        db_doc.file_path = destination_path
        db.commit()
        db.refresh(db_doc)

        # 5. Index into ChromaDB vector database
        try:
            ai_service.add_document(db_doc.id, db_doc.title, extracted_text)
        except Exception as e:
            # We log the error but don't crash since the file is already stored in MySQL and disk
            print(f"Error vectorizing document ID {db_doc.id}: {e}")
            
        return db_doc

    @staticmethod
    def get_all_documents(db: Session) -> list[Document]:
        return db.query(Document).all()

doc_service = DocService()
