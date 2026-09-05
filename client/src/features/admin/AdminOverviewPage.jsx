import { Link } from 'react-router-dom';
import { Building2, Armchair, Layers, Users, UserCog, Clock } from 'lucide-react';
import { useGetAdminOverviewQuery } from '../../app/api';

function StatCard({ icon: Icon, label, value, accent = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-2">
        <Icon className="w-4 h-4" strokeWidth={1.75} />
        <p className="text-xs">{label}</p>
      </div>
      <p className={`text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

export default function AdminOverviewPage() {
  const { data, isLoading } = useGetAdminOverviewQuery();
  const overview = data?.data;

  if (isLoading) return <p className="p-4 text-sm text-gray-500">Loading…</p>;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div>
        <p className="text-sm text-gray-500">Platform overview</p>
        <h1 className="text-xl font-semibold text-gray-900">Super Admin</h1>
      </div>

      {overview?.pendingApproval > 0 && (
        <Link
          to="/admin/libraries?status=DRAFT"
          className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl p-4 hover:bg-amber-100"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-medium text-amber-800">{overview.pendingApproval} librar{overview.pendingApproval === 1 ? 'y' : 'ies'} awaiting approval</p>
              <p className="text-xs text-amber-700">Review and publish new libraries</p>
            </div>
          </div>
          <span className="text-xs font-medium text-amber-700">Review →</span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Building2} label="Total libraries" value={overview?.totalLibraries ?? 0} />
        <StatCard icon={Layers} label="Total floors" value={overview?.totalFloors ?? 0} />
        <StatCard icon={Armchair} label="Total seats" value={overview?.totalSeats ?? 0} />
        <StatCard icon={Users} label="Customers" value={overview?.totalCustomers ?? 0} />
        <StatCard icon={UserCog} label="Library owners" value={overview?.totalOwners ?? 0} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <h2 className="font-medium text-gray-900 mb-3">Libraries by status</h2>
        <div className="space-y-2">
          {overview &&
            Object.entries(overview.librariesByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{status}</span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
        </div>
      </div>

      <Link to="/admin/libraries" className="block bg-white rounded-2xl border border-gray-200 p-4 hover:border-indigo-300">
        <p className="font-medium text-gray-900">Manage Libraries</p>
        <p className="text-sm text-gray-500">Approve, suspend or review every library on the platform</p>
      </Link>
      <Link to="/admin/customers" className="block bg-white rounded-2xl border border-gray-200 p-4 hover:border-indigo-300">
        <p className="font-medium text-gray-900">Customers</p>
        <p className="text-sm text-gray-500">All registered customers across libraries</p>
      </Link>
    </div>
  );
}
