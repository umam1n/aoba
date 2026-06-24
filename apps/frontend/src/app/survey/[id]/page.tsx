'use client';

import React, { useState, useEffect } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import type { PulseSurvey, SurveyQuestion } from '@/lib/types';

interface SurveyDetail extends PulseSurvey {
  questions?: SurveyQuestion[];
}

export default function PublicSurveyPage({ params }: { params: { id: string } }) {
  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // To simulate anonymous/authenticated employee for demo
  const [employeeCode, setEmployeeCode] = useState('EMP001');
  const [isStarted, setIsStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const [responses, setResponses] = useState<Record<string, { value?: number, text?: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    async function loadSurvey() {
      setLoading(true);
      // In a real app we might need a public endpoint or we pass a token. 
      // For now we assume the frontend is using a demo token from localStorage or similar.
      try {
        const { data, error } = await api.get<SurveyDetail>(`/surveys/${params.id}/public/`);
        if (error) {
          setError('Survey not found or you do not have access.');
        } else if (data) {
          if (data.status !== 'active') {
             setError('This survey is currently closed.');
          } else {
             setSurvey(data);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load survey.');
      } finally {
        setLoading(false);
      }
    }
    loadSurvey();
  }, [params.id]);

  const handleResponseChange = (questionId: string, val: number | string) => {
    setResponses(prev => {
       const prevObj = prev[questionId] || {};
       if (typeof val === 'number') {
         return { ...prev, [questionId]: { ...prevObj, value: val } };
       } else {
         return { ...prev, [questionId]: { ...prevObj, text: val } };
       }
    });
  };

  const handleNext = () => {
    if (survey?.questions && currentStep < survey.questions.length - 1) {
      setCurrentStep(c => c + 1);
    }
  };

  const handleSubmit = async () => {
    if (!survey?.questions) return;
    setSubmitting(true);
    try {
      // Assuming a bulk submit endpoint or loop over questions
      const payload = {
         employee_code: employeeCode,
         responses: Object.keys(responses).map(qid => ({
            question_id: qid,
            response_value: responses[qid].value,
            response_text: responses[qid].text
         }))
      };
      
      const { error } = await api.post(`/surveys/${survey.id}/submit/`, payload);
      
      if (error) {
         alert('Error submitting survey: ' + error.message);
      } else {
         setIsDone(true);
      }
    } catch (err: any) {
       alert(err.message);
    } finally {
       setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
         <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !survey) {
     return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-center">
         <GlassPanel className="p-8 max-w-md w-full">
            <p className="text-red-400 font-medium mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.href = '/'}>Return Home</Button>
         </GlassPanel>
      </div>
     );
  }

  if (isDone) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-center">
         <GlassPanel className="p-10 max-w-md w-full flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-emerald-400 mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
            <p className="text-gray-400 mb-8">Your responses have been recorded anonymously.</p>
            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/'}>Close Window</Button>
         </GlassPanel>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
         <GlassPanel className="p-8 max-w-md w-full">
            <div className="mb-8 text-center">
               <h1 className="text-2xl font-bold text-white mb-2">{survey.title}</h1>
               <p className="text-gray-400">{survey.description || 'Your feedback helps us improve our workplace.'}</p>
               <div className="mt-4 inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-blue-300">
                 Target: {survey.target_audience}
               </div>
            </div>
            
            <div className="mb-6">
               <label className="block text-sm font-medium text-gray-400 mb-2">Verify Employee Code</label>
               <input 
                 type="text" 
                 value={employeeCode}
                 onChange={e => setEmployeeCode(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-white focus:border-blue-500" 
                 placeholder="e.g. EMP123"
               />
               <p className="text-[10px] text-gray-500 mt-2">Required for demographic segmentation. Your direct responses remain anonymous to managers.</p>
            </div>
            
            <Button variant="primary" className="w-full h-12 text-lg" onClick={() => setIsStarted(true)}>
               Start Survey <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
         </GlassPanel>
      </div>
    );
  }

  const currentQ = survey.questions ? survey.questions[currentStep] : null;

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6">
       <div className="w-full max-w-xl">
         {/* Progress bar */}
         <div className="mb-8">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
               <span>Question {currentStep + 1} of {survey.questions?.length}</span>
               <span>{Math.round(((currentStep + 1) / (survey.questions?.length || 1)) * 100)}%</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-blue-500 transition-all duration-300" 
                 style={{ width: `${((currentStep + 1) / (survey.questions?.length || 1)) * 100}%` }}
               />
            </div>
         </div>
         
         {currentQ && (
           <GlassPanel className="p-8">
              <h3 className="text-xl font-medium text-white mb-8">{currentQ.question_text}</h3>
              
              {currentQ.question_type === 'likert_5' && (
                 <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
                    {[1, 2, 3, 4, 5].map(score => {
                       const labels = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
                       const isSelected = responses[currentQ.id]?.value === score;
                       return (
                         <button 
                           key={score}
                           onClick={() => handleResponseChange(currentQ.id, score)}
                           className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${isSelected ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-400'}`}
                         >
                            <span className="text-2xl font-bold mb-2">{score}</span>
                            <span className="text-[10px] uppercase tracking-wider text-center">{labels[score-1]}</span>
                         </button>
                       );
                    })}
                 </div>
              )}
              
              {currentQ.question_type === 'open_text' && (
                 <div className="mb-8">
                    <textarea 
                      value={responses[currentQ.id]?.text || ''}
                      onChange={e => handleResponseChange(currentQ.id, e.target.value)}
                      rows={5}
                      className="w-full bg-white/5 border border-white/10 rounded-md p-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                      placeholder="Share your thoughts..."
                    />
                 </div>
              )}
              
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                 <Button variant="ghost" onClick={() => setCurrentStep(c => Math.max(0, c - 1))} disabled={currentStep === 0}>
                    Previous
                 </Button>
                 
                 {currentStep < (survey.questions?.length || 1) - 1 ? (
                   <Button variant="primary" onClick={handleNext} disabled={!responses[currentQ.id]}>
                      Next <ArrowRight className="w-4 h-4 ml-2" />
                   </Button>
                 ) : (
                   <Button variant="primary" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmit} disabled={!responses[currentQ.id] || submitting}>
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Submit Survey
                   </Button>
                 )}
              </div>
           </GlassPanel>
         )}
       </div>
    </div>
  );
}
