# SmartLLMOps - Project Walkthrough

## Project Overview

**SmartLLMOps** is an enterprise-grade LLMOps (Large Language Model Operations) platform built for monitoring, evaluating, and managing LLM-powered applications in production. It is themed around a "Smart Factory AI" use case, where industrial/factory operations are assisted by AI and the platform provides full observability over those LLM interactions.

The project follows a **monorepo** structure with a **Python FastAPI backend**, a **React + TypeScript frontend**, and **Azure Functions** for serverless background processing.

---

## Menus / Pages - Working Status

| Menu Item | Route | Status | Description |
|---|---|---|---|
| **Dashboard** | `/dashboard` | Working | Displays KPI cards, bar charts, evaluation summaries, and model usage from Cosmos DB metrics snapshot |
| **Tracing** | `/traces` | Working | Lists all LLM traces with search/filter, showing timestamp, name, input, latency, tokens, cost, and scores |
| **Sessions** | `/sessions` | Working | Groups traces by session ID and shows aggregate stats (trace count, tokens, cost) |
| **Evaluators** | `/evaluators` | Working | Three-tab view (Evaluators, Templates, Evaluation Log) with full CRUD for evaluators and templates, plus evaluation log viewer with trace modal |
| **Prompts** | `/prompts` | Working | Lists prompts from MLflow registry with editor, config, and version history tabs; supports creating new prompts |
| **Audit** | `/audit` | Working | Displays audit trail logs with search, type filter (evaluator/template), and CSV export |
| **Annotation Queues** | `/annotations` | Placeholder | Shows "Annotation Configuration Needed" message - no backend integration |
| **Datasets** | `/datasets` | Placeholder | Shows "Dataset Configuration Needed" message - no backend integration |
| **Alerts** | `/alerts` | Placeholder | Shows "No Active Incidents" message - no backend integration |
| **Settings** | `/settings` | Placeholder | Shows "Settings Configuration Needed" message - no backend integration |
| **Login** | `/login` | Working | Microsoft Entra ID (MSAL) login page with redirect authentication |

---

## Tools & Technologies

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.12** | Backend runtime |
| **FastAPI** | REST API framework (v0.128.5) |
| **Uvicorn** | ASGI server for FastAPI |
| **Azure Cosmos DB** | NoSQL database for traces, evaluations, metrics, templates, evaluators, and audit logs |
| **MLflow** (v3.9.0) | Prompt Registry for version-controlled prompt management |
| **Azure ML MLflow** | Optional MLflow backend via Azure Machine Learning |
| **DagsHub** | Optional cloud-hosted MLflow tracking |
| **Azure OpenAI** | LLM API for running evaluators (hallucination, context relevance, conciseness) |
| **Azure Functions** | Serverless compute for trace generation, evaluation execution, and metrics aggregation |
| **Pydantic** | Data validation and serialization |
| **python-dotenv** | Environment variable management |
| **pandas / numpy / scikit-learn** | Data processing utilities |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **TypeScript** | Type-safe JavaScript |
| **Vite 7** | Build tool and dev server |
| **Tailwind CSS 3** | Utility-first CSS styling |
| **React Router DOM 7** | Client-side routing |
| **Axios** | HTTP client for API calls |
| **Recharts** | Chart library for dashboard visualizations (bar charts) |
| **Lucide React** | Icon library |
| **MSAL Browser + MSAL React** | Microsoft Authentication Library for Azure AD / Entra ID login |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Azure Cosmos DB** | Primary data store (read/write separation via dual connection strings) |
| **Azure Functions** | Three serverless functions (TraceGenerator, EvaluatorRunner, Aggregator) |
| **Azure OpenAI Service** | Powers LLM-based evaluators |
| **MLflow** | Prompt versioning, tracking, and registry |

---

## File-by-File Explanation

### Root Files

| File | Description |
|---|---|
| `.env.example` | Template showing all required environment variables (Cosmos DB, Azure OpenAI, MLflow) |
| `.gitignore` | Comprehensive gitignore covering Python, Node.js, IDE files, databases, and secrets |
| `README.md` | Project documentation with architecture overview, setup instructions, and API reference |

---

### Backend

| File | Description |
|---|---|
| `backend/main.py` | FastAPI application entry point that loads `.env`, registers all routers, and configures CORS middleware |
| `backend/__init__.py` | Empty init file making `backend/` a Python package |
| `backend/requirements.txt` | Python dependencies including FastAPI, Azure SDK, MLflow, pandas, and scikit-learn |

