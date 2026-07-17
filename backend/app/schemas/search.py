from pydantic import BaseModel
from typing import List, Optional

class SearchQuery(BaseModel):
    query: str
    top_k: Optional[int] = 5

class SearchChunk(BaseModel):
    document_id: int
    document_title: str
    content: str
    score: float

class SearchResult(BaseModel):
    query: str
    results: List[SearchChunk]
