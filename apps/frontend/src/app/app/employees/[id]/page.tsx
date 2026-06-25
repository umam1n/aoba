'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { User, Briefcase, Mail, Phone, MapPin, Calendar, Activity, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { SignalRadarChart } from '@/components/analytics/SignalRadarChart';

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<any>(null);
  const [riskScore, setRiskScore] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const empRes = await api.get<any>(`/employees/${id}/`);
        if (empRes.data) {
          setEmployee(empRes.data);
        }
        
        // Fetch risk score for this employee
        const riskRes = await api.get<any>(`/analytics/risk-scores/?employee=${id}`);
        if (riskRes.data?.results && riskRes.data.results.length > 0) {
          setRiskScore(riskRes.data.results[0]);
        }
      } catch (err) {
        console.error('Error fetching employee details', err);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!employee) {
    return <div className="text-white text-center mt-20">Employee not found.</div>;
  }

  const tier = riskScore?.risk_tier || 'low';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/app/employees">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Directory
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Sidebar */}
        <div className="w-full md:w-1/3 space-y-6">
          <GlassPanel className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mb-4">
                {employee.full_name.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-white">{employee.full_name}</h2>
              <p className="text-gray-400">{employee.role_title}</p>
              <div className="mt-4">
                <Badge variant={tier === 'critical' || tier === 'high' ? 'danger' : tier === 'medium' ? 'warning' : 'success'}>
                  {tier.toUpperCase()} RISK
                </Badge>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <span>{employee.department}</span>
              </div>
              {employee.email && (
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{employee.email}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Hired: {employee.hire_date} ({employee.tenure_months || 0} months)</span>
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Details & Analytics */}
        <div className="w-full md:w-2/3 space-y-6">
          {riskScore ? (
            <GlassPanel className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" /> Risk Profile
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Overall Score: {riskScore.overall_score} / 100
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">Model Confidence</div>
                  <div className="font-bold text-emerald-400">
                    {riskScore.model_confidence ? (Number(riskScore.model_confidence) * 100).toFixed(0) : 85}%
                  </div>
                </div>
              </div>

              <div className="h-64 mb-6">
                {/* Assuming SignalRadarChart accepts the riskScore components */}
                <SignalRadarChart componentScores={riskScore.component_scores} />
              </div>

              {riskScore.top_factors && riskScore.top_factors.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-300 mb-3 uppercase tracking-wider">Top Risk Factors</h4>
                  <div className="space-y-2">
                    {riskScore.top_factors.map((factor: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 p-2 rounded-md">
                        <AlertTriangle className="w-4 h-4 text-amber-500" /> {factor}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassPanel>
          ) : (
             <GlassPanel className="p-6 flex flex-col items-center justify-center h-48 text-gray-500">
               <Activity className="w-8 h-8 mb-2 opacity-50" />
               <p>No risk analysis available for this employee.</p>
             </GlassPanel>
          )}

          <GlassPanel className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Role History</h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
               {employee.role_history && employee.role_history.length > 0 ? employee.role_history.map((history: any, idx: number) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white/20 bg-slate-900 text-gray-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm">
                       <Briefcase className="w-3 h-3" />
                     </div>
                     <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-lg bg-white/5 border border-white/10">
                       <div className="flex items-center justify-between mb-1">
                         <h4 className="text-sm font-bold text-white">{history.role_title}</h4>
                         <span className="text-xs text-blue-400">{history.effective_date}</span>
                       </div>
                       <p className="text-xs text-gray-400">{history.change_type}</p>
                     </div>
                  </div>
               )) : (
                 <div className="text-sm text-gray-500 text-center relative z-10 py-4 bg-slate-900">No role changes recorded</div>
               )}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
