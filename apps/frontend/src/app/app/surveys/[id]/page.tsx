'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { FileText, ArrowLeft, Loader2, Users, Target, Activity } from 'lucide-react';
import Link from 'next/link';

export default function SurveyResultsPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<any>(null);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [surveyRes, resultsRes] = await Promise.all([
          api.get<any>(`/surveys/${id}/`),
          api.get<any>(`/surveys/${id}/results/`)
        ]);
        
        if (surveyRes.data) setSurvey(surveyRes.data);
        if (resultsRes.data) setResults(resultsRes.data);
      } catch (err) {
        console.error('Error fetching survey data', err);
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

  if (!survey) {
    return <div className="text-white text-center mt-20">Survey not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/app/surveys">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Surveys
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{survey.title} - Results</h1>
          <p className="text-gray-400 mt-1">{survey.description || 'View detailed analytics and responses for this pulse survey.'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={survey.status === 'active' ? 'success' : survey.status === 'closed' ? 'default' : 'warning'}>
            {survey.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassPanel strong className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-400 font-medium text-sm uppercase tracking-wider">Response Rate</h3>
              <Activity className="text-blue-400 w-5 h-5" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{(results.response_rate_percent || 0).toFixed(1)}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{results.unique_respondents} of {results.total_eligible_employees} employees</p>
          </GlassPanel>

          <GlassPanel strong className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-400 font-medium text-sm uppercase tracking-wider">Total Responses</h3>
              <Users className="text-purple-400 w-5 h-5" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{results.total_responses}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Across {results.question_results?.length || 0} questions</p>
          </GlassPanel>

          <GlassPanel strong className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-400 font-medium text-sm uppercase tracking-wider">Overall Sentiment</h3>
              <Target className="text-emerald-400 w-5 h-5" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{survey.status === 'closed' ? 'Finalized' : 'Collecting'}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Data is aggregated</p>
          </GlassPanel>
        </div>
      )}

      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-white">Question Breakdown</h3>
        {results?.question_results?.length > 0 ? (
          results.question_results.map((qr: any, idx: number) => (
            <GlassPanel key={qr.question_id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-white font-medium flex gap-2">
                    <span className="text-gray-500">Q{idx + 1}.</span> {qr.question_text}
                  </h4>
                  <Badge variant="default" className="mt-2 text-xs">{qr.question_type}</Badge>
                </div>
                {qr.question_type === 'likert_5' && qr.average_score !== null && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{Number(qr.average_score).toFixed(1)} <span className="text-sm text-gray-500 font-normal">/ 5</span></div>
                    <div className="text-xs text-gray-500">Average Score</div>
                  </div>
                )}
              </div>

              {qr.question_type === 'likert_5' && qr.distribution && (
                <div className="mt-6">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>1 (Low)</span>
                    <span>5 (High)</span>
                  </div>
                  <div className="h-4 w-full bg-white/5 rounded-full flex overflow-hidden">
                    {[1, 2, 3, 4, 5].map(score => {
                      const count = qr.distribution[score] || 0;
                      const percentage = qr.response_count > 0 ? (count / qr.response_count) * 100 : 0;
                      // Color code based on score: red, orange, yellow, lime, green
                      const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500'];
                      return percentage > 0 ? (
                        <div 
                          key={score} 
                          style={{ width: `${percentage}%` }} 
                          className={`${colors[score-1]} h-full transition-all`}
                          title={`Score ${score}: ${count} responses`}
                        />
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {qr.question_type === 'open_text' && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-400">{qr.response_count} responses received. Analytics module required for NLP sentiment extraction.</p>
                </div>
              )}
            </GlassPanel>
          ))
        ) : (
          <GlassPanel className="p-8 text-center text-gray-500">
            No response data available for this survey yet.
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
