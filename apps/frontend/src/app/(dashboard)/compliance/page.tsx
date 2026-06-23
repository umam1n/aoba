'use client';

import React from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Shield, FileText, DownloadCloud, Clock, CheckCircle } from 'lucide-react';

const consentLogs = [
  { id: '1', emp: 'Alice Smith', type: 'Data Collection', status: 'Granted', date: '2026-01-15 09:00', ip: '192.168.1.10' },
  { id: '2', emp: 'Alice Smith', type: 'Risk Analysis', status: 'Granted', date: '2026-01-15 09:05', ip: '192.168.1.10' },
  { id: '3', emp: 'Bob Johnson', type: 'Survey Participation', status: 'Revoked', date: '2026-05-10 14:22', ip: '10.0.0.45' },
];

const auditTrail = [
  { id: '1', user: 'Admin User', action: 'Exported Risk Report', target: 'Engineering Dept', date: '2026-06-11 16:45' },
  { id: '2', user: 'System', action: 'Anonymized Data Partition', target: 'Terminated Employees', date: '2026-06-10 00:00' },
  { id: '3', user: 'HR Manager', action: 'Viewed Profile', target: 'Eve Davis', date: '2026-06-09 11:20' },
];

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Data Privacy & Compliance</h1>
          <p className="text-gray-400 mt-1">Manage UU PDP compliance, consent, and audit trails.</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <DownloadCloud className="w-4 h-4" /> Data Subject Access Request
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassPanel className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Employee Data Charter</h3>
          </div>
          <div className="prose prose-invert text-sm text-gray-300 space-y-4">
            <p><strong>Transparency Notice (UU PDP Compliant)</strong></p>
            <p>All predictive analytics and ML models operating on the AOBA platform process data in a fully anonymized space where possible. Explicit consent is tracked for targeted risk predictions.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Data is encrypted at rest using AES-256.</li>
              <li>Pest/Risk predictions are accessible only by authorized HR Business Partners.</li>
              <li>Employees maintain the right to revoke processing consent at any time.</li>
              <li>Automated decisions (e.g., Manager Alerts) require human-in-the-loop validation.</li>
            </ul>
            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-400 m-0 text-sm">System Compliance Status: Active</p>
                <p className="text-xs text-emerald-400/80 m-0 mt-1">Last audited: June 1, 2026</p>
              </div>
            </div>
          </div>
        </GlassPanel>

        <div className="space-y-6">
          <GlassPanel className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> Recent Consent Changes
              </h3>
            </div>
            <div className="space-y-3">
              {consentLogs.map(log => (
                <div key={log.id} className="flex justify-between items-center p-3 rounded-md bg-white/5 border border-white/10">
                  <div>
                    <p className="text-sm font-medium text-white">{log.emp} <span className="text-gray-500 font-normal">({log.type})</span></p>
                    <p className="text-xs text-gray-500 mt-1">{log.date} &bull; IP: {log.ip}</p>
                  </div>
                  <Badge variant={log.status === 'Granted' ? 'success' : 'danger'}>{log.status}</Badge>
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" /> Platform Audit Trail
              </h3>
              <Button variant="ghost" size="sm" className="text-xs">View All</Button>
            </div>
            <div className="relative border-l border-white/10 ml-3 space-y-4 pb-2">
              {auditTrail.map((audit) => (
                <div key={audit.id} className="relative pl-6">
                  <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-purple-400 ring-4 ring-[#0f172a]" />
                  <p className="text-sm text-white"><span className="font-medium text-blue-400">{audit.user}</span> {audit.action}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Target: {audit.target}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{audit.date}</p>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
