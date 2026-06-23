'use client';

import React from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts';
import type { ComponentScores, SignalName } from '@/lib/types';

const SIGNAL_LABELS: Record<SignalName, string> = {
  tenure_risk: 'Tenure',
  compensation_ratio: 'Comp. Gap',
  promotion_velocity: 'Promo Velocity',
  manager_change_recency: 'Mgr Change',
  team_attrition_exposure: 'Peer Attrition',
  time_since_role_change: 'Role Stagnation',
  leave_anomaly: 'Leave Anomaly',
  onboarding_completion: 'Onboarding',
};

interface SignalRadarChartProps {
  componentScores: ComponentScores;
  employeeName?: string;
}

export function SignalRadarChart({ componentScores, employeeName }: SignalRadarChartProps) {
  const data = (Object.entries(componentScores) as [SignalName, number][]).map(([key, value]) => ({
    signal: SIGNAL_LABELS[key],
    score: value,
    fullMark: 100,
  }));

  return (
    <div className="w-full">
      {employeeName && (
        <p className="text-xs text-gray-500 text-center mb-2">{employeeName} — Layer-1 Signal Profile</p>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis
            dataKey="signal"
            tick={{ fill: '#9ca3af', fontSize: 10 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#6b7280', fontSize: 9 }}
            tickCount={4}
          />
          <Radar
            name="Risk Score"
            dataKey="score"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px',
            }}
            formatter={(value) => [`${value ?? '—'}/100`, 'Risk Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