#### Backend > Routers

| File | Description |
|---|---|
| `backend/routers/__init__.py` | Empty init file making `routers/` a Python package |
| `backend/routers/traces.py` | API endpoints for listing all traces (with session/user/model filters) and fetching a single trace by ID from Cosmos DB |
| `backend/routers/evaluations.py` | API endpoints for listing evaluation results with evaluator and trace_id filters from Cosmos DB |
| `backend/routers/evaluators.py` | API endpoints for listing and creating evaluator configurations (with audit logging) in Cosmos DB |
| `backend/routers/templates.py` | API endpoints for listing, fetching by ID, and creating evaluator prompt templates (with audit logging) in Cosmos DB |
| `backend/routers/sessions.py` | API endpoints for listing sessions (aggregated from traces) and fetching a single session's traces |
| `backend/routers/metrics.py` | API endpoint that reads a pre-computed metrics snapshot document from Cosmos DB for the dashboard |
| `backend/routers/audit.py` | API endpoint for querying audit logs with type/action/user filters from Cosmos DB |
| `backend/routers/prompts.py` | API endpoints for CRUD operations on prompts via MLflow Prompt Registry (list, create, get by name, history, promote) |

#### Backend > Services

| File | Description |
|---|---|
| `backend/services/__init__.py` | Empty init file making `services/` a Python package |
| `backend/services/prompts.py` | `PromptService` class that wraps MLflow's Prompt Registry API for creating, listing, fetching, versioning, and promoting prompts with support for Azure ML, DagsHub, and local MLflow |

#### Backend > Utils

| File | Description |
|---|---|
| `backend/utils/__init__.py` | Empty init file making `utils/` a Python package |
| `backend/utils/cosmos.py` | Initializes Azure Cosmos DB read/write clients and exposes container references for traces, evaluations, metrics, templates, evaluators, and audit_logs |

---

### Azure Functions

| File | Description |
|---|---|
| `backend/azure_functions/host.json` | Azure Functions host configuration with Application Insights and extension bundle settings |
| `backend/azure_functions/requirements.txt` | Python dependencies for Azure Functions (azure-functions, azure-cosmos, requests, pandas) |
| `backend/azure_functions/.gitignore` | Gitignore for Azure Functions local settings and Python packages |

#### Azure Functions > TraceGenerator

| File | Description |
|---|---|
| `backend/azure_functions/TraceGenerator/function.json` | Timer trigger configuration that fires every 1 minute to generate synthetic traces |
| `backend/azure_functions/TraceGenerator/__init__.py` | Generates 2-5 synthetic smart-factory Q&A traces per execution with realistic data (21 industrial scenarios), random models, costs, and latencies, and writes them to Cosmos DB |

#### Azure Functions > EvaluatorRunner

| File | Description |
|---|---|
| `backend/azure_functions/EvaluatorRunner/function.json` | Cosmos DB change feed trigger that fires when new traces are inserted into the `traces` container |
| `backend/azure_functions/EvaluatorRunner/__init__.py` | Reads active evaluators from Cosmos DB, runs each evaluator function against new traces (with sampling and delay support), persists evaluation results, and logs audit entries |

#### Azure Functions > Aggregator

| File | Description |
|---|---|
| `backend/azure_functions/Aggregator/function.json` | Timer trigger configuration that fires every 30 seconds to recompute dashboard metrics |
| `backend/azure_functions/Aggregator/__init__.py` | Reads all traces and evaluations from Cosmos DB, computes aggregate KPIs (total traces, sessions, users, tokens, cost, latency, model usage, evaluation summaries), and upserts a single metrics snapshot document |

#### Azure Functions > Evaluators

| File | Description |
|---|---|
| `backend/azure_functions/evaluators/__init__.py` | Empty init file making `evaluators/` a Python package |
| `backend/azure_functions/evaluators/registry.py` | Registry dictionary mapping template IDs to evaluator functions (hallucination, context_relevance, conciseness) |
| `backend/azure_functions/evaluators/hallucination_v2.py` | LLM-based hallucination evaluator that calls Azure OpenAI to score whether an answer contains information not supported by the context (0-1 scale with noise injection) |
| `backend/azure_functions/evaluators/context_relevance_v2.py` | LLM-based context relevance evaluator that calls Azure OpenAI to score how well retrieved context answers the question (0-1 scale) |
| `backend/azure_functions/evaluators/conciseness_v2.py` | LLM-based conciseness evaluator that calls Azure OpenAI to score answer verbosity (0-1 scale), includes optional local CSV batch runner for development |

