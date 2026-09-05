import { Users } from 'lucide-react';
import { useGetAdminCustomersQuery } from '../../app/api';

export default function AdminCustomersPage() {
  const { data, isLoading } = useGetAdminCustomersQuery();
  const customers = data?.data ?? [];

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div>
        <p className="text-sm text-gray-500">Admin</p>
        <h1 className="text-xl font-semibold text-gray-900">Customers</h1>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
          <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-sm text-gray-500">No customers registered yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {customers.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                <p className="text-xs text-gray-500 truncate">{c.email} · {c.mobile}</p>
              </div>
              <span className="text-[11px] text-gray-400 shrink-0">{c.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
