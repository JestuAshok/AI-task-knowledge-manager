import os
import pickle
from typing import List, Dict, Any
import numpy as np
from sentence_transformers import SentenceTransformer

from app.core.config import settings

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False

class AIService:
    def __init__(self):
        # Ensure database directory exists
        os.makedirs(settings.CHROMA_DB_DIR, exist_ok=True)
        self.db_path = os.path.join(settings.CHROMA_DB_DIR, "vector_store.pkl")
        
        # Load local storage
        self.store = self._load_store()
        
        # Lazily load sentence transformer model
        self._model = None
        
        # Initialize FAISS Index
        self.faiss_index = None
        self._build_faiss_index()

    def _load_store(self) -> Dict[str, List[Any]]:
        if os.path.exists(self.db_path):
            try:
                with open(self.db_path, "rb") as f:
                    return pickle.load(f)
            except Exception as e:
                print(f"Error loading Pickle vector store: {e}. Initiating fresh DB.")
        return {
            "ids": [],
            "embeddings": [],
            "documents": [],
            "metadatas": []
        }

    def _save_store(self) -> None:
        try:
            with open(self.db_path, "wb") as f:
                pickle.dump(self.store, f)
        except Exception as e:
            print(f"Error saving Pickle vector store: {e}")

    def _build_faiss_index(self) -> None:
        if not FAISS_AVAILABLE:
            print("FAISS package is not installed/available. Using custom NumPy vector store.")
            self.faiss_index = None
            return
            
        if not self.store["embeddings"]:
            print("Pickle store is empty. FAISS index will be built when documents are added.")
            self.faiss_index = None
            return
            
        try:
            embeddings_arr = np.array(self.store["embeddings"]).astype('float32')
            # Normalize embeddings to unit length for Cosine Similarity (equivalent to Inner Product on normalized vectors)
            faiss.normalize_L2(embeddings_arr)
            dimension = embeddings_arr.shape[1]
            index = faiss.IndexFlatIP(dimension)
            index.add(embeddings_arr)
            self.faiss_index = index
            print(f"Successfully initialized FAISS IndexFlatIP vector index with {len(self.store['ids'])} vectors.")
        except Exception as e:
            print(f"Error building FAISS index: {e}. Falling back to custom NumPy vector store.")
            self.faiss_index = None

    @property
    def model(self) -> SentenceTransformer:
        if self._model is None:
            print("Loading local SentenceTransformer model 'all-MiniLM-L6-v2'...")
            self._model = SentenceTransformer("all-MiniLM-L6-v2")
            print("SentenceTransformer model loaded successfully.")
        return self._model

    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """
        Splits raw text into readable semantic chunks with overlapping boundaries.
        """
        # Normalize whitespace
        text = " ".join(text.split())
        
        chunks = []
        start = 0
        text_len = len(text)
        
        if text_len <= chunk_size:
            return [text] if text else []
            
        while start < text_len:
            end = start + chunk_size
            
            # Adjust to word boundary to prevent cutting words
            if end < text_len:
                space_idx = text.rfind(" ", start, end)
                if space_idx > start + (chunk_size // 2):
                    end = space_idx
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
                
            start = end - overlap
            if start >= text_len or (end == text_len):
                break
                
        return chunks

    def add_document(self, doc_id: int, doc_title: str, text: str) -> None:
        """
        Chunks the document text, extracts vector embeddings, and registers them in the local store.
        """
        chunks = self.chunk_text(text)
        if not chunks:
            print(f"Document ID {doc_id} has no valid text chunks. Skipping vectorization.")
            return
            
        # Compute embeddings for all chunks locally
        embeddings = self.model.encode(chunks).tolist()
        
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_id = f"doc_{doc_id}_chunk_{i}"
            
            # Remove existing chunk ID if it already exists (prevents duplication on overwrite)
            if chunk_id in self.store["ids"]:
                idx = self.store["ids"].index(chunk_id)
                self.store["ids"].pop(idx)
                self.store["embeddings"].pop(idx)
                self.store["documents"].pop(idx)
                self.store["metadatas"].pop(idx)
                
            self.store["ids"].append(chunk_id)
            self.store["embeddings"].append(embedding)
            self.store["documents"].append(chunk)
            self.store["metadatas"].append({
                "document_id": doc_id,
                "document_title": doc_title,
                "chunk_index": i
            })
            
        self._save_store()
        self._build_faiss_index()
        print(f"Successfully vectorized and indexed {len(chunks)} chunks in local Vector DB for: '{doc_title}'")

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Vector search for relevant knowledge snippets using FAISS or custom NumPy cosine similarity.
        """
        if not query.strip() or not self.store["ids"]:
            return []
            
        # Encode query
        query_embedding = self.model.encode(query)
        
        # Try FAISS search if available
        if self.faiss_index is not None:
            try:
                q_vec = np.array([query_embedding]).astype('float32')
                faiss.normalize_L2(q_vec)
                scores, indices = self.faiss_index.search(q_vec, top_k)
                
                parsed_results = []
                for score, idx in zip(scores[0], indices[0]):
                    if idx == -1 or idx >= len(self.store["ids"]):
                        continue
                    metadata = self.store["metadatas"][idx]
                    parsed_results.append({
                        "id": self.store["ids"][idx],
                        "document_id": metadata["document_id"],
                        "document_title": metadata["document_title"],
                        "content": self.store["documents"][idx],
                        "score": round(float(score), 4)
                    })
                print(f"FAISS search resolved {len(parsed_results)} results.")
                return parsed_results
            except Exception as e:
                print(f"FAISS search failed: {e}. Falling back to NumPy similarity.")
                
        # Calculate cosine similarity: dot(A, B) / (norm(A) * norm(B))
        q_vec = np.array(query_embedding)
        emb_matrix = np.array(self.store["embeddings"])
        
        q_norm = np.linalg.norm(q_vec)
        emb_norms = np.linalg.norm(emb_matrix, axis=1)
        
        # Prevent division by zero
        emb_norms[emb_norms == 0] = 1e-10
        if q_norm == 0:
            q_norm = 1e-10
            
        # Vectorized cosine similarity calculation
        similarities = np.dot(emb_matrix, q_vec) / (emb_norms * q_norm)
        
        parsed_results = []
        for i in range(len(self.store["ids"])):
            similarity = float(similarities[i])
            metadata = self.store["metadatas"][i]
            parsed_results.append({
                "id": self.store["ids"][i],
                "document_id": metadata["document_id"],
                "document_title": metadata["document_title"],
                "content": self.store["documents"][i],
                "score": round(similarity, 4)
            })
            
        # Sort results by similarity score descending
        parsed_results.sort(key=lambda x: x["score"], reverse=True)
        print(f"NumPy similarity search resolved {len(parsed_results[:top_k])} results.")
        return parsed_results[:top_k]

    def delete_document(self, doc_id: int) -> None:
        """
        Deletes all vector chunks associated with a specific document ID.
        """
        new_ids = []
        new_embeddings = []
        new_documents = []
        new_metadatas = []
        
        for i in range(len(self.store["ids"])):
            if self.store["metadatas"][i]["document_id"] != doc_id:
                new_ids.append(self.store["ids"][i])
                new_embeddings.append(self.store["embeddings"][i])
                new_documents.append(self.store["documents"][i])
                new_metadatas.append(self.store["metadatas"][i])
                
        self.store["ids"] = new_ids
        self.store["embeddings"] = new_embeddings
        self.store["documents"] = new_documents
        self.store["metadatas"] = new_metadatas
        
        self._save_store()
        self._build_faiss_index()
        print(f"Deleted all vectorized chunks for document ID {doc_id} from local Vector DB.")

ai_service = AIService()

