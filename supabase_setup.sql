-- AOBA Supabase Production Setup SQL
-- Contains table schemas, constraints, and Row-Level Security (RLS) policies
-- specifically tailored for multi-tenant isolation via company_id.

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Companies Table
CREATE TABLE companies_company (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    employee_count_tier VARCHAR(20) NOT NULL,
    country VARCHAR(3) DEFAULT 'IDN',
    subscription_status VARCHAR(20) DEFAULT 'trial',
    subscription_tier VARCHAR(20) DEFAULT 'starter',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_delinquent BOOLEAN DEFAULT FALSE
);

-- 3. Employees Table (with PII Encryption placeholders)
CREATE TABLE employees_employee (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies_company(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) NOT NULL,
    full_name TEXT NOT NULL, -- Application-level encrypted
    email TEXT, -- Application-level encrypted
    department VARCHAR(100) NOT NULL,
    division VARCHAR(100),
    role_title VARCHAR(150) NOT NULL,
    role_level VARCHAR(50) NOT NULL,
    manager_id UUID REFERENCES employees_employee(id) ON DELETE SET NULL,
    hire_date DATE NOT NULL,
    exit_date DATE,
    exit_type VARCHAR(20),
    current_salary TEXT, -- Application-level encrypted
    employment_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, employee_code)
);

-- 4. Projects: Bronze Ingestion Layer
CREATE TABLE projects_rawprojectsnapshot (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies_company(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_raw_snap_unproc ON projects_rawprojectsnapshot(company_id) WHERE processed = FALSE;

-- 5. Projects: Gold Friction Layer
CREATE TABLE projects_taskfrictionanalysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies_company(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees_employee(id) ON DELETE CASCADE,
    task_external_id VARCHAR(255) NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    initial_scope_summary TEXT,
    detected_friction_type VARCHAR(50) NOT NULL,
    friction_confidence DECIMAL(4,3),
    classification_rationale TEXT,
    avoidance_strategy TEXT,
    manager_alert_triggered BOOLEAN DEFAULT FALSE,
    UNIQUE(company_id, task_external_id)
);

CREATE INDEX idx_task_friction_type ON projects_taskfrictionanalysis(company_id, detected_friction_type);

-- 6. Analytics: Risk Scores
CREATE TABLE analytics_riskscore (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies_company(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees_employee(id) ON DELETE CASCADE,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    overall_score DECIMAL(5,2) NOT NULL,
    risk_tier VARCHAR(20) NOT NULL,
    component_scores JSONB DEFAULT '{}'::jsonb,
    top_factors JSONB DEFAULT '[]'::jsonb,
    model_version VARCHAR(50) DEFAULT 'v1.0-rule',
    model_confidence DECIMAL(4,3),
    scoring_method VARCHAR(20) DEFAULT 'rule_based',
    UNIQUE(employee_id, company_id)
);

CREATE INDEX idx_risk_tier ON analytics_riskscore(company_id, risk_tier);

-- 7. Analytics: Anomaly Flags
CREATE TABLE analytics_anomalyflag (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies_company(id) ON DELETE CASCADE,
    anomaly_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    entity_type VARCHAR(20) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    description JSONB NOT NULL DEFAULT '{}'::jsonb,
    metric_value DECIMAL(8,3),
    threshold_value DECIMAL(8,3),
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_anomaly_active ON analytics_anomalyflag(company_id, is_active, detected_at DESC);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE companies_company ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees_employee ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects_rawprojectsnapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects_taskfrictionanalysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_riskscore ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_anomalyflag ENABLE ROW LEVEL SECURITY;

-- We assume the Supabase JWT contains `app_metadata.company_id`
-- which corresponds to the UUID of the company.

-- Company Policy: Users can only view their own company record
CREATE POLICY "Company isolation policy" ON companies_company
    FOR ALL
    USING (id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

-- Employee Policy: Users can only access employees in their company
CREATE POLICY "Employee isolation policy" ON employees_employee
    FOR ALL
    USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

-- Projects Bronze Policy: Strictly isolate webhooks to the target company
CREATE POLICY "Raw Snapshot isolation policy" ON projects_rawprojectsnapshot
    FOR ALL
    USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

-- Task Friction Policy
CREATE POLICY "Task Friction isolation policy" ON projects_taskfrictionanalysis
    FOR ALL
    USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

-- Risk Score Policy
CREATE POLICY "Risk Score isolation policy" ON analytics_riskscore
    FOR ALL
    USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

-- Anomaly Flag Policy
CREATE POLICY "Anomaly Flag isolation policy" ON analytics_anomalyflag
    FOR ALL
    USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);
