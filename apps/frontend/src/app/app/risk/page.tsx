'use client';

import React, { useState, useEffect } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SignalRadarChart } from '@/components/analytics/SignalRadarChart';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AlertTriangle, Filter, X, ArrowUpDown, Loader2, RefreshCw } from 'lucide-react';
import type { RiskScore, SignalName, ApiResponse } from '@/lib/types';
import { api } from '@/lib/api';

const TIER_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const TIER_VARIANT: Record<string, 'danger' | 'warning' | 'default' | 'success'> = {
  critical: 'danger',
  high: 'warning',
  medium: 'default',
  low: 'success',
};

export default function RiskPage() {
  const [filterTier, setFilterTier] = useState<string | null>(null);
  const [riskScores, setRiskScores] = useState<RiskScore[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  
  const [selectedEmployee, setSelectedEmployee] = useState<RiskScore | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    async function fetchRiskScores() {
      try {
        setLoadingList(true);
        // Fetch the lightweight list of risk scores
        const res = await api.get<ApiResponse<RiskScore[]>>('/analytics/risk-scores/');
        setRiskScores(res.data?.results || []);
      } catch (error) {
        console.error('Failed to fetch risk scores:', error);
      } finally {
        setLoadingList(false);
      }
    }
    fetchRiskScores();
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await api.post<any>('/analytics/recalculate/', {});
      // Re-fetch after a short delay to allow calculation
      setTimeout(async () => {
        try {
          const res = await api.get<ApiResponse<RiskScore[]>>('/analytics/risk-scores/');
          setRiskScores(res.data?.results || []);
        } catch (e) { }
        setRecalculating(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to recalculate:', error);
      setRecalculating(false);
    }
  };

  const handleSelectEmployee = async (employee: RiskScore) => {
    // If we already have the detailed component scores, just select it
    if (employee.component_scores) {
      setSelectedEmployee(employee);
      return;
    }

    try {
      setLoadingDetail(true);
      // Fetch the detailed payload with component_scores and top_factors
      const res = await api.get<RiskScore>(`/analytics/risk-scores/${employee.id}/`);
      
      if (res.data) {
        // Update the main list with the cached detailed data (optional)
        setRiskScores(prev => prev.map(r => r.id === employee.id ? res.data! : r));
        setSelectedEmployee(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch detailed risk score:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filtered = filterTier ? riskScores.filter(e => e.risk_tier === filterTier) : riskScores;

  // Dynamically calculate risk distribution for the pie chart
  const riskDistribution = [
    { name: 'Critical', value: riskScores.filter(r => r.risk_tier === 'critical').length, color: TIER_COLORS.critical },
    { name: 'High', value: riskScores.filter(r => r.risk_tier === 'high').length, color: TIER_COLORS.high },
    { name: 'Medium', value: riskScores.filter(r => r.risk_tier === 'medium').length, color: TIER_COLORS.medium },
    { name: 'Low', value: riskScores.filter(r => r.risk_tier === 'low').length, color: TIER_COLORS.low },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Risk Intelligence</h1>
          <p className="text-gray-400 mt-1">AI-driven attrition and performance risk analysis.</p>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={handleRecalculate}
          disabled={recalculating}
        >
          <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
          {recalculating ? 'Recalculating...' : 'Recalculate Scores'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut chart */}
        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Risk Distribution</h3>
          {loadingList ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
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
            </>
          )}
        </GlassPanel>

        {/* Employee Risk Table */}
        <GlassPanel className="p-6 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              High-Risk Individuals
            </h3>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              {['critical', 'high', 'medium', 'low'].map(tier => (
                <button
                  key={tier}
                  onClick={() => setFilterTier(filterTier === tier ? null : tier)}
                  className={`text-xs px-2 py-1 rounded transition-colors uppercase ${filterTier === tier ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'}`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            {loadingList ? (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Risk Score</th>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3">Top Risk Factors</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map((emp) => (
                    <tr
                      key={emp.id}
                      className={`border-b border-white/5 cursor-pointer transition-colors ${selectedEmployee?.id === emp.id ? 'bg-blue-500/10' : 'hover:bg-white/5'}`}
                      onClick={() => handleSelectEmployee(emp)}
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        {emp.employee_name}
                        <span className="block text-xs text-gray-500 font-normal">{emp.employee_code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${Number(emp.overall_score) >= 90 ? 'bg-red-500' : Number(emp.overall_score) >= 70 ? 'bg-orange-500' : Number(emp.overall_score) >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${emp.overall_score}%` }}
                            />
                          </div>
                          <span>{Number(emp.overall_score).toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 uppercase text-xs">
                        <Badge variant={TIER_VARIANT[emp.risk_tier] || 'default'}>{emp.risk_tier}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {/* The list view doesn't have top_factors by default unless fetched */}
                          {emp.top_factors && emp.top_factors.length > 0
                            ? emp.top_factors.map(f => (
                                <span key={f} className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded">{f.replace(/_/g, ' ')}</span>
                              ))
                            : <span className="text-gray-500 text-xs text-italic">Click to analyze</span>}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        No risk records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </GlassPanel>
      </div>

      {/* Employee Signal Detail Panel */}
      {selectedEmployee && (
        <GlassPanel className="p-6 relative overflow-hidden">
          {loadingDetail && (
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
              <p className="text-sm text-gray-300">Analyzing signals...</p>
            </div>
          )}
          
          <div className="flex justify-between items-center mb-6 relative z-20">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Signal Profile — {selectedEmployee.employee_name}
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                {selectedEmployee.department || 'Unknown Dept'} · Overall Risk Score: <span className={`font-bold ${Number(selectedEmployee.overall_score) >= 90 ? 'text-red-400' : Number(selectedEmployee.overall_score) >= 70 ? 'text-orange-400' : Number(selectedEmployee.overall_score) >= 40 ? 'text-yellow-400' : 'text-emerald-400'}`}>{Number(selectedEmployee.overall_score).toFixed(1)}</span>
                &nbsp;·&nbsp;<Badge variant={TIER_VARIANT[selectedEmployee.risk_tier] || 'default'} className="uppercase">{selectedEmployee.risk_tier}</Badge>
              </p>
            </div>
            <button
              onClick={() => setSelectedEmployee(null)}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-20">
            {/* Radar */}
            {selectedEmployee.component_scores && (
              <SignalRadarChart
                componentScores={selectedEmployee.component_scores}
                employeeName={selectedEmployee.employee_name}
              />
            )}

            {/* Bar breakdown */}
            <div className="space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-4">Signal Breakdown</p>
              {selectedEmployee.component_scores && (Object.entries(selectedEmployee.component_scores) as [SignalName, number][]).map(([key, val]) => {
                const label = {
                  tenure_risk: 'Tenure Risk',
                  compensation_ratio: 'Compensation Gap',
                  promotion_velocity: 'Promotion Velocity',
                  manager_change_recency: 'Manager Change',
                  team_attrition_exposure: 'Peer Attrition',
                  time_since_role_change: 'Role Stagnation',
                  leave_anomaly: 'Leave Anomaly',
                  onboarding_completion: 'Onboarding',
                }[key] || key;
                
                const isTop = selectedEmployee.top_factors?.includes(key);
                
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={isTop ? 'text-white font-medium' : 'text-gray-400'}>
                        {label}{isTop && <span className="ml-1 text-amber-400">★</span>}
                      </span>
                      <span className={val >= 70 ? 'text-red-400' : val >= 45 ? 'text-amber-400' : 'text-emerald-400'}>
                        {Number(val).toFixed(0)}/100
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
