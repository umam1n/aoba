# AOBA - Workforce Intelligence Platform

AOBA is a predictive people analytics platform targeting SMEs (50–500 employees). It combines predictive attrition intelligence, UU PDP compliant employee data management, and automated anomaly detection to provide actionable HR insights.

## Product Vision

The platform offers a scalable architecture structured in progressive analytical layers:
- **Layer 1:** Structural HR Signals
- **Layer 3:** Rule-based Anomaly Detection
- **Layer 4:** Predictive Attrition (XGBoost Classifier + SHAP explainability)
- **Layer 6:** Workforce Load Analysis, Project Ingestion, & NLP Task Friction Engine (Phase 3)
- **Layer 7:** Talent Cards
- **Layer 8:** AI Displacement Forecasting

## Technology Stack

### Backend (Django Monolith)
- Python 3.10+
- Django 5.x & Django REST Framework (DRF)
- Celery & Redis (Async task queuing)
- XGBoost & SHAP (Machine Learning pipeline)
- SQLite (Local Dev) / Supabase PostgreSQL (Production)
- **Data Security:** `cryptography` (Fernet) for PII column-level encryption (UU PDP Compliance).
- **Bronze Layer RLS:** Webhook payloads secured via PostgreSQL Row-Level Security scoped strictly to company ID.

### Frontend (Next.js Application)
- Next.js 14+ (App Router)
- React 18 & TypeScript
- TailwindCSS (Glassmorphism & Dark Mode)
- Recharts for analytics visualization

## Architecture & Monorepo Structure
The project uses a monorepo setup:
```
aoba/
├── apps/
│   ├── backend/      # Django REST Framework API
│   └── frontend/     # Next.js App Router Web UI
├── scripts/          # Ingestion and automation scripts
├── docker-compose.yml
└── README.md
```

## Security & Compliance
- **Tenant Isolation:** enforced via `X-Company-ID` middleware.
- **UU PDP (Law No. 27/2022) Compliance:** Strict consent logs, data portability (export), and "Right to be Forgotten" endpoints natively built into the `compliance` app.
- **PII Encryption:** Sensitive employee data (e.g., names, emails, salaries) is encrypted at rest using AES-256.

## License
This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the `LICENSE` file for details.