#### Azure Functions > Utils

| File | Description |
|---|---|
| `backend/azure_functions/utils/__init__.py` | Empty init file making `utils/` a Python package |
| `backend/azure_functions/utils/cosmos.py` | Cosmos DB client setup for Azure Functions with read/write separation for traces, evaluations, templates, evaluators, and audit_logs containers |
| `backend/azure_functions/utils/audit.py` | Utility function `audit_log()` that writes timestamped audit entries to the `audit_logs` Cosmos DB container (silently fails to never break main flow) |

---

### Frontend

#### Config Files

| File | Description |
|---|---|
| `frontend/package.json` | Node.js project manifest with dependencies (React 19, MSAL, Axios, Recharts, Lucide, Tailwind) and build scripts |
| `frontend/vite.config.ts` | Vite build configuration with React plugin |
| `frontend/tailwind.config.js` | Tailwind CSS configuration pointing to all source files for class scanning |
| `frontend/postcss.config.js` | PostCSS configuration for Tailwind CSS and Autoprefixer |
| `frontend/tsconfig.json` | Root TypeScript configuration referencing app and node configs |
| `frontend/tsconfig.app.json` | TypeScript config for the React application source code |
| `frontend/tsconfig.node.json` | TypeScript config for Node.js tooling (Vite config) |
| `frontend/eslint.config.js` | ESLint configuration for TypeScript and React |
| `frontend/index.html` | HTML entry point with root div and Vite module script |

#### CSS Files

| File | Description |
|---|---|
| `frontend/src/index.css` | Global CSS with Tailwind directives, dark theme defaults, button styles, and fadeIn animation keyframes |
| `frontend/src/App.css` | Default Vite/React CSS styles (logo animations, card styles) |

#### Entry & Routing

| File | Description |
|---|---|
| `frontend/src/main.tsx` | Application entry point that initializes MSAL (Microsoft Auth), handles redirect promises, and renders the App within MsalProvider |
| `frontend/src/App.tsx` | Root component that defines all routes with React Router, wraps protected routes in `RequireAuth`, and renders the sidebar + navbar layout |

#### Auth

| File | Description |
|---|---|
| `frontend/src/auth/msalConfig.ts` | MSAL (Microsoft Authentication Library) configuration with Azure AD client ID, authority URL, and redirect URIs |
| `frontend/src/auth/AuthButtons.tsx` | Login/Logout buttons component using MSAL redirect flow, displays current user's email when logged in |
| `frontend/src/auth/RequireAuth.tsx` | Route guard component that redirects unauthenticated users to the login page |

#### API Layer

| File | Description |
|---|---|
| `frontend/src/api/client.ts` | Axios HTTP client configured for localhost:8000 with TypeScript interfaces for Trace, Session, Evaluator, Template, and EvaluationLog |
| `frontend/src/hooks/useApi.ts` | Custom hook providing typed API methods for traces, evaluations, evaluators, templates, and sessions endpoints |

#### Components

| File | Description |
|---|---|
| `frontend/src/components/Sidebar.tsx` | Left navigation sidebar with 10 menu items (Dashboard, Tracing, Sessions, etc.), active state highlighting, and Smart Factory AI branding |
| `frontend/src/components/NavBar.tsx` | Top navigation bar displaying "Smart Factory Admin" title and login/logout auth buttons |
| `frontend/src/components/AuthButtons.tsx` | Alternate auth buttons component using MSAL popup flow (used by NavBar) |
| `frontend/src/components/EvaluatorsTable.tsx` | Table component showing active evaluators with name, status, template, score name, target, sampling rate, and creation date |
| `frontend/src/components/TemplatesList.tsx` | Card-based list component showing evaluator templates with name, description, prompt content, model, input variables, and version |
| `frontend/src/components/LogsTable.tsx` | Table component showing evaluation execution logs with timestamp, evaluator name, trace ID, score, duration, status badges, and "View Trace" action buttons |
| `frontend/src/components/LogsFilters.tsx` | Dropdown filter components for filtering evaluation logs by evaluator name and status (Completed/Error/Timeout) |
| `frontend/src/components/TraceModal.tsx` | Full-screen modal overlay showing detailed trace information (latency, tokens, cost, input prompt, model output, retrieval context) |

