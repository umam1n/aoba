'use client';

import React, { useState, useEffect } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmployeeDrawer } from '@/components/employees/EmployeeDrawer';
import { Search, Upload, Filter, Download, X, ChevronRight, Loader2 } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { api } from '@/lib/api';

const STATUS_LABELS: Record<Employee['employment_status'], string> = {
  active: 'Active',
  exited: 'Exited',
  on_leave: 'On Leave',
};

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [importType, setImportType] = useState('employees');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmployees() {
      setLoading(true);
      const { data, error } = await api.get<{ results: Employee[] }>('/employees/');
      if (data && data.results) {
        setEmployees(data.results);
      } else {
        console.error('Failed to fetch employees:', error);
      }
      setLoading(false);
    }
    fetchEmployees();
  }, []);

  const filtered = employees.filter(e =>
    e.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employee_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const { data, error } = await api.upload('/employees/import/', file, {
      file_type: importType
    });

    setIsUploading(false);

    if (error) {
      setUploadError(error.message);
    } else {
      setUploadSuccess('File uploaded successfully. Processing in background.');
      // Optional: Refresh employee list after a short delay
      setTimeout(() => {
        // Just trigger a re-render or refetch here if needed
        window.location.reload();
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Employee Directory</h1>
          <p className="text-gray-400 mt-1">Manage workforce data and history.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button variant="primary" className="flex items-center gap-2" onClick={() => setShowImportModal(true)}>
            <Upload className="w-4 h-4" /> Import CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <GlassPanel className="p-6 lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                className="w-full bg-white/5 border border-white/10 rounded-md py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-gray-400">
                <Filter className="w-4 h-4 mr-2" /> Filters
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Tenure</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading employees...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer group transition-colors"
                      onClick={() => setSelectedEmployee(emp)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/40 to-cyan-500/40 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {emp.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-white">{emp.full_name}</div>
                            <div className="text-xs text-gray-500">{emp.employee_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{emp.department}</div>
                        {emp.division && <div className="text-xs text-gray-500">{emp.division}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div>{emp.role_title}</div>
                        <div className="text-xs text-gray-500">{emp.role_level}</div>
                      </td>
                      <td className="px-4 py-3">{emp.tenure_months || '-'} mo</td>
                      <td className="px-4 py-3">
                        <Badge variant={emp.employment_status === 'active' ? 'success' : emp.employment_status === 'on_leave' ? 'warning' : 'danger'}>
                          {STATUS_LABELS[emp.employment_status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-300 transition-colors" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Import History</h3>
          <div className="space-y-4">
            <div className="text-sm text-gray-400">
              API integration pending for import logs.
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <GlassPanel className="w-full max-w-md p-6 relative">
            <button onClick={() => setShowImportModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-white mb-2">Import Data</h2>
            <p className="text-sm text-gray-400 mb-4">Upload CSV files to sync employee or compensation data.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-1">Data Type</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-white focus:outline-none focus:border-blue-500 text-sm"
                value={importType}
                onChange={(e) => setImportType(e.target.value)}
              >
                <option value="employees">Employees</option>
                <option value="compensation_history">Compensation History</option>
                <option value="role_history">Role History</option>
                <option value="leave_records">Leave Records</option>
              </select>
            </div>
            
            {uploadError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                {uploadError}
              </div>
            )}
            {uploadSuccess && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400">
                {uploadSuccess}
              </div>
            )}

            <div className="relative border-2 border-dashed border-white/20 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer group">
              <input 
                type="file" 
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="bg-white/10 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                {isUploading ? <Loader2 className="w-6 h-6 text-blue-400 animate-spin" /> : <Upload className="w-6 h-6 text-blue-400" />}
              </div>
              <p className="text-sm text-white font-medium">
                {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500 mt-1">CSV files only (max 10MB)</p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowImportModal(false)}>Close</Button>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Employee Drawer */}
      <EmployeeDrawer employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
    </div>
  );
}
