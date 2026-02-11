# SmartLLMOps

An enterprise-grade LLMOps platform for monitoring, evaluating, and managing Large Language Model applications in production environments.

## Overview

SmartLLMOps provides a comprehensive solution for organizations deploying LLM-powered applications. It addresses the critical need for observability, quality assurance, and prompt management in AI systems, enabling teams to maintain high-quality AI outputs while reducing operational overhead.

### Key Capabilities

- **Trace Monitoring**: Real-time visibility into LLM interactions, including inputs, outputs, latency, and token usage
- **Automated Evaluations**: AI-powered quality assessments for hallucination detection, context relevance, and response conciseness
- **Prompt Management**: Version-controlled prompt registry with environment promotion (dev/staging/production)
- **Metrics Dashboard**: Aggregated performance metrics and trend analysis
- **Evaluator Configuration**: Customizable evaluation criteria and thresholds

## Why SmartLLMOps?

### For Companies

| Challenge | Solution |
|-----------|----------|
| **LLM Output Quality** | Automated evaluations detect hallucinations and irrelevant responses before they reach users |
| **Debugging AI Issues** | Full trace visibility enables quick identification of problematic interactions |
| **Prompt Versioning** | MLflow-backed prompt registry ensures reproducibility and safe rollbacks |
| **Compliance & Audit** | Complete audit trail of all LLM interactions and evaluation results |
| **Cost Optimization** | Token usage tracking helps identify optimization opportunities |

### Business Value

- **Reduce AI Incidents**: Catch quality issues before they impact customers
- **Accelerate Development**: Streamlined prompt iteration with version control
- **Enable Governance**: Meet compliance requirements with comprehensive logging
- **Scale Confidently**: Monitor LLM performance across all applications

## Current Scope

### Implemented Features

#### Backend (FastAPI)
- RESTful API for traces, evaluations, metrics, and prompts
- Azure Cosmos DB integration for scalable data storage
- MLflow Prompt Registry (supports DagsHub, local, and Azure ML)
- Configurable evaluator framework

#### Frontend (React + TypeScript)
- Interactive dashboard with real-time metrics visualization
- Trace explorer with filtering and detail views
- Prompt management UI with version history
- Evaluation results browser

#### Azure Functions
- **TraceGenerator**: Processes and stores LLM interaction traces
- **EvaluatorRunner**: Executes automated quality evaluations
- **Aggregator**: Computes aggregated metrics

#### Evaluators
- **Hallucination Detector**: Identifies factual inconsistencies
- **Context Relevance**: Measures response alignment with provided context
- **Conciseness Checker**: Evaluates response brevity and clarity

## Future Scope

### Planned Enhancements

1. **Advanced Analytics**
   - Drift detection for model performance degradation
   - A/B testing framework for prompt variants
   - Custom metric definitions

2. **Integration Ecosystem**
   - OpenTelemetry-native tracing
   - Slack/Teams alerting integration
   - CI/CD pipeline integration for prompt deployment

3. **Enhanced Evaluation**
   - Custom evaluator builder (no-code)
   - Human-in-the-loop annotation workflows
   - Benchmark dataset management

4. **Enterprise Features**
   - Role-based access control (RBAC)
   - Multi-tenant support
   - SSO integration

5. **Cost Management**
   - Token budget alerts
   - Cost attribution by application/team
   - Usage forecasting

## Technology Stack

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | High-performance REST API framework |
| Python 3.12 | Runtime environment |
| Azure Cosmos DB | NoSQL database for traces and evaluations |
| MLflow | Prompt versioning and experiment tracking |
| Azure OpenAI | LLM-powered evaluations |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| TypeScript | Type-safe development |
| Vite | Build tooling |
| Tailwind CSS | Styling |
| Recharts | Data visualization |
| Lucide React | Icon library |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Azure Functions | Serverless compute |
| DagsHub | MLflow hosting (optional) |
| Azure Blob Storage | Artifact storage |

## Project Structure

```
smartllmops/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── requirements.txt        # Python dependencies
│   ├── routers/                # API route handlers
│   │   ├── traces.py           # Trace CRUD operations
│   │   ├── evaluations.py      # Evaluation endpoints
│   │   ├── evaluators.py       # Evaluator configuration
│   │   ├── metrics.py          # Metrics aggregation
│   │   ├── prompts.py          # Prompt management
│   │   ├── templates.py        # Template operations
│   │   ├── sessions.py         # Session management
│   │   └── datasets.py         # Dataset operations
│   ├── services/
│   │   └── prompts.py          # MLflow Prompt Registry service
│   ├── utils/
│   │   └── cosmos.py           # Azure Cosmos DB client
│   ├── azure_functions/        # Serverless functions
│   │   ├── TraceGenerator/     # Trace processing
│   │   ├── EvaluatorRunner/    # Evaluation execution
│   │   └── Aggregator/         # Metrics computation
│   ├── evaluators/             # Evaluation implementations
│   │   ├── hallucination.py
│   │   ├── context_relevance.py
│   │   └── conciseness.py
│   └── data/                   # Configuration files
│       ├── templates.json
│       ├── evaluator_config.json
│       └── qa_golden_set.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Main application
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Traces.tsx
│   │   │   ├── Evaluations.tsx
│   │   │   ├── Prompts.tsx
│   │   │   ├── CreatePrompt.tsx
│   │   │   └── ...
│   │   └── components/         # Reusable components
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── .env.example                # Environment template
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- Azure account (for Cosmos DB and OpenAI)
- DagsHub account (optional, for MLflow hosting)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/smartllmops.git
   cd smartllmops
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

#### Backend (FastAPI)
```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```
API available at: http://localhost:8000

#### Frontend (React)
```bash
cd frontend
npm run dev
```
UI available at: http://localhost:5173

#### MLflow (Local - Optional)
```bash
mlflow server --host 0.0.0.0 --port 5000
```
MLflow UI available at: http://localhost:5000

### Configuration Options

#### MLflow Tracking

**Option 1: DagsHub (Recommended for teams)**
```env
MLFLOW_TRACKING_URI=https://dagshub.com/<username>/<repo>.mlflow/
MLFLOW_TRACKING_USERNAME=your_username
MLFLOW_TRACKING_PASSWORD=your_token
```

**Option 2: Local MLflow**
```env
MLFLOW_TRACKING_URI=http://localhost:5000
```

**Option 3: Azure ML**
```env
MLFLOW_TRACKING_URI=azureml://<your-azure-ml-uri>
```

## API Reference

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/traces` | GET, POST | List and create traces |
| `/api/v1/traces/{id}` | GET | Get trace details |
| `/api/v1/evaluations` | GET, POST | List and create evaluations |
| `/api/v1/metrics` | GET | Get aggregated metrics |
| `/api/v1/prompts` | GET, POST | List and create prompts |
| `/api/v1/prompts/{name}` | GET | Get prompt by name |
| `/api/v1/prompts/{name}/history` | GET | Get prompt version history |
| `/api/v1/prompts/{name}/promote` | POST | Promote prompt to environment |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For questions or issues, please contact the development team or open an issue in the repository.