#### Pages

| File | Description |
|---|---|
| `frontend/src/pages/LoginPage.tsx` | Microsoft corporate login page with Entra ID redirect authentication, error display, and auto-redirect for already-authenticated users |
| `frontend/src/pages/Dashboard.tsx` | Main dashboard with 8 KPI cards (traces, cost, tokens, latency, satisfaction, completion, accuracy, escalation), drift detection alert, bar charts (traces by name, cost by model), evaluation scores summary table, and model usage details table |
| `frontend/src/pages/Traces.tsx` | Trace explorer page with search-by-name filter and a data table showing timestamp, trace name, input text, latency, tokens, cost, and color-coded evaluation scores |
| `frontend/src/pages/Sessions.tsx` | Sessions list page with a table showing session ID, user, trace count, total tokens, total cost, and creation timestamp |
| `frontend/src/pages/Evaluators.tsx` | Multi-tab evaluator management page with three tabs (Evaluators list, Templates list, Evaluation Log), "New Evaluator" button, and trace detail modal |
| `frontend/src/pages/CreateEvaluator.tsx` | Form page for creating a new evaluator with template selection dropdown, active/inactive toggle, target type (traces/dataset), variable mapping, sampling rate slider, and execution delay slider |
| `frontend/src/pages/CreateTemplate.tsx` | Form page for creating a new evaluator template with name, description, model selection, output type, and prompt editor with variable placeholder syntax |
| `frontend/src/pages/Prompts.tsx` | Split-panel prompt management page with a sidebar listing all prompts from MLflow and a main area with Editor (read-only prompt viewer), Config (model parameters), and History (version timeline) tabs |
| `frontend/src/pages/CreatePrompt.tsx` | Form page for creating a new prompt with name, description, tags, content editor with auto-detected variables, and model configuration sidebar (model, temperature, max tokens, top P, frequency/presence penalty) |
| `frontend/src/pages/Audit.tsx` | Audit trail page with search bar, type filter dropdown (All/Evaluator/Template), audit logs table with color-coded type badges, and CSV export button |
| `frontend/src/pages/Alerts.tsx` | Placeholder page showing "No Active Incidents" with a note that monitoring is disabled |
| `frontend/src/pages/Datasets.tsx` | Placeholder page showing "Dataset Configuration Needed" message |
| `frontend/src/pages/Annotations.tsx` | Placeholder page showing "Annotation Configuration Needed" message |
| `frontend/src/pages/Settings.tsx` | Placeholder page showing "Settings Configuration Needed" message |

---

## Architecture Summary

```
                    +--------------------+
                    |   React Frontend   |
                    |  (Vite + Tailwind) |
                    +--------+-----------+
                             |
                        Axios HTTP
                             |
                    +--------v-----------+
                    |   FastAPI Backend   |
                    |   (Python 3.12)    |
                    +--+------+------+---+
                       |      |      |
            +----------+  +---+---+  +----------+
            |             |       |             |
    +-------v----+  +-----v---+  +v----------+ |
    | Cosmos DB  |  | MLflow  |  | Azure     | |
    | (NoSQL)    |  | Prompt  |  | OpenAI    | |
    |            |  | Registry|  | (GPT-4o)  | |
    +-------^----+  +---------+  +-----------+ |
            |                                  |
    +-------+----------------------------------+
    |       Azure Functions (Serverless)       |
    |  +-------------+ +----------------+      |
    |  | TraceGen    | | EvaluatorRunner|      |
    |  | (Timer 1m)  | | (Change Feed) |      |
    |  +-------------+ +----------------+      |
    |  +-------------+                         |
    |  | Aggregator  |                         |
    |  | (Timer 30s) |                         |
    |  +-------------+                         |
    +------------------------------------------+
```

### Data Flow
1. **TraceGenerator** (Azure Function, timer) creates synthetic smart-factory LLM traces and writes them to Cosmos DB
2. **EvaluatorRunner** (Azure Function, change feed) detects new traces and runs active evaluators (hallucination, context relevance, conciseness) against them using Azure OpenAI
3. **Aggregator** (Azure Function, timer) computes dashboard KPIs from all traces and evaluations every 30 seconds
4. **FastAPI Backend** serves the REST API, reading from Cosmos DB (traces, evaluations, metrics, audit) and MLflow (prompts)
5. **React Frontend** consumes the API and presents the data through an interactive dark-themed admin dashboard with Microsoft Entra ID authentication
