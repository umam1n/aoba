'use client';

import React, { useState } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, BarChart2, Calendar, Users, X, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Question {
  id: string;
  text: string;
  type: 'likert' | 'text';
}

interface Survey {
  id: string;
  title: string;
  status: 'Active' | 'Closed' | 'Draft';
  responses: number;
  total: number;
  closes: string;
}

const initialMockSurveys: Survey[] = [
  { id: '1', title: 'Q2 Manager Effectiveness', status: 'Active', responses: 245, total: 310, closes: '2026-06-20' },
  { id: '2', title: 'Return to Office Pulse', status: 'Closed', responses: 390, total: 412, closes: '2026-05-15' },
  { id: '3', title: 'Benefits Satisfaction 2026', status: 'Draft', responses: 0, total: 0, closes: '-' },
];

const mockResults = [
  { name: 'Strongly Agree', count: 120 },
  { name: 'Agree', count: 85 },
  { name: 'Neutral', count: 25 },
  { name: 'Disagree', count: 10 },
  { name: 'Strongly Disagree', count: 5 },
];

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>(initialMockSurveys);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('All Employees');
  const [closeDate, setCloseDate] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { id: 'q1', text: '', type: 'likert' }
  ]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { id: `q${Date.now()}`, text: '', type: 'likert' }]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleQuestionChange = (id: string, field: keyof Question, value: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleLaunchSurvey = (isDraft = false) => {
    if (!title.trim()) {
      alert("Please enter a survey title.");
      return;
    }

    const newSurvey: Survey = {
      id: `s${Date.now()}`,
      title,
      status: isDraft ? 'Draft' : 'Active',
      responses: 0,
      total: audience === 'All Employees' ? 412 : 150, // Mock sizes
      closes: closeDate || '-',
    };

    setSurveys([newSurvey, ...surveys]);
    
    // Reset form
    setTitle('');
    setAudience('All Employees');
    setCloseDate('');
    setQuestions([{ id: 'q1', text: '', type: 'likert' }]);
    setShowCreateModal(false);
  };

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
          {surveys.map(survey => (
            <GlassPanel key={survey.id} className="p-5 hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-white">{survey.title}</h3>
                <Badge variant={survey.status === 'Active' ? 'success' : survey.status === 'Draft' ? 'default' : 'warning'}>
                  {survey.status}
                </Badge>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {survey.total > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Response Rate</span>
                      <span>{Math.round((survey.responses / survey.total) * 100)}% ({survey.responses}/{survey.total})</span>
                    </div>
                    <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full" style={{ width: `${(survey.responses / survey.total) * 100}%` }} />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Closes: {survey.closes}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Dept: All</span>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>

        <GlassPanel className="lg:col-span-2 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-400" />
              Aggregated Results: Q2 Manager Effectiveness
            </h3>
            <select className="bg-white/5 border border-white/10 text-white text-sm rounded-md px-3 py-1.5 outline-none focus:border-blue-500">
              <option>Question 1: Support</option>
              <option>Question 2: Communication</option>
              <option>Question 3: Feedback</option>
            </select>
          </div>
          <p className="text-sm text-gray-300 mb-6">"My manager provides me with the support I need to succeed in my role."</p>
          
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockResults} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
                    <option>All Employees</option>
                    <option>Engineering Only</option>
                    <option>Sales Only</option>
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
                          checked={q.type === 'likert'}
                          onChange={() => handleQuestionChange(q.id, 'type', 'likert')}
                          className="bg-transparent" 
                        /> 
                        Likert Scale (1-5)
                      </label>
                      <label className="flex items-center text-sm text-gray-400 gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name={`type-${q.id}`} 
                          checked={q.type === 'text'}
                          onChange={() => handleQuestionChange(q.id, 'type', 'text')}
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
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button variant="outline" onClick={() => handleLaunchSurvey(true)}>Save as Draft</Button>
              <Button variant="primary" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleLaunchSurvey(false)}>Launch Survey</Button>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
