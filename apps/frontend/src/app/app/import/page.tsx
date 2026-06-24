'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { UploadCloud, FileType, CheckCircle, AlertCircle, RefreshCw, Trash2, Clock } from 'lucide-react';
import { cn } from '@/components/ui/GlassPanel';
import { api } from '@/lib/api';

interface UploadTask {
  id: string;
  filename: string;
  type: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  rowsProcessed?: number;
  rowsError?: number;
  message?: string;
  ingestionLogId?: string;
}

interface IngestionLog {
  id: string;
  file_name: string;
  file_type: string;
  status: string;
  rows_total: number;
  rows_imported: number;
  rows_skipped: number;
  errors: any[];
  uploaded_at: string;
}

export default function ImportPage() {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [logs, setLogs] = useState<IngestionLog[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [importType, setImportType] = useState('employees');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLogs = async () => {
    const { data } = await api.get<{ results: IngestionLog[] }>('/analytics/ingestion-logs/');
    if (data && data.results) {
      setLogs(data.results.slice(0, 10)); // Top 10 most recent
    }
  };

  useEffect(() => {
    fetchLogs();
    // Poll for logs every 5 seconds if there are processing tasks
    const interval = setInterval(() => {
      fetchLogs();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    const taskId = `task-${Date.now()}`;
    const newTask: UploadTask = {
      id: taskId,
      filename: file.name,
      type: importType.charAt(0).toUpperCase() + importType.slice(1).replace('_', ' '),
      progress: 0,
      status: 'uploading'
    };

    setTasks(prev => [newTask, ...prev]);

    try {
      const { data, error } = await api.upload<any>('/employees/import/', file, { file_type: importType });

      if (error) {
        throw new Error(error.message || 'Import failed');
      }

      setTasks(prev => prev.map(t => t.id === taskId ? { 
        ...t, 
        progress: 100, 
        status: data.status === 'pending' ? 'processing' : 'completed', 
        rowsProcessed: data.imported || 0,
        rowsError: data.error_count || 0,
        message: data.message + (data.errors && data.errors.length > 0 ? ` (${data.errors[0].errors.join(', ')})` : ''),
        ingestionLogId: data.ingestion_log_id
      } : t));

      fetchLogs();
    } catch (e: any) {
      setTasks(prev => prev.map(t => t.id === taskId ? { 
        ...t, 
        status: 'error', 
        message: e.message 
      } : t));
    }
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
            <h3 className="text-lg font-semibold text-white mb-4">Active Session Uploads</h3>
            
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
                      <span>{task.rowsProcessed} rows imported {task.rowsError ? `(${task.rowsError} skipped)` : ''}</span>
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
                  No active session uploads
                </div>
              )}
            </div>
          </GlassPanel>
        </div>

        <div className="space-y-6">
          <GlassPanel className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex justify-between items-center">
              <span>Ingestion Logs</span>
              <Button variant="ghost" size="sm" onClick={fetchLogs}><RefreshCw className="w-4 h-4" /></Button>
            </h3>
            <div className="relative border-l border-white/10 ml-3 space-y-5 pb-2">
              {logs.length === 0 && (
                <p className="text-sm text-gray-500 pl-4">No import logs found.</p>
              )}
              {logs.map(log => (
                <div key={log.id} className="relative pl-6">
                  <div className={cn(
                    "absolute left-[-5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-[#0f172a]",
                    log.status === 'completed' ? (log.errors?.length ? 'bg-amber-400' : 'bg-emerald-400') : 
                    log.status === 'failed' ? 'bg-red-400' : 'bg-blue-400'
                  )} />
                  <p className="text-sm text-white font-medium">{log.file_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {log.status === 'completed' ? `Imported ${log.rows_imported} rows. Skipped ${log.rows_skipped}.` : log.status}
                  </p>
                  {log.errors && log.errors.length > 0 && (
                    <div className="text-[10px] mt-1 p-2 bg-red-500/10 rounded text-red-300 max-h-24 overflow-y-auto">
                      {log.errors.slice(0, 3).map((e, i) => (
                        <div key={i}>Row {e.row}: {e.errors.join(', ')}</div>
                      ))}
                      {log.errors.length > 3 && <div>...and {log.errors.length - 3} more.</div>}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(log.uploaded_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
