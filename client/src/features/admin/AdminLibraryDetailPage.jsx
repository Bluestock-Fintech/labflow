import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Layers, Phone, Mail, CheckCircle2, PauseCircle, XCircle, RotateCcw } from 'lucide-react';
import { useGetAdminLibraryQuery, useUpdateAdminLibraryStatusMutation } from '../../app/api';

const STATUS_STYLES = {
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
  CLOSED: 'bg-gray-100 text-gray-500 border-gray-200',
};

function StatusBadge({ status }) {
  return (
    <span className={`text-[11px] font-medium border rounded-full px-2 py-0.5 ${STATUS_STYLES[status] ?? ''}`}>
      {status}
    </span>
  );
}

export default function AdminLibraryDetailPage() {
  const { libraryId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetAdminLibraryQuery(libraryId);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateAdminLibraryStatusMutation();
  const library = data?.data;

  async function setStatus(status) {
    try {
      await updateStatus({ libraryId, status }).unwrap();
    } catch {
      // surfaced implicitly by query state; keep simple for now
    }
  }

  if (isLoading) return <p className="p-4 text-sm text-gray-500">Loading…</p>;
  if (!library) return <p className="p-4 text-sm text-gray-500">Library not found.</p>;

  const totalSeats = library.floors.reduce((sum, f) => sum + f.seat_count, 0);

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <button onClick={() => navigate('/admin/libraries')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Back to libraries
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-gray-900">{library.name}</h1>
          <StatusBadge status={library.status} />
        </div>
        <p className="text-sm text-gray-500 mt-0.5">
          {[library.address, library.area, library.city].filter(Boolean).join(', ') || 'No address set'}
        </p>
        <Link to={`/l/${library.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 font-mono hover:underline">
          /l/{library.slug} ↗
        </Link>

        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5 text-sm text-gray-600">
          <p className="font-medium text-gray-800">Owner</p>
          <p>{library.owner_name}</p>
          {library.owner_mobile && (
            <a href={`tel:${library.owner_mobile}`} className="flex items-center gap-1.5 text-gray-500">
              <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
              {library.owner_mobile}
            </a>
          )}
          {library.owner_email && (
            <a href={`mailto:${library.owner_email}`} className="flex items-center gap-1.5 text-gray-500">
              <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
              {library.owner_email}
            </a>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <h2 className="font-medium text-gray-900 mb-3">Actions</h2>
        <div className="flex flex-wrap gap-2">
          {library.status !== 'PUBLISHED' && (
            <button
              onClick={() => setStatus('PUBLISHED')}
              disabled={isUpdating}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium px-3 py-2 hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
              Approve &amp; Publish
            </button>
          )}
          {library.status !== 'SUSPENDED' && (
            <button
              onClick={() => setStatus('SUSPENDED')}
              disabled={isUpdating}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 text-amber-700 text-sm font-medium px-3 py-2 hover:bg-amber-50 disabled:opacity-50"
            >
              <PauseCircle className="w-4 h-4" strokeWidth={1.75} />
              Suspend
            </button>
          )}
          {library.status !== 'CLOSED' && (
            <button
              onClick={() => setStatus('CLOSED')}
              disabled={isUpdating}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" strokeWidth={1.75} />
              Close
            </button>
          )}
          {library.status !== 'DRAFT' && (
            <button
              onClick={() => setStatus('DRAFT')}
              disabled={isUpdating}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
              Revert to Draft
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-2xl font-semibold text-gray-900">{library.floors.length}</p>
          <p className="text-sm text-gray-500">Floors</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-2xl font-semibold text-gray-900">{totalSeats}</p>
          <p className="text-sm text-gray-500">Total seats</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <h2 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
          Floors
        </h2>
        {library.floors.length === 0 ? (
          <p className="text-sm text-gray-500">No floors added yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {library.floors.map((floor) => (
              <div key={floor.id} className="py-2.5 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-800">{floor.floor_name}</p>
                  <p className="text-xs text-gray-500">
                    ₹{Number(floor.full_time_price).toFixed(0)} full-time · ₹{Number(floor.half_time_price).toFixed(0)} half-time
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-700">{floor.seat_count} seats</p>
                  <p className="text-[11px] text-gray-400">{floor.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
