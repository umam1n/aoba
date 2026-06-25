'use client';

import React, { useState, useEffect } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Shield, FileText, DownloadCloud, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function CompliancePage() {
  const [consentLogs, setConsentLogs] = useState<any[]>([]);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [consentRes, auditRes] = await Promise.all([
        api.get<any>('/compliance/consent/'),
        api.get<any>('/compliance/audit/')
      ]);
      
      if (consentRes.data?.results) setConsentLogs(consentRes.data.results);
      if (auditRes.data?.results) setAuditTrail(auditRes.data.results);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleExport = async () => {
    // In a real DSAR flow, an employee ID would be provided. For HR Admin, we'll request a generic export or prompt for ID.
    const empId = prompt("Enter Employee ID to generate Data Subject Access Request export:");
    if (!empId) return;

    setExporting(true);
    try {
      const res = await api.post<any>('/compliance/export/', { employee_id: empId });
      if (res.data?.download_url) {
        window.open(res.data.download_url, '_blank');
      } else {
        alert("Export generated successfully (JSON data logged to console for demo).");
        console.log("DSAR Export:", res.data);
      }
    } catch (err: any) {
      alert("Failed to export: " + err.message);
    }
    setExporting(false);
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Data Privacy & Compliance</h1>
          <p className="text-gray-400 mt-1">Manage UU PDP compliance, consent, and audit trails.</p>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />} 
          Data Subject Access Request
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
              {loading ? (
                <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
              ) : consentLogs.length === 0 ? (
                <div className="text-gray-500 text-sm text-center">No consent logs found.</div>
              ) : consentLogs.map(log => (
                <div key={log.id} className="flex justify-between items-center p-3 rounded-md bg-white/5 border border-white/10">
                  <div>
                    <p className="text-sm font-medium text-white">{log.employee_name || log.employee} <span className="text-gray-500 font-normal">({log.consent_type})</span></p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(log.granted_at).toLocaleString()} &bull; IP: {log.ip_address}</p>
                  </div>
                  <Badge variant={log.granted ? 'success' : 'danger'}>{log.granted ? 'Granted' : 'Revoked'}</Badge>
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
              {loading ? (
                <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-purple-500" /></div>
              ) : auditTrail.length === 0 ? (
                <div className="text-gray-500 text-sm pl-4">No audit logs found.</div>
              ) : auditTrail.map((audit) => (
                <div key={audit.id} className="relative pl-6">
                  <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-purple-400 ring-4 ring-[#0f172a]" />
                  <p className="text-sm text-white"><span className="font-medium text-blue-400">{audit.user_name || audit.user || 'System'}</span> {audit.action}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Target: {audit.resource_type} {audit.resource_id}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{new Date(audit.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
