'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

export default function PublicSurveyPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [survey, setSurvey] = useState<any>(null);
  const [employeeCode, setEmployeeCode] = useState('');
  const [responses, setResponses] = useState<Record<string, { value: number | null, text: string }>>({});

  useEffect(() => {
    async function fetchSurvey() {
      setLoading(true);
      try {
        const res = await api.get<any>(`/surveys/${id}/public/`);
        if (res.data && !res.error) {
          setSurvey(res.data);
          // Initialize responses
          const initial: any = {};
          if (res.data.questions) {
            res.data.questions.forEach((q: any) => {
              initial[q.id] = { value: null, text: '' };
            });
          }
          setResponses(initial);
        } else {
          setError(res.error || 'Failed to load survey.');
        }
      } catch (err: any) {
        setError(err.message || 'Survey is inactive or not found.');
      }
      setLoading(false);
    }
    fetchSurvey();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeCode.trim()) {
      setError('Please enter your Employee ID/Code.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        employee_code: employeeCode,
        responses: Object.entries(responses).map(([question_id, res]) => ({
          question_id,
          response_value: res.value,
          response_text: res.text
        }))
      };

      const res = await api.post<any>(`/surveys/${id}/submit/`, payload);
      if (res.error) {
        setError(res.error);
      } else {
        setSubmitted(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit survey.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex justify-center items-center p-4">
        <GlassPanel className="p-8 max-w-md w-full text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Cannot Access Survey</h2>
          <p className="text-gray-400">{error}</p>
        </GlassPanel>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex justify-center items-center p-4">
        <GlassPanel className="p-8 max-w-md w-full text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Thank You!</h2>
          <p className="text-gray-400">Your responses have been recorded successfully and securely anonymized for aggregation.</p>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">{survey?.title}</h1>
          <p className="mt-2 text-gray-400">{survey?.description}</p>
        </div>

        <GlassPanel className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="employeeCode" className="block text-sm font-medium text-gray-300">
                Employee ID
              </label>
              <input
                id="employeeCode"
                type="text"
                required
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="Enter your employee ID (e.g. EMP001)"
                className="w-full bg-white/5 border border-white/10 rounded-md py-3 px-4 text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-500">Required to verify eligibility. Your data remains confidential.</p>
            </div>

            <div className="space-y-8 pt-4 border-t border-white/10">
              {survey?.questions?.sort((a: any, b: any) => a.order - b.order).map((q: any, idx: number) => (
                <div key={q.id} className="space-y-4">
                  <h3 className="text-lg font-medium text-white">
                    <span className="text-gray-500 mr-2">{idx + 1}.</span>{q.question_text}
                  </h3>
                  
                  {q.question_type === 'likert_5' && (
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-lg border border-white/10">
                      <span className="text-sm text-gray-400">Strongly Disagree</span>
                      <div className="flex gap-2 sm:gap-4">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setResponses(prev => ({ ...prev, [q.id]: { ...prev[q.id], value: val } }))}
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                              responses[q.id]?.value === val
                                ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                      <span className="text-sm text-gray-400">Strongly Agree</span>
                    </div>
                  )}

                  {q.question_type === 'open_text' && (
                    <textarea
                      rows={4}
                      value={responses[q.id]?.text || ''}
                      onChange={(e) => setResponses(prev => ({ ...prev, [q.id]: { ...prev[q.id], text: e.target.value } }))}
                      placeholder="Share your thoughts..."
                      className="w-full bg-white/5 border border-white/10 rounded-md py-3 px-4 text-white focus:outline-none focus:border-blue-500 resize-none"
                    />
                  )}
                  
                  {q.question_type === 'yes_no' && (
                     <div className="flex gap-4">
                        <Button 
                          type="button"
                          variant={responses[q.id]?.value === 1 ? 'primary' : 'outline'}
                          onClick={() => setResponses(prev => ({ ...prev, [q.id]: { ...prev[q.id], value: 1 } }))}
                          className="flex-1"
                        >
                          Yes
                        </Button>
                        <Button 
                          type="button"
                          variant={responses[q.id]?.value === 0 ? 'primary' : 'outline'}
                          onClick={() => setResponses(prev => ({ ...prev, [q.id]: { ...prev[q.id], value: 0 } }))}
                          className="flex-1"
                        >
                          No
                        </Button>
                     </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-6">
              <Button type="submit" variant="primary" className="w-full py-4 text-lg" disabled={submitting}>
                {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Submit Responses'}
              </Button>
            </div>
          </form>
        </GlassPanel>
      </div>
    </div>
  );
}
