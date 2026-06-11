// ============================================================
// AOBA Workforce Intelligence Platform — TypeScript Interfaces
// Matching Django backend models
// ============================================================

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  employee_count: number;
  plan: 'starter' | 'growth' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  company_id: string;
  employee_ref: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  role_title: string;
  hire_date: string;
  tenure_months: number;
  employment_status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  manager_id?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface RiskScore {
  id: string;
  employee_id: string;
  employee?: Employee;
  overall_score: number;
  tier: 'low' | 'moderate' | 'high' | 'critical';
  signals: RiskSignals;
  top_factors: string[];
  trend: 'improving' | 'stable' | 'declining';
  calculated_at: string;
}

export interface RiskSignals {
  compensation_gap: number;
  tenure_risk: number;
  promotion_velocity: number;
  leave_pattern: number;
  engagement_score: number;
  manager_change: number;
  market_demand: number;
  peer_departure: number;
}

export interface AnomalyFlag {
  id: string;
  company_id: string;
  employee_id?: string;
  department?: string;
  anomaly_type: 'spike' | 'cluster' | 'trend' | 'outlier';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  is_dismissed: boolean;
  detected_at: string;
}

export interface PulseSurvey {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'closed';
  questions: SurveyQuestion[];
  target_departments: string[];
  response_count: number;
  total_recipients: number;
  created_at: string;
  closes_at?: string;
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  text: string;
  question_type: 'likert' | 'multiple_choice' | 'open_text' | 'yes_no';
  options?: string[];
  order: number;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  question_id: string;
  employee_id: string;
  answer_value?: number;
  answer_text?: string;
  submitted_at: string;
}

export interface IngestionLog {
  id: string;
  company_id: string;
  file_name: string;
  file_type: 'employees' | 'compensation' | 'roles' | 'leaves';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  rows_total: number;
  rows_imported: number;
  rows_skipped: number;
  errors?: IngestionError[];
  uploaded_by: string;
  created_at: string;
  completed_at?: string;
}

export interface IngestionError {
  row: number;
  field: string;
  message: string;
}

export interface ConsentLog {
  id: string;
  employee_id: string;
  consent_type: 'data_collection' | 'risk_analysis' | 'benchmarking' | 'survey_participation' | 'data_sharing';
  granted: boolean;
  granted_at?: string;
  revoked_at?: string;
  ip_address?: string;
}

export interface BillingEvent {
  id: string;
  company_id: string;
  event_type: 'subscription_created' | 'payment_succeeded' | 'payment_failed' | 'plan_changed' | 'subscription_cancelled';
  amount?: number;
  currency: string;
  plan?: string;
  description?: string;
  created_at: string;
}

// Department-level aggregates
export interface DepartmentHealth {
  department: string;
  employee_count: number;
  avg_risk_score: number;
  risk_trend: number[];
  attrition_rate: number;
  avg_tenure_months: number;
  high_risk_count: number;
}

// Dashboard overview stats
export interface DashboardStats {
  total_employees: number;
  avg_risk_score: number;
  attrition_rate: number;
  active_anomalies: number;
}

// Risk distribution for charts
export interface RiskDistribution {
  tier: string;
  count: number;
  percentage: number;
}

// Survey results aggregation
export interface SurveyQuestionResult {
  question: SurveyQuestion;
  avg_score?: number;
  distribution: { label: string; count: number }[];
  responses_count: number;
  open_responses?: string[];
}

// API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  pagination?: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}
