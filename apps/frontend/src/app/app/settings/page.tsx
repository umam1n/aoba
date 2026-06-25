'use client';

import React, { useState, useEffect } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Building2, CreditCard, Users, Settings as SettingsIcon, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  // Profile State
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [timezone, setTimezone] = useState('UTC (GMT+0)');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [companyRes, membersRes] = await Promise.all([
        api.get<any>('/companies/'),
        api.get<any>('/companies/memberships/')
      ]);
      
      if (companyRes.data?.results && companyRes.data.results.length > 0) {
        const comp = companyRes.data.results[0];
        setCompanyId(comp.id);
        setCompanyName(comp.name);
        setIndustry(comp.industry || 'Technology');
      }
      
      if (membersRes.data?.results) {
        setMembers(membersRes.data.results);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    if (!companyId) return;
    setSaving(true);
    await api.put(`/companies/${companyId}/`, {
      name: companyName,
      industry: industry,
    });
    setSaving(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail || !companyId) return;
    
    // Using a fake user ID for now since the backend requires it, but in real flow this might be an invite email logic
    const { data } = await api.post<any>('/companies/memberships/', {
      company: companyId,
      role: inviteRole,
      user_email: inviteEmail // Assuming backend accepts this or we just send an invite email
    });
    
    if (data) {
      setMembers([...members, data]);
    }
    
    setInviteEmail('');
    setShowInviteModal(false);
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    const { data } = await api.put<any>(`/companies/memberships/${memberId}/`, {
      role: newRole
    });
    if (data) {
      setMembers(members.map(m => m.id === memberId ? data : m));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Organization Settings</h1>
        <p className="text-gray-400 mt-1">Manage your company profile, billing, and team access.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlassPanel className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Company Profile</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-400">Company Name</label>
                <input 
                  type="text" 
                  value={companyName} 
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-white focus:outline-none focus:border-blue-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-400">Domain</label>
                <input type="text" defaultValue="acmecorp.com" disabled className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-gray-500 cursor-not-allowed" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-400">Industry</label>
                <select 
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="hr_admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-400">Timezone</label>
                <select 
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-white focus:outline-none focus:border-blue-500"
                >
                  <option>UTC (GMT+0)</option>
                  <option>WIB (GMT+7)</option>
                  <option>EST (GMT-5)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-6 pt-6 border-t border-white/10">
              <Button variant="primary" onClick={handleSaveProfile} disabled={saving || loading}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Team Members</h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowInviteModal(true)}>Invite Member</Button>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                 <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
              ) : members.length === 0 ? (
                 <div className="text-gray-500 text-sm">No members found.</div>
              ) : members.map((member, i) => (
                <div key={member.id || i} className="flex items-center justify-between p-3 rounded-md bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/40 to-purple-500/40 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(member.user_name || 'U').charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm">{member.user_name || 'User'}</div>
                      <div className="text-xs text-gray-500">{member.user_email || 'No email'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <select 
                      value={member.role}
                      onChange={e => handleRoleChange(member.id, e.target.value)}
                      className="bg-transparent text-sm text-gray-300 border-none focus:ring-0 cursor-pointer outline-none"
                    >
                      <option value="hr_admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="employee">Employee</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>

        <div className="space-y-6">
          <GlassPanel className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Subscription & Billing</h3>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30 mb-6">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-white font-medium">Enterprise Plan</h4>
                <Badge variant="success">Active</Badge>
              </div>
              <p className="text-sm text-gray-300">Up to 1,000 employees</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-2xl font-bold text-white">$1,499</span>
                <span className="text-sm text-gray-400 mb-1">/ mo</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button variant="primary" className="w-full justify-center">Manage Billing Portal</Button>
              <Button variant="outline" className="w-full justify-center">View Invoices</Button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Employee Quota</span>
                <span>412 / 1,000</span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full" style={{ width: '41%' }} />
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <GlassPanel className="w-full max-w-md p-6 relative">
            <button onClick={() => setShowInviteModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-white mb-4">Invite Team Member</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-white focus:outline-none focus:border-blue-500 transition-colors" 
                  placeholder="colleague@company.com" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-white/10 rounded-md bg-white/5 cursor-pointer hover:border-blue-500/50">
                    <input 
                      type="radio" 
                      name="role" 
                      value="Admin" 
                      checked={inviteRole === 'Admin'} 
                      onChange={() => setInviteRole('Admin')} 
                      className="mr-3" 
                    />
                    <div>
                      <p className="text-sm font-medium text-white">Admin</p>
                      <p className="text-xs text-gray-400">Full access to settings, billing, and all data.</p>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border border-white/10 rounded-md bg-white/5 cursor-pointer hover:border-blue-500/50">
                    <input 
                      type="radio" 
                      name="role" 
                      value="HR BP" 
                      checked={inviteRole === 'HR BP'} 
                      onChange={() => setInviteRole('HR BP')} 
                      className="mr-3" 
                    />
                    <div>
                      <p className="text-sm font-medium text-white">HR Business Partner</p>
                      <p className="text-xs text-gray-400">Can view analytics and employee details, cannot change settings.</p>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border border-white/10 rounded-md bg-white/5 cursor-pointer hover:border-blue-500/50">
                    <input 
                      type="radio" 
                      name="role" 
                      value="Viewer" 
                      checked={inviteRole === 'Viewer'} 
                      onChange={() => setInviteRole('Viewer')} 
                      className="mr-3" 
                    />
                    <div>
                      <p className="text-sm font-medium text-white">Viewer</p>
                      <p className="text-xs text-gray-400">Can only view aggregated dashboards. No PII access.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button variant="ghost" onClick={() => setShowInviteModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleInvite}>Send Invitation</Button>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
