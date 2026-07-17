from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.api import deps
from app.models.user import User
from app.schemas.search import SearchQuery, SearchResult, SearchChunk
from app.services.ai_service import ai_service
from app.services.audit_service import audit_service

router = APIRouter(prefix="/search", tags=["Semantic Search"])

@router.post("", response_model=SearchResult)
def semantic_search(
    search_query: SearchQuery,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    # Query matching vector chunks in ChromaDB
    chunks = ai_service.search(query=search_query.query, top_k=search_query.top_k)
    
    # Audit log the search query
    audit_service.log_activity(
        db,
        user_id=current_user.id,
        action="search",
        details=f"User searched for query: '{search_query.query}'"
    )
    
    # Map results
    response_chunks = [
        SearchChunk(
            document_id=c["document_id"],
            document_title=c["document_title"],
            content=c["content"],
            score=c["score"]
        )
        for c in chunks
    ]
    
    return SearchResult(
        query=search_query.query,
        results=response_chunks
    )
