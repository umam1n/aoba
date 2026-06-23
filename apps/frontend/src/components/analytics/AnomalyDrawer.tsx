'use client';

import React from 'react';
import { X, AlertTriangle, CheckCircle, Clock, Building2, User } from 'lucide-react';
import { cn } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import type { AnomalyFlag } from '@/lib/types';

interface AnomalyDrawerProps {
  anomaly: AnomalyFlag | null;
  onClose: () => void;
  onResolve?: (id: string) => void;
}

const SEVERITY_CONFIG = {
  critical: {
    border: 'border-red-500/50',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    icon: 'text-red-400',
    label: 'Critical',
    bar: 'bg-red-500',
  },
  alert: {
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    icon: 'text-amber-400',
    label: 'Alert',
    bar: 'bg-amber-500',
  },
  warning: {
    border: 'border-blue-500/50',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    icon: 'text-blue-400',
    label: 'Warning',
    bar: 'bg-blue-500',
  },
};

const TYPE_LABELS: Record<AnomalyFlag['anomaly_type'], string> = {
  response_rate_drop: 'Survey Response Rate Drop',
  team_attrition: 'Team Attrition Spike',
  manager_low_scores: 'Manager Low Engagement Scores',
  leave_spike: 'Abnormal Leave Spike',
};

function DescriptionBlock({ description }: { description: Record<string, unknown> }) {
  return (
    <div className="space-y-2">
      {Object.entries(description).map(([key, value]) => (
        <div key={key} className="flex justify-between items-center py-1.5 border-b border-white/5 text-sm">
          <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
          <span className="text-gray-200 font-mono text-xs">
            {typeof value === 'number'
              ? value % 1 !== 0 ? value.toFixed(1) : value
              : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AnomalyDrawer({ anomaly, onClose, onResolve }: AnomalyDrawerProps) {
  if (!anomaly) return null;

  const cfg = SEVERITY_CONFIG[anomaly.severity] ?? SEVERITY_CONFIG.warning;
  const detectedDate = new Date(anomaly.detected_at).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg z-50 flex flex-col bg-[#0d1424] border-l border-white/10 shadow-2xl overflow-hidden">
        {/* Severity bar at top */}
        <div className={cn('h-1 w-full', cfg.bar)} />

        {/* Header */}
        <div className={cn('p-6 border-b border-white/10', cfg.bg)}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className={cn('w-5 h-5 mt-0.5 shrink-0', cfg.icon)} />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded', cfg.bg, cfg.text, cfg.border, 'border')}>{cfg.label}</span>
                  <span className="text-xs text-gray-500">#{anomaly.id.slice(0, 8)}</span>
                </div>
                <h2 className="text-base font-semibold text-white">{TYPE_LABELS[anomaly.anomaly_type]}</h2>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Entity Info */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Affected Entity</h3>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              {anomaly.entity_type === 'manager' ? (
                <User className="w-8 h-8 text-purple-400 bg-purple-400/10 rounded-full p-1.5" />
              ) : (
                <Building2 className="w-8 h-8 text-blue-400 bg-blue-400/10 rounded-full p-1.5" />
              )}
              <div>
                <p className="text-white font-medium">{anomaly.entity_name}</p>
                <p className="text-xs text-gray-500 capitalize">{anomaly.entity_type} · ID: {anomaly.entity_id}</p>
              </div>
            </div>
          </div>

          {/* Metrics */}
          {(anomaly.metric_value !== undefined || anomaly.threshold_value !== undefined) && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Metrics</h3>
              <div className="grid grid-cols-2 gap-3">
                {anomaly.metric_value !== undefined && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                    <p className={cn('text-2xl font-bold', cfg.text)}>{anomaly.metric_value.toFixed(1)}</p>
                    <p className="text-xs text-gray-500 mt-1">Observed Value</p>
                  </div>
                )}
                {anomaly.threshold_value !== undefined && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-400">{anomaly.threshold_value.toFixed(1)}</p>
                    <p className="text-xs text-gray-500 mt-1">Threshold</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description details */}
          {Object.keys(anomaly.description).length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Detection Details</h3>
              <DescriptionBlock description={anomaly.description} />
            </div>
          )}

          {/* Timeline */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-gray-500 shrink-0" />
                <div>
                  <p className="text-gray-300">Detected</p>
                  <p className="text-xs text-gray-500">{detectedDate}</p>
                </div>
              </div>
              {anomaly.resolved_at ? (
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-emerald-400">Resolved</p>
                    <p className="text-xs text-gray-500">{new Date(anomaly.resolved_at).toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-4 h-4 rounded-full border-2 border-amber-400 shrink-0 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  </div>
                  <p className="text-amber-400">Active — Awaiting Resolution</p>
                </div>
              )}
            </div>
          </div>

          {/* Recommended Actions */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recommended Actions</h3>
            <div className="space-y-2">
              {anomaly.anomaly_type === 'team_attrition' && [
                'Schedule 1:1 retention conversations with remaining team members.',
                'Review manager\'s leadership score and recent feedback.',
                'Check if compensation is competitive vs. market bands.',
              ].map((action, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 bg-white/5 rounded-md border border-white/10 text-sm text-gray-300">
                  <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span> {action}
                </div>
              ))}
              {anomaly.anomaly_type === 'response_rate_drop' && [
                'Send a reminder with an updated survey deadline.',
                'Investigate if the survey was accessible to the affected department.',
                'Consider shortening the survey if response fatigue is suspected.',
              ].map((action, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 bg-white/5 rounded-md border border-white/10 text-sm text-gray-300">
                  <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span> {action}
                </div>
              ))}
              {anomaly.anomaly_type === 'leave_spike' && [
                'Verify leave records are correctly categorized.',
                'Check for a specific department-level stressor (deadline, reorg).',
                'Consider a pulse check survey to understand root cause.',
              ].map((action, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 bg-white/5 rounded-md border border-white/10 text-sm text-gray-300">
                  <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span> {action}
                </div>
              ))}
              {anomaly.anomaly_type === 'manager_low_scores' && [
                'Review manager\'s recent 360 feedback and Pulse Survey results.',
                'Schedule a coaching session with HR Business Partner.',
                'Flag for management effectiveness training program.',
              ].map((action, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 bg-white/5 rounded-md border border-white/10 text-sm text-gray-300">
                  <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span> {action}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
          {anomaly.is_active && onResolve && (
            <Button
              variant="primary"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => { onResolve(anomaly.id); onClose(); }}
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Mark Resolved
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
