import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, MapPin, ChevronRight } from 'lucide-react';
import { useGetAdminLibrariesQuery } from '../../app/api';

const STATUS_STYLES = {
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
  CLOSED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const FILTERS = ['ALL', 'DRAFT', 'PUBLISHED', 'SUSPENDED', 'CLOSED'];

function StatusBadge({ status }) {
  return (
    <span className={`text-[11px] font-medium border rounded-full px-2 py-0.5 ${STATUS_STYLES[status] ?? ''}`}>
      {status}
    </span>
  );
}

export default function AdminLibrariesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get('status') ?? 'ALL';
  const { data, isLoading } = useGetAdminLibrariesQuery(activeFilter === 'ALL' ? undefined : activeFilter);
  const libraries = data?.data ?? [];

  function setFilter(status) {
    if (status === 'ALL') setSearchParams({});
    else setSearchParams({ status });
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div>
        <p className="text-sm text-gray-500">Admin</p>
        <h1 className="text-xl font-semibold text-gray-900">Libraries</h1>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border ${
              activeFilter === f ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-600'
            }`}
          >
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : libraries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
          <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-sm text-gray-500">No libraries found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {libraries.map((lib) => (
            <Link
              key={lib.id}
              to={`/admin/libraries/${lib.id}`}
              className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-gray-200 p-4 hover:border-indigo-300"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">{lib.name}</p>
                  <StatusBadge status={lib.status} />
                </div>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" strokeWidth={1.75} />
                  {[lib.area, lib.city].filter(Boolean).join(', ') || 'No address set'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {lib.floor_count} floor{lib.floor_count === 1 ? '' : 's'} · {lib.total_seats} seats · Owner: {lib.owner_name}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" strokeWidth={1.75} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
