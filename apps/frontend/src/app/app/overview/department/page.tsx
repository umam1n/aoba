'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Users, AlertTriangle, Activity, Briefcase, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function DepartmentDeepDivePage() {
  const searchParams = useSearchParams();
  const dept = searchParams.get('dept') || 'Engineering';

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [riskScores, setRiskScores] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // In a real app we'd pass ?department=dept to the backend
      const [empRes, riskRes] = await Promise.all([
        api.get<any>('/employees/?page_size=1000'),
        api.get<any>('/analytics/risk-scores/?page_size=1000')
      ]);

      if (empRes.data?.results) {
        setEmployees(empRes.data.results.filter((e: any) => e.department === dept));
      }
      if (riskRes.data?.results) {
        setRiskScores(riskRes.data.results.filter((r: any) => r.employee?.department === dept || r.department === dept));
      }
      setLoading(false);
    }
    fetchData();
  }, [dept]);

  const highRisk = riskScores.filter(r => r.risk_tier === 'critical' || r.risk_tier === 'high').length;
  const avgConfidence = riskScores.length > 0
    ? (riskScores.reduce((acc, r) => acc + (r.model_confidence ? Number(r.model_confidence) : 0.85), 0) / riskScores.length * 100).toFixed(0)
    : 85;

  // Role distribution for chart
  const roleMap: Record<string, { high: number, medium: number, low: number }> = {};
  riskScores.forEach(r => {
    // try to get role from employee object or risk object
    const emp = employees.find(e => e.id === r.employee || e.id === r.employee?.id);
    const role = emp?.role_title || 'Unknown Role';
    if (!roleMap[role]) roleMap[role] = { high: 0, medium: 0, low: 0 };
    if (r.risk_tier === 'critical' || r.risk_tier === 'high') roleMap[role].high++;
    else if (r.risk_tier === 'medium') roleMap[role].medium++;
    else roleMap[role].low++;
  });

  const roleData = Object.keys(roleMap).map(name => ({ name, ...roleMap[name] })).sort((a, b) => b.high - a.high);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/app/overview">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Overview
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{dept} Deep Dive</h1>
          <p className="text-gray-400 mt-1">Detailed risk analysis and composition for the {dept} department.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={highRisk > 0 ? 'danger' : 'success'} className="px-3 py-1 text-sm">
            {highRisk} High Risk Assets
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassPanel strong className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-400 font-medium text-sm uppercase tracking-wider">Dept Headcount</h3>
                <Users className="text-blue-400 w-5 h-5" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{employees.length}</span>
              </div>
            </GlassPanel>

            <GlassPanel strong className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-400 font-medium text-sm uppercase tracking-wider">High Risk Count</h3>
                <AlertTriangle className="text-red-400 w-5 h-5" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{highRisk}</span>
                <span className="text-sm text-gray-400">/ {employees.length}</span>
              </div>
            </GlassPanel>

            <GlassPanel strong className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-400 font-medium text-sm uppercase tracking-wider">Avg Prediction Confidence</h3>
                <Activity className="text-emerald-400 w-5 h-5" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{avgConfidence}%</span>
              </div>
            </GlassPanel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassPanel className="p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-6">Risk by Role</h3>
              <div className="h-72 w-full">
                {roleData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                      />
                      <Legend />
                      <Bar dataKey="high" name="High Risk" stackId="a" fill="#ef4444" />
                      <Bar dataKey="medium" name="Medium Risk" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="low" name="Low Risk" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">No role data available</div>
                )}
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Key Personnel</h3>
              <div className="space-y-4">
                {employees.slice(0, 5).map(emp => {
                  const rScore = riskScores.find(r => r.employee === emp.id || r.employee?.id === emp.id);
                  const tier = rScore?.risk_tier || 'low';
                  return (
                    <Link key={emp.id} href={`/app/employees/${emp.id}`}>
                      <div className="group block p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer mb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium text-white group-hover:text-blue-400">{emp.full_name}</div>
                            <div className="text-xs text-gray-400">{emp.role_title}</div>
                          </div>
                          <Badge variant={tier === 'critical' || tier === 'high' ? 'danger' : tier === 'medium' ? 'warning' : 'success'}>
                            {tier}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </GlassPanel>
          </div>
        </>
      )}
    </div>
  );
}
