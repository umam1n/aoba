'use client';

import React, { useState } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmployeeDrawer } from '@/components/employees/EmployeeDrawer';
import { Search, Upload, Filter, Download, X, ChevronRight } from 'lucide-react';
import type { Employee } from '@/lib/types';

const mockEmployees: Employee[] = [
  { id: '1', company_id: 'c1', employee_code: 'EMP-001', full_name: 'Alice Smith', email: 'alice@aoba.inc', department: 'Engineering', division: 'Platform', role_title: 'Senior Engineer', role_level: 'L4', manager_id: '5', hire_date: '2022-03-01', employment_status: 'active', created_at: '2022-03-01', updated_at: '2026-06-01', tenure_months: 51 },
  { id: '2', company_id: 'c1', employee_code: 'EMP-002', full_name: 'Bob Johnson', email: 'bob@aoba.inc', department: 'Sales', division: 'Enterprise', role_title: 'Account Executive', role_level: 'L3', hire_date: '2023-06-15', employment_status: 'active', created_at: '2023-06-15', updated_at: '2026-06-01', tenure_months: 36 },
  { id: '3', company_id: 'c1', employee_code: 'EMP-003', full_name: 'Carol Williams', email: 'carol@aoba.inc', department: 'Marketing', role_title: 'Marketing Manager', role_level: 'L5', hire_date: '2020-11-01', employment_status: 'on_leave', created_at: '2020-11-01', updated_at: '2026-06-01', tenure_months: 67 },
  { id: '4', company_id: 'c1', employee_code: 'EMP-004', full_name: 'David Brown', email: 'david@aoba.inc', department: 'Engineering', division: 'Mobile', role_title: 'Staff Engineer', role_level: 'L5', hire_date: '2019-02-15', employment_status: 'active', created_at: '2019-02-15', updated_at: '2026-06-01', tenure_months: 88 },
  { id: '5', company_id: 'c1', employee_code: 'EMP-005', full_name: 'Eve Davis', email: 'eve@aoba.inc', department: 'Product', role_title: 'Senior PM', role_level: 'L4', hire_date: '2021-07-01', employment_status: 'active', created_at: '2021-07-01', updated_at: '2026-06-01', tenure_months: 59 },
];

const mockImports = [
  { id: 'imp-1', date: '2026-06-11 10:23', filename: 'q2_compensation.csv', status: 'completed' as const, rows_total: 412, rows_imported: 412, rows_skipped: 0, errors: [], file_hash: '', file_type: 'compensation_history' as const, company_id: 'c1', uploaded_at: '2026-06-11' },
  { id: 'imp-2', date: '2026-06-01 09:00', filename: 'new_hires_june.csv', status: 'completed' as const, rows_total: 15, rows_imported: 15, rows_skipped: 0, errors: [], file_hash: '', file_type: 'employees' as const, company_id: 'c1', uploaded_at: '2026-06-01' },
  { id: 'imp-3', date: '2026-05-15 14:45', filename: 'org_chart_update.csv', status: 'failed' as const, rows_total: 0, rows_imported: 0, rows_skipped: 0, errors: [{ row: 1, field: 'manager_id', message: 'Unknown manager' }], file_hash: '', file_type: 'employees' as const, company_id: 'c1', uploaded_at: '2026-05-15' },
];

const STATUS_LABELS: Record<Employee['employment_status'], string> = {
  active: 'Active',
  exited: 'Exited',
  on_leave: 'On Leave',
};

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const filtered = mockEmployees.filter(e =>
    e.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employee_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                {filtered.map((emp) => (
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
                    <td className="px-4 py-3">{emp.tenure_months}mo</td>
                    <td className="px-4 py-3">
                      <Badge variant={emp.employment_status === 'active' ? 'success' : emp.employment_status === 'on_leave' ? 'warning' : 'danger'}>
                        {STATUS_LABELS[emp.employment_status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-300 transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Import History</h3>
          <div className="space-y-4">
            {mockImports.map(imp => (
              <div key={imp.id} className="border-l-2 border-white/10 pl-3 py-1">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-white truncate w-32" title={imp.filename}>{imp.filename}</span>
                  <Badge variant={imp.status === 'completed' ? 'success' : 'danger'} className="text-[10px] px-1 py-0 capitalize">{imp.status}</Badge>
                </div>
                <div className="text-xs text-gray-500 mt-1">{imp.date} &bull; {imp.rows_total} rows</div>
              </div>
            ))}
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
              <select className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-white focus:outline-none focus:border-blue-500 text-sm">
                <option value="employees">Employees</option>
                <option value="compensation_history">Compensation History</option>
                <option value="role_history">Role History</option>
                <option value="leave_records">Leave Records</option>
              </select>
            </div>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer group">
              <div className="bg-white/10 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-sm text-white font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">CSV files only (max 10MB)</p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowImportModal(false)}>Cancel</Button>
              <Button variant="primary">Upload File</Button>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Employee Drawer */}
      <EmployeeDrawer employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
    </div>
  );
}
