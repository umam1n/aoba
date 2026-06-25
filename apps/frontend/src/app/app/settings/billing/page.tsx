'use client';

import React, { useState, useEffect } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CreditCard, ArrowLeft, Loader2, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    async function fetchBilling() {
      setLoading(true);
      try {
        const res = await api.get<any>('/billing/status/');
        if (res.data) setStatus(res.data);
      } catch (err) {
        console.error('Error fetching billing status', err);
      }
      setLoading(false);
    }
    fetchBilling();
  }, []);

  const handleManageBilling = async () => {
    try {
      const res = await api.post<any>('/billing/portal/', {});
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Error launching portal', err);
    }
  };

  const handleCheckout = async (tier: string) => {
    try {
      const res = await api.post<any>('/billing/checkout/', { tier });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Error launching checkout', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/app/settings">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Billing & Plans</h1>
        <p className="text-gray-400 mt-1">Manage your organization's subscription and payment methods.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlassPanel className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Current Plan</h3>
              </div>
              {status?.subscription_status === 'active' ? (
                <Badge variant="success">Active</Badge>
              ) : status?.subscription_status === 'trial' ? (
                <Badge variant="warning">Trial</Badge>
              ) : (
                <Badge variant="danger">Past Due</Badge>
              )}
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xl font-bold text-white uppercase">{status?.subscription_tier || 'Starter'} Plan</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    {status?.subscription_tier === 'enterprise' ? 'Unlimited employees' : 'Up to 500 employees'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-white">
                    {status?.subscription_tier === 'enterprise' ? 'Custom' : status?.subscription_tier === 'growth' ? '$99' : '$49'}
                  </span>
                  <span className="text-gray-500 text-sm"> / mo</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              {status?.stripe_customer_id ? (
                <Button variant="outline" onClick={handleManageBilling}>
                  Manage Billing (Stripe)
                </Button>
              ) : (
                <Button variant="primary" onClick={() => handleCheckout('growth')}>
                  Upgrade to Growth
                </Button>
              )}
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Features Overview</h3>
            <div className="space-y-3">
              {[
                { feature: 'Predictive Attrition Modeling', enabled: true },
                { feature: 'Automated Pulse Surveys', enabled: true },
                { feature: 'Compliance Automation (UU PDP)', enabled: true },
                { feature: 'Advanced Role Cost Benchmarking', enabled: status?.subscription_tier !== 'starter' },
                { feature: 'Custom Data Exports', enabled: status?.subscription_tier !== 'starter' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  {item.enabled ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-gray-600" />
                    </div>
                  )}
                  <span className={item.enabled ? 'text-gray-200' : 'text-gray-500 line-through decoration-gray-600'}>
                    {item.feature}
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>

        <div className="space-y-6">
          <GlassPanel className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Payment History</h3>
            <div className="space-y-4">
              {status?.stripe_customer_id ? (
                <p className="text-sm text-gray-400 mb-4">View your full payment history and download invoices in the Stripe portal.</p>
              ) : (
                <div className="text-center p-4 border border-white/5 bg-white/2 rounded-md">
                  <Clock className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No payment history available.</p>
                </div>
              )}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
