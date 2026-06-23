'use client';

import React from 'react';
import { X, Calendar, Briefcase, TrendingUp, TrendingDown, Minus, Award, User, Clock } from 'lucide-react';
import { cn } from '@/components/ui/GlassPanel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Employee, RoleHistory, LeaveRecord, ComponentScores, SignalName } from '@/lib/types';

// ---- Mock data generators ----
function getMockRoleHistory(employeeId: string): RoleHistory[] {
  return [
    { id: '1', employee_id: employeeId, company_id: 'c1', role_title: 'Junior Engineer', role_level: 'L2', effective_date: '2022-03-01', change_type: 'hire' },
    { id: '2', employee_id: employeeId, company_id: 'c1', role_title: 'Software Engineer', role_level: 'L3', effective_date: '2023-01-15', change_type: 'promotion' },
    { id: '3', employee_id: employeeId, company_id: 'c1', role_title: 'Senior Engineer', role_level: 'L4', effective_date: '2024-06-01', change_type: 'promotion' },
  ];
}

function getMockLeaveRecords(employeeId: string): LeaveRecord[] {
  return [
    { id: 'l1', employee_id: employeeId, company_id: 'c1', leave_type: 'annual', start_date: '2026-01-06', end_date: '2026-01-10', days_count: 5 },
    { id: 'l2', employee_id: employeeId, company_id: 'c1', leave_type: 'sick', start_date: '2026-03-12', end_date: '2026-03-13', days_count: 2 },
    { id: 'l3', employee_id: employeeId, company_id: 'c1', leave_type: 'sick', start_date: '2026-05-20', end_date: '2026-05-22', days_count: 3 },
  ];
}

function getMockRiskScore(employeeId: string): { overall_score: number; risk_tier: string; component_scores: ComponentScores; top_factors: SignalName[] } {
  const scores: ComponentScores = {
    tenure_risk: 72,
    compensation_ratio: 85,
    promotion_velocity: 60,
    manager_change_recency: 30,
    team_attrition_exposure: 45,
    time_since_role_change: 25,
    leave_anomaly: 55,
    onboarding_completion: 10,
  };
  return {
    overall_score: 65,
    risk_tier: 'high',
    component_scores: scores,
    top_factors: ['tenure_risk', 'compensation_ratio', 'promotion_velocity'],
  };
}

// ---- Signal display helpers ----
const SIGNAL_LABELS: Record<SignalName, string> = {
  tenure_risk: 'Tenure Risk',
  compensation_ratio: 'Compensation Gap',
  promotion_velocity: 'Promotion Velocity',
  manager_change_recency: 'Manager Change',
  team_attrition_exposure: 'Peer Attrition',
  time_since_role_change: 'Role Stagnation',
  leave_anomaly: 'Leave Anomaly',
  onboarding_completion: 'Onboarding',
};

function ScoreBar({ label, value, isTopFactor }: { label: string; value: number; isTopFactor: boolean }) {
  const color = value >= 70 ? 'bg-red-500' : value >= 45 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className={cn('text-xs', isTopFactor ? 'text-white font-medium' : 'text-gray-400')}>
          {label}
          {isTopFactor && <span className="ml-1.5 text-[10px] text-amber-400">★ key</span>}
        </span>
        <span className={cn('text-xs font-mono', value >= 70 ? 'text-red-400' : value >= 45 ? 'text-amber-400' : 'text-emerald-400')}>
          {value}
        </span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ChangeTypeBadge({ type }: { type: RoleHistory['change_type'] }) {
  if (type === 'promotion') return <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Promotion</span>;
  if (type === 'demotion') return <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">Demotion</span>;
  if (type === 'lateral') return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">Lateral</span>;
  return <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-400">Hire</span>;
}

// ---- Main Drawer ----
interface EmployeeDrawerProps {
  employee: Employee | null;
  onClose: () => void;
}

export function EmployeeDrawer({ employee, onClose }: EmployeeDrawerProps) {
  if (!employee) return null;

  const roleHistory = getMockRoleHistory(employee.id);
  const leaveRecords = getMockLeaveRecords(employee.id);
  const riskData = getMockRiskScore(employee.id);

  const tierColor: Record<string, string> = {
    low: 'text-emerald-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-400',
  };

  const tenureMonths = employee.tenure_months ?? Math.floor(
    (new Date().getTime() - new Date(employee.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl z-50 flex flex-col bg-[#0d1424] border-l border-white/10 shadow-2xl overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
              {employee.full_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{employee.full_name}</h2>
              <p className="text-sm text-gray-400">{employee.role_title} · {employee.department}</p>
              <p className="text-xs text-gray-500 mt-0.5">Code: {employee.employee_code}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
              <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{tenureMonths}mo</p>
              <p className="text-[10px] text-gray-500">Tenure</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
              <div className={cn('text-lg font-bold', tierColor[riskData.risk_tier])}>{riskData.overall_score}</div>
              <p className="text-[10px] text-gray-500 capitalize">Risk: {riskData.risk_tier}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
              <Award className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{roleHistory.filter(r => r.change_type === 'promotion').length}</p>
              <p className="text-[10px] text-gray-500">Promotions</p>
            </div>
          </div>

          {/* Profile Info */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Profile</h3>
            <div className="space-y-2 text-sm">
              {[
                { icon: User, label: 'Role Level', value: employee.role_level },
                { icon: Briefcase, label: 'Division', value: employee.division || '—' },
                { icon: Calendar, label: 'Hire Date', value: new Date(employee.hire_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
                { icon: Briefcase, label: 'Status', value: employee.employment_status },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-gray-500 flex items-center gap-2"><Icon className="w-3.5 h-3.5" />{label}</span>
                  <span className="text-gray-200 capitalize">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Signals */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Layer-1 Risk Signals
              <span className="ml-2 text-[10px] normal-case font-normal text-gray-600">rule_based model</span>
            </h3>
            <div className="space-y-3">
              {(Object.entries(riskData.component_scores) as [SignalName, number][]).map(([signal, score]) => (
                <ScoreBar
                  key={signal}
                  label={SIGNAL_LABELS[signal]}
                  value={score}
                  isTopFactor={riskData.top_factors.includes(signal)}
                />
              ))}
            </div>
          </div>

          {/* Role History Timeline */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Role History</h3>
            <div className="relative border-l border-white/10 ml-2 space-y-4 pb-2">
              {roleHistory.map((r) => (
                <div key={r.id} className="relative pl-5">
                  <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-blue-400 ring-4 ring-[#0d1424]" />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-white font-medium">{r.role_title}</p>
                      <p className="text-xs text-gray-500">{r.role_level}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <ChangeTypeBadge type={r.change_type} />
                      <span className="text-[10px] text-gray-600">{r.effective_date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leave Summary */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Leave Records (2026)</h3>
            <div className="space-y-2">
              {leaveRecords.map((r) => (
                <div key={r.id} className="flex justify-between items-center p-2.5 rounded-md bg-white/5 border border-white/10 text-sm">
                  <div>
                    <span className="text-gray-300 capitalize">{r.leave_type}</span>
                    <span className="text-gray-500 text-xs ml-2">{r.start_date} → {r.end_date}</span>
                  </div>
                  <span className="text-white font-medium">{r.days_count}d</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
          <Button variant="primary" className="flex-1">View Full Profile</Button>
        </div>
      </div>
    </>
  );
}
