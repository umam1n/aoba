'use client';

import React, { useState, useEffect } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, BarChart2, Calendar, Users, X, Trash2, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';
import type { PulseSurvey, SurveyQuestion, ApiResponse, SurveyResults, QuestionResult } from '@/lib/types';

interface QuestionForm {
  id: string;
  text: string;
  type: 'likert_5' | 'open_text';
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<PulseSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection state
  const [selectedSurvey, setSelectedSurvey] = useState<PulseSurvey | null>(null);
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('All Employees');
  const [closeDate, setCloseDate] = useState('');
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { id: 'q1', text: '', type: 'likert_5' }
  ]);

  const fetchSurveys = async () => {
    setLoading(true);
    const { data, error } = await api.get<ApiResponse<PulseSurvey[]>>('/surveys/');
    if (data) {
      setSurveys(data.results);
      if (data.results.length > 0 && !selectedSurvey) {
        handleSelectSurvey(data.results[0]);
      }
    } else {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const handleSelectSurvey = async (survey: PulseSurvey) => {
    setSelectedSurvey(survey);
    if (survey.status !== 'draft') {
      setResultsLoading(true);
      const { data, error } = await api.get<SurveyResults>(`/surveys/${survey.id}/results/`);
      if (data) {
        setResults(data);
        if (data.questions && data.questions.length > 0) {
          setSelectedQuestionId(data.questions[0].question_id);
        }
      } else {
        console.error(error);
        setResults(null);
      }
      setResultsLoading(false);
    } else {
      setResults(null);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { id: `q${Date.now()}`, text: '', type: 'likert_5' }]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleQuestionChange = (id: string, field: keyof QuestionForm, value: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleLaunchSurvey = async (isDraft = false) => {
    if (!title.trim()) {
      alert("Please enter a survey title.");
      return;
    }
    if (!closeDate && !isDraft) {
      alert("Please set a close date before launching.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create Survey
      const { data: survey, error } = await api.post<PulseSurvey>('/surveys/', {
        title,
        target_audience: audience,
        starts_at: new Date().toISOString(),
        ends_at: closeDate ? new Date(closeDate).toISOString() : new Date().toISOString(),
      });

      if (error || !survey) throw new Error(error?.message || "Failed to create survey");

      // 2. Add Questions
      const questionsPayload = questions.map((q, idx) => ({
        question_text: q.text,
        question_type: q.type,
        order: idx + 1
      }));
      
      const { error: qError } = await api.post(`/surveys/${survey.id}/add_questions/`, { questions: questionsPayload });
      if (qError) throw new Error(qError.message);

      // 3. Activate if not draft
      if (!isDraft) {
        const { error: aError } = await api.post(`/surveys/${survey.id}/activate/`, {});
        if (aError) throw new Error(aError.message);
      }

      // Refresh list
      await fetchSurveys();
      
      // Reset form
      setTitle('');
      setAudience('All Employees');
      setCloseDate('');
      setQuestions([{ id: 'q1', text: '', type: 'likert_5' }]);
      setShowCreateModal(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCloseSurvey = async (surveyId: string) => {
    const { error } = await api.post(`/surveys/${surveyId}/close/`, {});
    if (!error) {
       await fetchSurveys();
    }
  };

  // Prepare chart data
  const selectedQuestionData = results?.questions?.find(q => q.question_id === selectedQuestionId);
  const chartData = selectedQuestionData?.score_distribution ? [
    { name: 'Strongly Disagree (1)', count: selectedQuestionData.score_distribution['1'] || 0 },
    { name: 'Disagree (2)', count: selectedQuestionData.score_distribution['2'] || 0 },
    { name: 'Neutral (3)', count: selectedQuestionData.score_distribution['3'] || 0 },
    { name: 'Agree (4)', count: selectedQuestionData.score_distribution['4'] || 0 },
    { name: 'Strongly Agree (5)', count: selectedQuestionData.score_distribution['5'] || 0 },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Pulse Surveys</h1>
          <p className="text-gray-400 mt-1">Gather sentiment and engagement signals.</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" /> Create Survey
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          {loading ? (
             <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : surveys.length === 0 ? (
             <div className="text-gray-500 text-sm p-4 text-center">No surveys found. Create one to get started.</div>
          ) : surveys.map(survey => (
            <GlassPanel 
              key={survey.id} 
              className={`p-5 hover:bg-white/5 transition-colors cursor-pointer border ${selectedSurvey?.id === survey.id ? 'border-blue-500/50 bg-blue-500/5' : 'border-transparent hover:border-white/10'}`}
              onClick={() => handleSelectSurvey(survey)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-white">{survey.title}</h3>
                <Badge variant={survey.status === 'active' ? 'success' : survey.status === 'draft' ? 'default' : 'warning'}>
                  {survey.status.toUpperCase()}
                </Badge>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {survey.status !== 'draft' && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Responses</span>
                      <span>{survey.response_count || 0}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                     <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Closes: {new Date(survey.ends_at).toLocaleDateString()}</span>
                     <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {survey.target_audience || 'All'}</span>
                  </div>
                  {survey.status === 'active' && (
                    <button onClick={(e) => { e.stopPropagation(); handleCloseSurvey(survey.id); }} className="text-red-400 hover:text-red-300">Close Now</button>
                  )}
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>

        <GlassPanel className="lg:col-span-2 p-6 flex flex-col min-h-[400px]">
          {selectedSurvey ? (
            selectedSurvey.status === 'draft' ? (
               <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                  <BarChart2 className="w-12 h-12 mb-4 opacity-20" />
                  <p>This survey is currently a Draft.</p>
                  <p className="text-sm mt-1">Activate it to start collecting responses.</p>
                  <Button variant="outline" className="mt-4" onClick={() => handleLaunchSurvey(false)}>Activate Now</Button>
               </div>
            ) : resultsLoading ? (
               <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
               </div>
            ) : results ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-blue-400" />
                    Results: {selectedSurvey.title}
                  </h3>
                  <select 
                    value={selectedQuestionId}
                    onChange={(e) => setSelectedQuestionId(e.target.value)}
                    className="bg-white/5 border border-white/10 text-white text-sm rounded-md px-3 py-1.5 outline-none focus:border-blue-500 max-w-[250px] truncate"
                  >
                    {results.questions?.map((q, idx) => (
                       <option key={q.question_id} value={q.question_id}>Q{idx+1}: {q.question_text.substring(0,30)}...</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-6 flex gap-6 border-b border-white/10 pb-6">
                   <div className="flex flex-col">
                      <span className="text-xs text-gray-400 uppercase tracking-wider mb-1">Response Rate</span>
                      <span className="text-2xl font-bold text-white">{results.response_rate}%</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-xs text-gray-400 uppercase tracking-wider mb-1">Avg Score</span>
                      <span className="text-2xl font-bold text-emerald-400">{selectedQuestionData?.average_score?.toFixed(1) || '-'} / 5.0</span>
                   </div>
                </div>

                <p className="text-sm text-gray-300 mb-6 italic">"{selectedQuestionData?.question_text}"</p>
                
                {selectedQuestionData?.question_type === 'likert_5' ? (
                  <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                    <p>Open text responses cannot be visualized as a chart.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-red-400 text-sm">Failed to load results.</div>
            )
          ) : (
             <div className="flex-1 flex items-center justify-center text-gray-500">Select a survey to view results</div>
          )}
        </GlassPanel>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <GlassPanel className="w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-white mb-4">Create New Survey</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Survey Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-white focus:outline-none focus:border-blue-500 transition-colors" 
                  placeholder="e.g., Monthly Pulse" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Target Audience</label>
                  <select 
                    value={audience}
                    onChange={e => setAudience(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="All Employees">All Employees</option>
                    <option value="Engineering Only">Engineering Only</option>
                    <option value="Sales Only">Sales Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Close Date</label>
                  <input 
                    type="date" 
                    value={closeDate}
                    onChange={e => setCloseDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-white focus:outline-none focus:border-blue-500 transition-colors" 
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <h4 className="text-sm font-medium text-white mb-3">Questions</h4>
                
                {questions.map((q, index) => (
                  <div key={q.id} className="bg-white/5 border border-white/10 rounded-md p-4 mb-3 relative group">
                    {questions.length > 1 && (
                      <button 
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="absolute top-4 right-4 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <input 
                      type="text" 
                      value={q.text}
                      onChange={e => handleQuestionChange(q.id, 'text', e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 pb-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-3 pr-8" 
                      placeholder={`Question ${index + 1} text...`} 
                    />
                    <div className="flex gap-4">
                      <label className="flex items-center text-sm text-gray-400 gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name={`type-${q.id}`} 
                          checked={q.type === 'likert_5'}
                          onChange={() => handleQuestionChange(q.id, 'type', 'likert_5')}
                          className="bg-transparent" 
                        /> 
                        Likert Scale (1-5)
                      </label>
                      <label className="flex items-center text-sm text-gray-400 gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name={`type-${q.id}`} 
                          checked={q.type === 'open_text'}
                          onChange={() => handleQuestionChange(q.id, 'type', 'open_text')}
                          className="bg-transparent" 
                        /> 
                        Text Entry
                      </label>
                    </div>
                  </div>
                ))}

                <Button variant="outline" size="sm" className="w-full border-dashed" onClick={handleAddQuestion}>
                  <Plus className="w-4 h-4 mr-2" /> Add Question
                </Button>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)} disabled={isSubmitting}>Cancel</Button>
              <Button variant="outline" onClick={() => handleLaunchSurvey(true)} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save as Draft'}
              </Button>
              <Button variant="primary" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleLaunchSurvey(false)} disabled={isSubmitting}>
                 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Launch Survey
              </Button>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
