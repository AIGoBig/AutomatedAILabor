# Technical Architecture Document (TAD)
**Project:** Automated AI Labor - MVP
**Date:** 2026-02-10

## 1. High-Level Architecture
We are building a distributed system where the frontend initiates long-running, complex tasks executed by a backend orchestrator.

### Components
1.  **Client (Next.js):** The "Face". Handles User Requests, Auth (Clerk/Auth0), Payment (Stripe), and Real-time Status Updates (WebSocket/Polling).
2.  **API Gateway (FastAPI):** The "Clerk". Routes requests, validates inputs, and enqueues jobs.
3.  **Task Orchestrator (LangGraph + Celery):** The "Manager". Defines the workflow logic (State Machines).
    -   *Crucial:* Must be durable. If the server restarts, the "Research Task" must resume, not restart.
4.  **Worker Nodes (Python):** The "Laborers". Executing specific tools (Search, Scrape, Summarize).
5.  **Database (PostgreSQL):** The "Ledger". Stores User Data, Task History, and Final Reports.

## 2. Tech Stack Selection
| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Frontend** | **Next.js (App Router)** | Rapid development, SEO friendly, Vercel deployment. |
| **Backend API** | **FastAPI (Python)** | Best performance for Python web apps, async support, auto-docs. |
| **AI Framework** | **LangChain / LangGraph** | The standard for building stateful, multi-agent applications. |
| **Task Queue** | **Celery + Redis** | Reliable background task processing. Decouples API from long-running AI tasks. |
| **Database** | **PostgreSQL** | Relational data integrity (crucial for payments/users). |
| **Vector DB** | **pgvector (in Postgres)** | For storing research chunks/documents (RAG). Keep stack simple. |

## 3. Data Flow (The "Research" Pipeline)
1.  **Job Creation:** User submits `POST /api/research` -> API validates -> Enqueues to Celery -> Returns `job_id`.
2.  **Orchestration Start:** Worker picks up job -> Initializes LangGraph Loop.
3.  **Research Phase:**
    -   `Planner Agent`: Decomposes query into sub-questions.
    -   `Search Agent`: Uses Tavily/SerpAPI to find answers.
    -   `Reading Agent`: Scrapes URLs and summarizes content.
4.  **Drafting Phase:**
    -   `Writer Agent`: Synthesizes findings into sections.
    -   `Review Agent`: Checks against original goal. If weak, sends back to `Planner`.
5.  **Completion:** Final Report saved to DB. User notified via Email/Webhook.

## 4. Key Considerations
-   **Cost Control:** Monitor token usage per "Labor Unit". Use cheaper models (GPT-3.5/Haiku) for drafting, stronger ones (GPT-4o/Sonnet) for planning/review.
-   **Reliability:** Use retry logic for external API calls (Search, LLM).
-   **Transparency:** Stream intermediate steps (logs) to the user UI via SSE (Server-Sent Events).
