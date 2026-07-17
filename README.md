# AetherFlow IQ: AI-Powered Task & Knowledge Management System

AetherFlow IQ is a high-performance, production-grade Minimum Viable Product (MVP) that integrates User Identity Management, Role-Based Access Control (RBAC), and Task Workflows with local AI-powered Semantic Search.

Developed using **FastAPI**, **React.js**, **MySQL**, and **FAISS (Facebook AI Similarity Search)** with a custom **NumPy-powered Local Vector Store fallback**, this system allows administrators to assign tasks and build a knowledge base, which users can search using local vector embeddings (no external API keys needed) to get answers and complete assignments.

---

## 🛠️ System Architecture & AI Pipeline

```
[Document Upload (PDF/TXT)] ──> [Text Extraction (pypdf)] ──> [Recursive Boundary Chunking]
                                                                        │
[FAISS Cosine Search Matches] <── [FAISS Index / NumPy Store] <── [Local MiniLM Embeddings (384d)]
```

### 1. The Semantic Search Core
*   **Embedding Model**: `sentence-transformers/all-MiniLM-L6-v2`. This model processes natural language queries locally into 384-dimensional dense vectors on CPU, achieving low latency and zero external API dependencies.
*   **Vector Database (FAISS)**: The application utilizes **FAISS (`faiss-cpu`)** using an Inner Product Index (`IndexFlatIP`). By L2-normalizing embeddings upon insertion and query (using `faiss.normalize_L2`), the inner product search results are mathematically identical to Cosine Similarity.
*   **Resilient Fallback**: To ensure compile-free portability across all operating systems and environments, the application includes a custom NumPy-based similarity search engine that activates automatically if the FAISS binary is unavailable.
*   **Semantic Text Chunking**: Raw files are chunked recursively at `500` characters with a `50`-character overlap. The parser looks backward for natural whitespace boundaries, preventing mid-word splitting to preserve context.

### 2. Relational Schema Normalization (MySQL)
Our database design utilizes strict primary/foreign keys and index optimizations:
*   `roles` (PK) -> Standardizes RBAC (`admin`, `user`).
*   `users` (PK, FK -> roles) -> Encrypts passwords using `bcrypt`.
*   `tasks` (PK, FK -> users) -> Stores assignment relations and workflow states.
*   `documents` (PK, FK -> users) -> Saves files on disk with index references.
*   `activity_logs` (PK, FK -> users) -> High-frequency audit trail logs.
*   `notifications` (PK, FK -> users) -> Logs task creation and knowledge updates.

---

## 🚀 Getting Started

### Prerequisites
*   **Python 3.10+** (Includes support for pip / virtual env)
*   **Node.js 18+** (Includes npm package runner)
*   **MySQL Server** (Running on `localhost:3306` with `root` user and password configured in your environment. To customize database credentials, modify `DATABASE_URL` in `backend/.env`).

---

### ⚡ Option A: Quick Bootstrap (Recommended)
An automated bootstrapping script is provided that creates the MySQL database, seeds default users, and boots up both backend and frontend servers in separate processes.

1. Open **PowerShell** as an administrator.
2. Navigate to the project root directory.
3. Run the bootstrapper:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\run.ps1
   ```

---

### 🛠️ Option B: Manual Setup

#### 1. Setup Backend
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .\.venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Verify/Create the MySQL Database and seed default values:
   ```bash
   python setup_db.py
   ```
5. Run the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

#### 2. Setup Frontend
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install Node modules:
   ```bash
   npm install
   ```
3. Boot the Vite local dev server:
   ```bash
   npm run dev
   ```

---

## 🔑 Default Credentials for Testing
During database initialization, two users are seeded automatically:

| Username | Password | Role | Description |
|---|---|---|---|
| `admin` | `adminpassword` | `admin` | Full control: create tasks, upload documents, inspect audit logs, and view queries. |
| `user` | `userpassword` | `user` | Standard User: view/complete assigned tasks, execute AI search. |

*Note: You can also use the **Role Selection** dropdown on the `/register` page to instantly create new administrators or users for testing.*

---

## 📊 Core API Endpoints

*   **Authentication**:
    *   `POST /auth/register` - Create standard or admin accounts.
    *   `POST /auth/login` - Handshakes with Swagger or React clients using JWT.
    *   `GET /auth/me` - Profile session checker.
    *   `GET /auth/users` - Fetches registered accounts (for task assignment).
*   **Task Management**:
    *   `GET /tasks` - Lists tasks. Supports filtering by `status` (pending/completed) and `assigned_to` (user ID).
    *   `POST /tasks` - Assigns tasks (Admin only).
    *   `PATCH /tasks/{id}/status` - Completes assigned tasks.
*   **Knowledge Base & AI Search**:
    *   `POST /documents` - Drag-and-drop file upload. Extract & embed text into the Vector Store (Admin only).
    *   `GET /documents` - Returns uploaded files metadata.
    *   `POST /search` - Semantic cosine similarity search query endpoint.
*   **Analytics & Audits**:
    *   `GET /analytics` - Renders system metrics, top search terms, and live activity logs.

---

## 💡 Staff Engineer Design Decisions

*   **FAISS Vector Storage with Fallback**:
    Integrated FB's FAISS library for professional high-dimensional indexing on CPU. A robust fallback to vectorized NumPy dot-product calculations was built in to prevent application crashes in environments where FAISS binary imports fail.
*   **Resilient Multi-Stage File Uploader**:
    PDF/TXT parsers validate extraction buffers before creating database records. If saving to disk or index vectorization fails, the database session executes a rollback, avoiding orphaned rows.
*   **Optimistic UI Updates on Frontend**:
    When a user toggles a task checkbox, the React client instantly triggers an optimistic state transition, ensuring the UI feels fluid and fast. If the backend patch fails, the state rolls back, showing an error alert.
*   **JWT Authorization with RBAC Dependencies**:
    Standardized FastAPI endpoint dependencies (`deps.RoleChecker(["admin"])`) enforce role checks, preventing unauthorized user accounts from invoking file uploads or creating tasks.

---

## 🗣️ Internship Interview Talking Points

1. **"Why semantic search instead of keyword search?"**
   *Keyword search (like SQL LIKE or BM25) fails when users search for concepts using different words (e.g., searching 'server down' instead of 'system outage'). Vector search computes embeddings that match concepts based on semantic closeness (cosine angle), allowing users to find answers even with different phrasing.*
2. **"Why did you choose to use FAISS?"**
   *FAISS (Facebook AI Similarity Search) is the industry standard for high-performance dense vector search. For our project, we implemented `IndexFlatIP` combined with vector L2 normalization to compute exact, highly efficient Cosine Similarity matchings locally on the host CPU.*
3. **"How did you secure user roles?"**
   *I designed role-based check gates using FastAPI dependency injection. The router calls a role verification class that intercepts the JWT token, fetches the user's role relation in MySQL, and raises a 403 Forbidden error before executing any business logic if roles do not match.*
4. **"Why did you use local embeddings?"**
   *Relying on OpenAI APIs introduces network latency, incurs costs, and requires API keys. By packing HuggingFace's `all-MiniLM-L6-v2` locally inside FastAPI, we get fast, free CPU embedding computations, which is perfect for an offline, self-contained corporate intranet MVP.*
