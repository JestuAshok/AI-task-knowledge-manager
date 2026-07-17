from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import router_auth, router_tasks, router_docs, router_search, router_analytics, router_notifications

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend services for user identity, task tracking, file upload, activity logging, and ChromaDB vector search",
    version="1.0.0"
)

# Configure CORS for React client on Vite
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(router_auth.router)
app.include_router(router_tasks.router)
app.include_router(router_docs.router)
app.include_router(router_search.router)
app.include_router(router_analytics.router)
app.include_router(router_notifications.router)

@app.get("/")
def read_root():
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME} API Service",
        "swagger_docs": "/docs",
        "redoc_docs": "/redoc"
    }
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
