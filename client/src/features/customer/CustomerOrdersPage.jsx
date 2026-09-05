import { useGetMyOrdersQuery } from '../../app/api';
import { SkeletonList } from '../../components/Skeleton';
import Pagination from '../../components/Pagination';
import { usePagination } from '../../hooks/usePagination';

const STATUS_STYLES = {
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS = {
  PENDING_APPROVAL: 'Pending Approval',
  CONFIRMED: 'Confirmed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

export default function CustomerOrdersPage() {
  const { data, isLoading } = useGetMyOrdersQuery();
  const orders = data?.data ?? [];
  const { page, pageSize, total, paged, setPage, setPageSize } = usePagination(orders);

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Orders</h1>
        <p className="text-sm text-gray-500">Your full booking history across every library.</p>
      </div>

      {isLoading ? (
        <SkeletonList count={3} lines={2} />
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-8 text-center">
          <p className="text-sm text-gray-500">No orders yet.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paged.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-gray-900">{o.library_name}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[o.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{o.floor_name} · Seat {o.seat_code}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                  <span>{new Date(o.start_date).toLocaleDateString()} – {new Date(o.end_date).toLocaleDateString()}</span>
                  <span>{o.duration_label}</span>
                  <span>₹{Number(o.amount).toFixed(0)}</span>
                  <span className={o.payment_status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}>
                    {o.payment_method} · {o.payment_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </>
      )}
    </div>
  );
}
