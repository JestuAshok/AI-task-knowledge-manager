from pydantic import BaseModel
from datetime import datetime

class DocumentBase(BaseModel):
    title: str
    file_type: str

class DocumentResponse(DocumentBase):
    id: int
    file_path: str
    uploaded_by: int
    uploaded_at: datetime
    uploader_name: str

    class Config:
        from_attributes = True
