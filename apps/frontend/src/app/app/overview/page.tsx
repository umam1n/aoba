'use client';

import React, { useState, useEffect } from 'react';
import { GlassPanel, cn } from '@/components/ui/GlassPanel';
import { Badge } from '@/components/ui/Badge';
import { AnomalyDrawer } from '@/components/analytics/AnomalyDrawer';
import { AlertTriangle, TrendingUp, Users, Activity, Loader2 } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from 'recharts';
import type { AnomalyFlag } from '@/lib/types';
import { api } from '@/lib/api';

const attritionData = [
  { month: 'Jan', rate: 2.1, predicted: 2.1 },
  { month: 'Feb', rate: 2.4, predicted: 2.3 },
  { month: 'Mar', rate: 3.1, predicted: 2.8 },
  { month: 'Apr', rate: 2.8, predicted: 3.2 },
  { month: 'May', rate: 3.5, predicted: 3.8 },
  { month: 'Jun', rate: null, predicted: 4.2 },
];

const riskByDept = [
  { name: 'Engineering', high: 12, medium: 28, low: 80 },
  { name: 'Sales',       high: 18, medium: 22, low: 45 },
  { name: 'Marketing',   high: 5,  medium: 15, low: 30 },
  { name: 'Product',     high: 3,  medium: 10, low: 25 },
];

// Mock data for charts (API endpoints not yet built for these specific aggregations)

const SEVERITY_STYLES = {
  critical: 'bg-red-500 pulse-glow',
  alert:    'bg-amber-500',
  warning:  'bg-blue-500',
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function OverviewPage() {
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyFlag | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyFlag[]>([]);
  const [loadingAnomalies, setLoadingAnomalies] = useState(true);

  useEffect(() => {
    async function fetchAnomalies() {
      setLoadingAnomalies(true);
      const { data, error } = await api.get<{ results: AnomalyFlag[] }>('/analytics/anomalies/');
      if (data && data.results) {
        setAnomalies(data.results);
      } else {
        console.error('Failed to fetch anomalies:', error);
      }
      setLoadingAnomalies(false);
    }
    fetchAnomalies();
  }, []);

  const handleResolve = async (id: string) => {
    // Optimistic UI update
    setAnomalies(prev =>
      prev.map(a => a.id === id ? { ...a, is_active: false, resolved_at: new Date().toISOString() } : a)
    );
    // Real API call
    await api.post(`/analytics/anomalies/${id}/resolve/`, {});
  };

  const activeAnomalies = anomalies.filter(a => a.is_active);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Department Health Overview</h1>
          <p className="text-gray-400 mt-1">Workforce intelligence metrics across your organization.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" className="px-3 py-1 text-sm">
            <span className="flex items-center gap-1">
              <Activity className="w-4 h-4" /> System Healthy
            </span>
          </Badge>
          <span className="text-xs text-gray-500">Last updated: Just now</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassPanel strong className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 font-medium text-sm uppercase tracking-wider">Total Headcount</h3>
            <Users className="text-blue-400 w-5 h-5" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">412</span>
            <span className="text-emerald-400 text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" /> +12%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">vs last quarter</p>
        </GlassPanel>

        <GlassPanel strong className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 font-medium text-sm uppercase tracking-wider">High Risk Employees</h3>
            <AlertTriangle className="text-red-400 w-5 h-5" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">38</span>
            <span className="text-red-400 text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" /> +4
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">vs last month</p>
        </GlassPanel>

        <GlassPanel strong className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 font-medium text-sm uppercase tracking-wider">Avg Prediction Confidence</h3>
            <Activity className="text-emerald-400 w-5 h-5" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">87%</span>
            <span className="text-emerald-400 text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" /> +2%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Layer 4 XGBoost Model Active</p>
        </GlassPanel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <GlassPanel className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-6">Attrition Forecast (6 Months)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attritionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="rate"      stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" name="Actual %" />
                <Area type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPred)" name="Forecast %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        {/* Anomalies List */}
        <GlassPanel className="p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Layer 3 Anomalies</h3>
            <Badge variant={activeAnomalies.length > 0 ? 'danger' : 'success'}>
              {activeAnomalies.length} Active
            </Badge>
          </div>
          <div className="flex-1 space-y-3">
            {loadingAnomalies ? (
              <div className="flex items-center justify-center p-8 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading anomalies...
              </div>
            ) : anomalies.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-gray-500">
                No anomalies detected.
              </div>
            ) : (
              anomalies.map((anomaly) => (
                <button
                  key={anomaly.id}
                  onClick={() => setSelectedAnomaly(anomaly)}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border transition-all cursor-pointer relative overflow-hidden group',
                    anomaly.is_active
                      ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      : 'bg-white/2 border-white/5 opacity-50'
                  )}
                >
                  <div className={cn(
                    'absolute left-0 top-0 bottom-0 w-1',
                    SEVERITY_STYLES[anomaly.severity]
                  )} />
                  <div className="flex justify-between items-start mb-1 ml-2">
                    <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                      {anomaly.entity_name}
                    </span>
                    <span className="text-xs text-gray-500">{timeAgo(anomaly.detected_at)}</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-2 capitalize">
                    {anomaly.anomaly_type.replace(/_/g, ' ')}
                    {!anomaly.is_active && <span className="ml-2 text-emerald-500">✓ resolved</span>}
                  </p>
                </button>
              ))
            )}
          </div>
        </GlassPanel>
      </div>

      {/* Secondary Chart */}
      <GlassPanel className="p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Risk Distribution by Department</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riskByDept} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="high"   name="High Risk"   stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
              <Bar dataKey="medium" name="Medium Risk" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="low"    name="Low Risk"    stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassPanel>

      <AnomalyDrawer
        anomaly={selectedAnomaly}
        onClose={() => setSelectedAnomaly(null)}
        onResolve={handleResolve}
      />
    </div>
  );
}
