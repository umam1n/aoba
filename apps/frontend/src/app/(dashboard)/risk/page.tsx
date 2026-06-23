'use client';

import React, { useState } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Badge } from '@/components/ui/Badge';
import { SignalRadarChart } from '@/components/analytics/SignalRadarChart';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AlertTriangle, Filter, X, ArrowUpDown } from 'lucide-react';
import type { ComponentScores, SignalName } from '@/lib/types';

const riskDistribution = [
  { name: 'Critical', value: 12, color: '#ef4444' },
  { name: 'High',     value: 26, color: '#f97316' },
  { name: 'Medium',   value: 85, color: '#eab308' },
  { name: 'Low',      value: 289, color: '#22c55e' },
];

interface RiskEmployee {
  id: string;
  name: string;
  dept: string;
  score: number;
  tier: 'Critical' | 'High' | 'Medium' | 'Low';
  factors: string[];
  component_scores: ComponentScores;
}

const mockEmployees: RiskEmployee[] = [
  {
    id: '1', name: 'Alice Smith', dept: 'Engineering', score: 92, tier: 'Critical',
    factors: ['Manager Change', 'Compensation Gap'],
    component_scores: { tenure_risk: 88, compensation_ratio: 95, promotion_velocity: 72, manager_change_recency: 80, team_attrition_exposure: 60, time_since_role_change: 45, leave_anomaly: 30, onboarding_completion: 10 },
  },
  {
    id: '2', name: 'Bob Johnson', dept: 'Sales', score: 88, tier: 'High',
    factors: ['Tenure Risk', 'Peer Attrition'],
    component_scores: { tenure_risk: 75, compensation_ratio: 60, promotion_velocity: 55, manager_change_recency: 20, team_attrition_exposure: 85, time_since_role_change: 70, leave_anomaly: 25, onboarding_completion: 10 },
  },
  {
    id: '3', name: 'Carol Williams', dept: 'Marketing', score: 65, tier: 'Medium',
    factors: ['Leave Anomaly'],
    component_scores: { tenure_risk: 40, compensation_ratio: 35, promotion_velocity: 30, manager_change_recency: 15, team_attrition_exposure: 20, time_since_role_change: 55, leave_anomaly: 78, onboarding_completion: 10 },
  },
  {
    id: '4', name: 'David Brown', dept: 'Engineering', score: 32, tier: 'Low',
    factors: [],
    component_scores: { tenure_risk: 20, compensation_ratio: 25, promotion_velocity: 15, manager_change_recency: 10, team_attrition_exposure: 12, time_since_role_change: 30, leave_anomaly: 8, onboarding_completion: 10 },
  },
  {
    id: '5', name: 'Eve Davis', dept: 'Product', score: 95, tier: 'Critical',
    factors: ['Promo Velocity', 'Role Stagnation'],
    component_scores: { tenure_risk: 65, compensation_ratio: 70, promotion_velocity: 95, manager_change_recency: 30, team_attrition_exposure: 45, time_since_role_change: 90, leave_anomaly: 40, onboarding_completion: 10 },
  },
];

const TIER_VARIANT: Record<string, 'danger' | 'warning' | 'default' | 'success'> = {
  Critical: 'danger',
  High: 'warning',
  Medium: 'default',
  Low: 'success',
};

export default function RiskPage() {
  const [filterTier, setFilterTier]           = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<RiskEmployee | null>(null);

  const filtered = filterTier ? mockEmployees.filter(e => e.tier === filterTier) : mockEmployees;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Risk Intelligence</h1>
          <p className="text-gray-400 mt-1">AI-driven attrition and performance risk analysis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut chart */}
        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Risk Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {riskDistribution.map(d => (
              <div key={d.name} className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-gray-400">{d.name}</span>
                </div>
                <span className="text-white font-medium">{d.value} employees</span>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* Employee Risk Table */}
        <GlassPanel className="p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              High-Risk Individuals
            </h3>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              {['Critical', 'High', 'Medium', 'Low'].map(tier => (
                <button
                  key={tier}
                  onClick={() => setFilterTier(filterTier === tier ? null : tier)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${filterTier === tier ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'}`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">
                    <span className="flex items-center gap-1 cursor-pointer hover:text-white">
                      Employee <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Risk Score</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Top Risk Factors</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <td className="px-4 py-3 font-medium text-white">{emp.name}</td>
                    <td className="px-4 py-3">{emp.dept}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${emp.score >= 90 ? 'bg-red-500' : emp.score >= 70 ? 'bg-orange-500' : emp.score >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${emp.score}%` }}
                          />
                        </div>
                        <span>{emp.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={TIER_VARIANT[emp.tier]}>{emp.tier}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {emp.factors.length > 0
                          ? emp.factors.map(f => (
                              <span key={f} className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded">{f}</span>
                            ))
                          : <span className="text-gray-500 text-xs">—</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      </div>

      {/* Employee Signal Detail Panel */}
      {selectedEmployee && (
        <GlassPanel className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Signal Profile — {selectedEmployee.name}
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                {selectedEmployee.dept} · Overall Risk Score: <span className={`font-bold ${selectedEmployee.score >= 90 ? 'text-red-400' : selectedEmployee.score >= 70 ? 'text-orange-400' : selectedEmployee.score >= 40 ? 'text-yellow-400' : 'text-emerald-400'}`}>{selectedEmployee.score}</span>
                &nbsp;·&nbsp;<Badge variant={TIER_VARIANT[selectedEmployee.tier]}>{selectedEmployee.tier}</Badge>
              </p>
            </div>
            <button
              onClick={() => setSelectedEmployee(null)}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Radar */}
            <SignalRadarChart
              componentScores={selectedEmployee.component_scores}
              employeeName={selectedEmployee.name}
            />

            {/* Bar breakdown */}
            <div className="space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-4">Signal Breakdown</p>
              {(Object.entries(selectedEmployee.component_scores) as [SignalName, number][]).map(([key, val]) => {
                const label = {
                  tenure_risk: 'Tenure Risk',
                  compensation_ratio: 'Compensation Gap',
                  promotion_velocity: 'Promotion Velocity',
                  manager_change_recency: 'Manager Change',
                  team_attrition_exposure: 'Peer Attrition',
                  time_since_role_change: 'Role Stagnation',
                  leave_anomaly: 'Leave Anomaly',
                  onboarding_completion: 'Onboarding',
                }[key];
                const isTop = selectedEmployee.factors.some(f =>
                  f.toLowerCase().includes(label?.toLowerCase().split(' ')[0] ?? '')
                );
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={isTop ? 'text-white font-medium' : 'text-gray-400'}>
                        {label}{isTop && <span className="ml-1 text-amber-400">★</span>}
                      </span>
                      <span className={val >= 70 ? 'text-red-400' : val >= 45 ? 'text-amber-400' : 'text-emerald-400'}>
                        {val}/100
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${val >= 70 ? 'bg-red-500' : val >= 45 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
