'use client';

import React, { useState, useRef } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { UploadCloud, FileType, CheckCircle, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '@/components/ui/GlassPanel';

interface UploadTask {
  id: string;
  filename: string;
  type: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  rowsProcessed?: number;
  rowsError?: number;
  message?: string;
}

const mockHistory: UploadTask[] = [
  { id: '1', filename: 'employees_q2.csv', type: 'Employees', progress: 100, status: 'completed', rowsProcessed: 412, rowsError: 0, message: 'Import successful' },
  { id: '2', filename: 'comp_history_2026.csv', type: 'Compensation', progress: 100, status: 'completed', rowsProcessed: 1250, rowsError: 2, message: 'Completed with warnings' },
  { id: '3', filename: 'leave_records_may.csv', type: 'Leave Records', progress: 45, status: 'error', rowsProcessed: 0, rowsError: 85, message: 'Invalid column headers' }
];

export default function ImportPage() {
  const [tasks, setTasks] = useState<UploadTask[]>(mockHistory);
  const [isDragging, setIsDragging] = useState(false);
  const [importType, setImportType] = useState('employees');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    const newTask: UploadTask = {
      id: `task-${Date.now()}`,
      filename: file.name,
      type: importType.charAt(0).toUpperCase() + importType.slice(1).replace('_', ' '),
      progress: 0,
      status: 'uploading'
    };

    setTasks(prev => [newTask, ...prev]);

    // Simulate progress
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 20;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        
        // Transition to processing, then to completed
        setTasks(prev => prev.map(t => t.id === newTask.id ? { ...t, progress: 100, status: 'processing' } : t));
        
        setTimeout(() => {
          setTasks(prev => prev.map(t => t.id === newTask.id ? { 
            ...t, 
            status: 'completed', 
            rowsProcessed: Math.floor(Math.random() * 500) + 50,
            rowsError: 0,
            message: 'Import successful'
          } : t));
        }, 1500);
      } else {
        setTasks(prev => prev.map(t => t.id === newTask.id ? { ...t, progress: currentProgress } : t));
      }
    }, 400);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Data Import</h1>
        <p className="text-gray-400 mt-1">Upload CSV files to update employee records, compensation, and risk factors.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlassPanel className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Upload New Data</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Import Type</label>
              <select 
                value={importType}
                onChange={e => setImportType(e.target.value)}
                className="w-full sm:w-1/2 bg-white/5 border border-white/10 rounded-md py-2 px-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="employees">Employee Roster</option>
                <option value="compensation_history">Compensation History</option>
                <option value="role_history">Role & Promotion History</option>
                <option value="leave_records">Leave Records</option>
              </select>
            </div>

            <div 
              className={cn(
                "border-2 border-dashed rounded-lg p-10 text-center transition-all cursor-pointer relative",
                isDragging ? "border-blue-500 bg-blue-500/10" : "border-white/20 hover:border-white/40 hover:bg-white/5"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv" 
                onChange={handleFileSelect}
              />
              <UploadCloud className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h4 className="text-white font-medium text-lg mb-1">Click or drag file to this area to upload</h4>
              <p className="text-gray-400 text-sm">Strictly CSV format. Maximum file size 50MB.</p>
            </div>
            
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-md flex items-start gap-3">
              <FileType className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-300 font-medium m-0">Expected CSV Format</p>
                <p className="text-xs text-blue-300/80 m-0 mt-1">Ensure your CSV includes the required columns for this import type. <a href="#" className="underline">Download template</a></p>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Active & Recent Imports</h3>
            
            <div className="space-y-4">
              {tasks.map(task => (
                <div key={task.id} className="p-4 rounded-md bg-white/5 border border-white/10 relative group">
                  <button onClick={() => removeTask(task.id)} className="absolute top-4 right-4 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-3 mb-2">
                    {task.status === 'completed' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                    {task.status === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                    {(task.status === 'uploading' || task.status === 'processing') && <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />}
                    
                    <span className="font-medium text-white">{task.filename}</span>
                    <Badge variant={task.status === 'completed' ? 'success' : task.status === 'error' ? 'danger' : 'default'} className="ml-auto mr-6">
                      {task.status === 'uploading' ? 'Uploading...' : task.status === 'processing' ? 'Processing...' : task.status}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-400 mb-1 ml-8">
                    <span>{task.type}</span>
                    {task.status === 'completed' || task.status === 'error' ? (
                      <span>{task.rowsProcessed} rows processed {task.rowsError ? `(${task.rowsError} errors)` : ''}</span>
                    ) : (
                      <span>{Math.round(task.progress)}%</span>
                    )}
                  </div>
                  
                  {(task.status === 'uploading' || task.status === 'processing') && (
                    <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden ml-8 max-w-[calc(100%-2rem)] mt-2">
                      <div className={cn("h-full transition-all duration-300", task.status === 'processing' ? "bg-amber-500" : "bg-blue-500")} style={{ width: `${task.progress}%` }} />
                    </div>
                  )}
                  
                  {task.message && (
                    <p className={cn("text-xs mt-2 ml-8", task.status === 'error' ? "text-red-400" : "text-gray-500")}>
                      {task.message}
                    </p>
                  )}
                </div>
              ))}
              
              {tasks.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-white/10 rounded-md">
                  No recent imports
                </div>
              )}
            </div>
          </GlassPanel>
        </div>

        <div className="space-y-6">
          <GlassPanel className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Ingestion Logs</h3>
            <div className="relative border-l border-white/10 ml-3 space-y-5 pb-2">
              <div className="relative pl-6">
                <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-[#0f172a]" />
                <p className="text-sm text-white">System sync completed</p>
                <p className="text-[10px] text-gray-500 mt-1">2 hours ago</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-[#0f172a]" />
                <p className="text-sm text-white">employees_q2.csv imported</p>
                <p className="text-xs text-gray-400 mt-0.5">Admin User imported 412 rows</p>
                <p className="text-[10px] text-gray-500 mt-1">Yesterday at 14:30</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-blue-400 ring-4 ring-[#0f172a]" />
                <p className="text-sm text-white">XGBoost recalculation triggered</p>
                <p className="text-xs text-gray-400 mt-0.5">32 risk scores updated</p>
                <p className="text-[10px] text-gray-500 mt-1">Yesterday at 14:35</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-red-400 ring-4 ring-[#0f172a]" />
                <p className="text-sm text-white">Import failed</p>
                <p className="text-xs text-gray-400 mt-0.5">leave_records_may.csv rejected</p>
                <p className="text-[10px] text-gray-500 mt-1">May 28 at 09:15</p>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
