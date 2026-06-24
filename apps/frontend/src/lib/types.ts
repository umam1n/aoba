// ============================================================
// AOBA Workforce Intelligence Platform — TypeScript Interfaces
// Aligned with Django backend models (mock-compatible)
// ============================================================

export interface Company {
  id: string;
  name: string;
  industry: string;
  employee_count_tier: '50-100' | '100-250' | '250-500';
  country: string;
  subscription_status: 'trial' | 'active' | 'past_due' | 'cancelled';
  subscription_tier: 'starter' | 'growth' | 'enterprise';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at: string;
  is_delinquent: boolean;
}

export interface Employee {
  id: string;
  company_id: string;
  employee_code: string;
  full_name: string;
  email?: string;
  department: string;
  division?: string;
  role_title: string;
  role_level: string;
  manager_id?: string;
  hire_date: string;
  exit_date?: string;
  exit_type?: 'voluntary' | 'involuntary' | 'retirement';
  current_salary?: number;
  employment_status: 'active' | 'exited' | 'on_leave';
  created_at: string;
  updated_at: string;
  // UI computed field
  tenure_months?: number;
}

export interface RoleHistory {
  id: string;
  employee_id: string;
  company_id: string;
  role_title: string;
  role_level: string;
  effective_date: string;
  change_type: 'promotion' | 'lateral' | 'demotion' | 'hire';
}

export interface CompensationHistory {
  id: string;
  employee_id: string;
  company_id: string;
  salary: number;
  effective_date: string;
  change_reason: string;
}

export interface LeaveRecord {
  id: string;
  employee_id: string;
  company_id: string;
  leave_type: 'sick' | 'personal' | 'annual' | 'unpaid';
  start_date: string;
  end_date: string;
  days_count: number;
}

// Layer-1 signal names must match Layer1Calculator.SIGNAL_NAMES in backend
export type SignalName =
  | 'tenure_risk'
  | 'compensation_ratio'
  | 'promotion_velocity'
  | 'manager_change_recency'
  | 'team_attrition_exposure'
  | 'time_since_role_change'
  | 'leave_anomaly'
  | 'onboarding_completion';

export type ComponentScores = Record<SignalName, number>;

export interface RiskScore {
  id: string;
  employee: string;
  employee_code: string;
  employee_name: string;
  department?: string; // Only in detail view
  role_title?: string; // Only in detail view
  calculated_at: string;
  overall_score: number | string; // Django DecimalField might be serialized as string
  risk_tier: 'low' | 'medium' | 'high' | 'critical';
  component_scores?: ComponentScores; // Only in detail view
  top_factors?: SignalName[]; // Only in detail view
  model_version: string;
  model_confidence?: number | null;
  scoring_method: 'rule_based' | 'xgboost';
}

export interface RoleCostBand {
  id: string;
  company_id: string;
  role_title: string;
  role_level: string;
  department: string;
  country: string;
  median_salary: number;
  p25_salary?: number;
  p75_salary?: number;
  source: string;
  effective_year: number;
}

export interface AnomalyFlag {
  id: string;
  company_id: string;
  anomaly_type: 'response_rate_drop' | 'team_attrition' | 'manager_low_scores' | 'leave_spike';
  severity: 'warning' | 'alert' | 'critical';
  entity_type: 'department' | 'team' | 'manager';
  entity_id: string;
  entity_name: string;
  description: Record<string, unknown>;
  metric_value?: number;
  threshold_value?: number;
  detected_at: string;
  resolved_at?: string;
  is_active: boolean;
}

export interface PulseSurvey {
  id: string;
  company: string; // Serializer returns company ID here
  title: string;
  description?: string;
  target_audience: string;
  status: 'draft' | 'active' | 'closed';
  questions?: SurveyQuestion[];
  starts_at: string;
  ends_at: string;
  created_at: string;
  response_count?: number;
  unique_respondents?: number;
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  company_id: string;
  question_text: string;
  question_type: 'likert_5' | 'open_text' | 'yes_no';
  order: number;
}

export interface SurveyResponse {
  id: string;
  question_id: string;
  employee_id: string;
  company_id: string;
  response_value?: number;
  response_text?: string;
  submitted_at: string;
}

export interface IngestionLog {
  id: string;
  company_id: string;
  file_name: string;
  file_hash: string;
  file_type: 'employees' | 'compensation_history' | 'role_history' | 'leave_records';
  rows_total: number;
  rows_imported: number;
  rows_skipped: number;
  errors: IngestionError[];
  uploaded_by?: string;
  uploaded_at: string;
  completed_at?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface IngestionError {
  row: number;
  field: string;
  message: string;
}

export interface RawProjectSnapshot {
  id: string;
  company_id: string;
  provider: string;
  payload: Record<string, unknown>;
  processed: boolean;
  received_at: string;
}

export interface TaskFrictionAnalysis {
  id: string;
  company_id: string;
  employee_id: string;
  task_external_id: string;
  initial_scope_summary?: string;
  detected_friction_type: string;
  friction_confidence?: number;
  classification_rationale?: string;
  avoidance_strategy?: string;
  manager_alert_triggered: boolean;
  calculated_at: string;
}

// ---- Dashboard / UI aggregate types ----

export interface DepartmentHealth {
  department: string;
  employee_count: number;
  avg_risk_score: number;
  risk_trend: number[];
  attrition_rate: number;
  avg_tenure_months: number;
  high_risk_count: number;
}

export interface DashboardStats {
  total_employees: number;
  avg_risk_score: number;
  attrition_rate: number;
  active_anomalies: number;
}

export interface RiskDistribution {
  tier: string;
  count: number;
  percentage: number;
}

export interface QuestionResult {
  question_id: string;
  question_text: string;
  question_type: string;
  total_responses: number;
  average_score?: number | null;
  score_distribution?: Record<string, number>;
  yes_percentage?: number | null;
}

export interface SurveyResults {
  survey_id: string;
  survey_title: string;
  total_respondents: number;
  total_responses: number;
  response_rate: number;
  questions: QuestionResult[];
}

// ---- API wrapper types ----

// Pagination wrapper for Django REST Framework
export interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}
