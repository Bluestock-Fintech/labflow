import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Armchair, ChevronDown, ChevronUp } from 'lucide-react';
import { useGetMyOrdersQuery } from '../../app/api';
import { SkeletonList } from '../../components/Skeleton';
import { daysLeft, expiryLabel, expiryStyle } from '../../utils/planStatus';

function EnrollmentCard({ group }) {
  const [showHistory, setShowHistory] = useState(false);
  const { latest, history } = group;
  const renewals = history.length - 1;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-medium text-gray-900">{latest.library_name}</p>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${expiryStyle(latest.end_date)}`}>
          {expiryLabel(latest.end_date)}
        </span>
      </div>
      <p className="text-xs text-gray-500">{latest.floor_name} · Seat {latest.seat_code}</p>
      <p className="text-xs text-gray-400 mt-1">
        Start date {new Date(latest.start_date).toLocaleDateString()} · End date {new Date(latest.end_date).toLocaleDateString()}
      </p>
      {renewals > 0 && (
        <p className="text-xs text-indigo-600 mt-1">Renewed {renewals} time{renewals === 1 ? '' : 's'}</p>
      )}

      <div className="flex gap-2 mt-3">
        <Link
          to={`/l/${latest.library_slug}`}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 text-indigo-700 text-xs font-medium py-2 hover:bg-indigo-50"
        >
          <Armchair className="w-3.5 h-3.5" strokeWidth={1.75} />
          View Seat Map
        </Link>
        {history.length > 1 && (
          <button
            onClick={() => setShowHistory((s) => !s)}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium py-2 hover:bg-gray-50"
          >
            History
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.75} /> : <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.75} />}
          </button>
        )}
      </div>

      {showHistory && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          {history.map((o) => (
            <div key={o.id} className="flex items-center justify-between text-xs">
              <span className="text-gray-600">
                {new Date(o.start_date).toLocaleDateString()} – {new Date(o.end_date).toLocaleDateString()} · {o.duration_label}
              </span>
              <span className="text-gray-400">₹{Number(o.amount).toFixed(0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EnrolledPage() {
  const { data, isLoading } = useGetMyOrdersQuery();
  const orders = data?.data ?? [];

  const groups = useMemo(() => {
    const bySeat = new Map();
    for (const o of orders) {
      if (o.status !== 'CONFIRMED' && o.status !== 'CANCELLED') continue;
      if (!bySeat.has(o.seat_id)) bySeat.set(o.seat_id, []);
      bySeat.get(o.seat_id).push(o);
    }
    const result = [];
    for (const list of bySeat.values()) {
      list.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
      const latest = list[list.length - 1];
      if (latest.status === 'CONFIRMED') {
        result.push({ latest, history: list.filter((o) => o.status === 'CONFIRMED') });
      }
    }
    return result.sort((a, b) => daysLeft(a.latest.end_date) - daysLeft(b.latest.end_date));
  }, [orders]);

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Enrolled</h1>
        <p className="text-sm text-gray-500">Libraries you're currently booked into.</p>
      </div>

      {isLoading ? (
        <SkeletonList count={2} lines={2} />
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-8 text-center">
          <p className="text-sm text-gray-500">You're not enrolled anywhere yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <EnrollmentCard key={g.latest.seat_id} group={g} />
          ))}
        </div>
      )}
    </div>
  );
}
