import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { ModulePermission } from '../db/db_types';

export const AdminRbacPage: React.FC = () => {
  const [matrix, setMatrix] = useState<ModulePermission[]>([]);

  const fetchMatrix = () => {
    fetch('/api/admin/rbac')
      .then(res => res.json())
      .then(data => setMatrix(data.matrix || []));
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  const handleToggle = async (
    roleCode: string,
    moduleCode: string,
    field: 'can_view' | 'can_create' | 'can_edit' | 'can_delete',
    currentVal: boolean
  ) => {
    const newVal = !currentVal;
    await fetch('/api/admin/rbac/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleCode, moduleCode, field, value: newVal })
    });

    fetchMatrix();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 space-y-6">
      <div className="flex items-center gap-2">
        <Shield size={24} className="text-brand-500" />
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dynamic RBAC Access Matrix</h1>
          <p className="text-xs text-gray-500">Toggle live access rights per role and module</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-100">
            <tr>
              <th className="p-4 font-bold">Role</th>
              <th className="p-4 font-bold">Module</th>
              <th className="p-4 font-bold text-center">Can View</th>
              <th className="p-4 font-bold text-center">Can Create</th>
              <th className="p-4 font-bold text-center">Can Edit</th>
              <th className="p-4 font-bold text-center">Can Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {matrix.map(row => (
              <tr key={`${row.role_code}-${row.module_code}`} className="hover:bg-gray-50/50">
                <td className="p-4 font-bold text-gray-800">{row.role_code}</td>
                <td className="p-4 text-gray-600">{row.module_code}</td>
                {(['can_view', 'can_create', 'can_edit', 'can_delete'] as const).map(field => (
                  <td key={field} className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={Boolean(row[field])}
                      onChange={() => handleToggle(row.role_code, row.module_code, field, Boolean(row[field]))}
                      className="rounded text-brand-500 focus:ring-brand-500 cursor-pointer w-4 h-4"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};