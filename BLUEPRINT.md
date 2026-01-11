# Student Career Counselor AI - Project Blueprint

## 1. Directory Structure (Monorepo)

The project will use a monorepo structure to house both the Next.js frontend and FastAPI backend, along with shared configurations and docker setup.

```
career-compass/
├── docker-compose.yml          # Orchestrates Frontend, Backend, and DB services
├── README.md                   # Project documentation
├── .env.example                # Template for environment variables
├── frontend/                   # Next.js Application (User Interface)
│   ├── src/
│   │   ├── app/                # Next.js App Router pages
│   │   ├── components/         # Reusable UI components
│   │   ├── lib/                # API clients, utility functions
│   │   └── types/              # TypeScript definitions
│   ├── public/                 # Static assets
│   ├── package.json
│   ├── next.config.ts
│   └── Dockerfile
├── backend/                    # FastAPI Application (Logic & AI)
│   ├── app/
│   │   ├── main.py             # Entry point
│   │   ├── api/                # API route handlers
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/  # Users, Roadmaps, Chat
│   │   ├── core/               # Config, Security, Database connection
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic models (Request/Response)
│   │   ├── services/           # Business logic
│   │   │   ├── roadmap_gen.py  # Roadmap generation logic
│   │   │   ├── rag_engine.py   # RAG implementation
│   │   │   └── agents/         # Background agents
│   │   └── db/
│   │       └── base.py
│   ├── requirements.txt
│   └── Dockerfile
└── database/                   # Database scripts
    └── init.sql                # Initial schema setup (if not using alembic immediately)
```

## 2. Data Models (PostgreSQL + pgvector)

We will use PostgreSQL for relational data and `pgvector` for storing embeddings.

### Users Table
Stores student information and preferences.
- `id` (UUID, PK)
- `email` (String, Unique)
- `hashed_password` (String)
- `full_name` (String)
- `academic_level` (Enum: HighSchool, Undergraduate, etc.)
- `created_at` (Timestamp)

### Profiles Table
Extended details used for roadmap generation.
- `id` (UUID, PK, FK -> Users.id)
- `interests` (JSONB): List of interests/hobbies.
- `transcript_summary` (Text): Parsed summary of uploaded transcripts.
- `skills` (JSONB): List of current skills.

### Roadmaps Table
The generated career paths.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> Users.id)
- `title` (String): e.g., "Full Stack Developer Path"
- `content` (JSONB): Structured roadmap data (milestones, resources, timeline).
- `status` (Enum: Active, Completed, Archived)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### RoadmapMilestones Table
Granular steps within a roadmap (optional normalization).
- `id` (UUID, PK)
- `roadmap_id` (UUID, FK -> Roadmaps.id)
- `title` (String)
- `description` (Text)
- `status` (Enum: Pending, In_Progress, Done)

### ChatSessions Table
History of conversations with the AI.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> Users.id)
- `title` (String)
- `created_at` (Timestamp)

### ChatMessages Table
Individual messages.
- `id` (UUID, PK)
- `session_id` (UUID, FK -> ChatSessions.id)
- `role` (Enum: user, assistant)
- `content` (Text)
- `timestamp` (Timestamp)

### VectorStore (pgvector)
Stores embeddings for RAG (documents regarding colleges, courses, career paths).
- `id` (UUID, PK)
- `content` (Text): The actual text chunk.
- `metadata` (JSONB): Source, title, etc.
- `embedding` (Vector): 1536-dim (or specific to model) embedding.

## 3. Agentic Strategy

The system will employ a "Human-in-the-loop" style asynchronous agent architecture using FastAPI background tasks (or Celery if scaling is needed later).

### 1. Roadmap Generator Agent
- **Trigger**: User uploads a transcript or updates their profile interests.
- **Action**:
    1.  Analyzes the transcript (PDF parsing).
    2.  Matches skills and academic history against career databases (via RAG).
    3.  Generates a structured JSON roadmap.
    4.  Saves to `Roadmaps` table.
    5.  Notifies user (via UI polling or WebSocket).

### 2. Roadmap Updater Agent (The "Background" Agent)
- **Trigger**: Periodic (weekly) or Event-based (User marks a milestone as complete).
- **Action**:
    1.  Checks if the completed milestone changes the trajectory (e.g., failed a prerequisite, discovered a new passion).
    2.  Re-evaluates the remaining roadmap.
    3.  If a better path is found, it creates a "Suggestion" or auto-updates the roadmap depending on configuration.
    4.  Logs the rationale for the update.

### 3. RAG Context Agent
- **Trigger**: User asks a question in Chat.
- **Action**:
    1.  Converts query to vector.
    2.  Retrieves relevant career/course info from `VectorStore`.
    3.  Retrieves user's current `Roadmap` context.
    4.  Synthesizes answer specific to *this* user's path.

## 4. Implementation Phase List

These tasks are designed to be executed sequentially.

### Phase 1: Infrastructure & Boilerplate
1.  **Repo Setup**: Initialize Git, create folder structure.
2.  **Docker Setup**: Configure `docker-compose.yml` for Postgres (with pgvector image), Backend, and Frontend.
3.  **Backend Init**: Initialize FastAPI app, configure DB connection (Async SQLAlchemy).
4.  **Frontend Init**: Initialize Next.js app with Tailwind CSS.

### Phase 2: Database & Auth
1.  **Schema Implementation**: Define SQLAlchemy models for Users, Profiles.
2.  **Migrations**: Run initial Alembic migrations.
3.  **Authentication**: Implement JWT registration/login endpoints in FastAPI.
4.  **Frontend Auth**: Build Login/Register pages and integrate with backend.

### Phase 3: Core Logic (Roadmaps)
1.  **Profile API**: Endpoints to update interests and upload transcripts (mock parsing initially).
2.  **Roadmap Model**: Define Roadmap tables.
3.  **Generator Logic**: Create the `Roadmap Generator Agent` (prompt engineering with LLM API).
4.  **Frontend Roadmap UI**: Dashboard to view the generated roadmap structure.

### Phase 4: RAG & Chatbot
1.  **Vector DB Setup**: Enable `pgvector` extension and create VectorStore table.
2.  **Ingestion Script**: Script to load career data/documents, embed them, and store in DB.
3.  **Chat API**: Endpoint for sending messages, performing retrieval, and generating response.
4.  **Chat UI**: Chat interface in Next.js.

### Phase 5: Advanced Agentic Features & Polish
1.  **Background Updater**: Implement the `Roadmap Updater Agent` logic.
2.  **WebSockets**: Real-time notifications for agent updates.
3.  **UI Polish**: Animations, responsive design, "Premium" aesthetics.
4.  **Testing & Deployment Prep**: Unit tests, final container checks.
