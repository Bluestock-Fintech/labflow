import { useState } from 'react';
import {
  useGetFloorsQuery,
  useGetOrdersQuery,
  useApproveOrderMutation,
  useRejectOrderMutation,
  useMarkOrderPaidMutation,
} from '../../app/api';
import { useOwnerLibrary } from '../libraries/useOwnerLibrary';
import { SkeletonList } from '../../components/Skeleton';
import BottomSheetModal from '../../components/BottomSheetModal';
import NewOrderForm from './NewOrderForm';
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

function StatusBadge({ status }) {
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function OrdersPage() {
  const { library, isLoading: libraryLoading } = useOwnerLibrary();
  const { data: floorsData } = useGetFloorsQuery(library?.id, { skip: !library });
  const { data: ordersData, isLoading } = useGetOrdersQuery(library?.id, { skip: !library });
  const [approveOrder] = useApproveOrderMutation();
  const [rejectOrder] = useRejectOrderMutation();
  const [markOrderPaid, { isLoading: isMarkingPaid }] = useMarkOrderPaidMutation();
  const [showForm, setShowForm] = useState(false);

  const floors = floorsData?.data ?? [];
  const orders = ordersData?.data ?? [];
  const { page, pageSize, total, paged: pagedOrders, setPage, setPageSize } = usePagination(orders);

  if (libraryLoading) return <SkeletonList count={3} lines={2} />;

  if (!library) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-600">You don't have a library yet. Register one first.</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Orders</h1>
        <p className="text-sm text-gray-500">Manual bookings and customer requests awaiting approval.</p>
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700"
      >
        + New Order
      </button>

      {showForm && (
        <BottomSheetModal title="New Order" onClose={() => setShowForm(false)}>
          <NewOrderForm library={library} floors={floors} onClose={() => setShowForm(false)} bare />
        </BottomSheetModal>
      )}

      {isLoading ? (
        <SkeletonList count={3} lines={2} />
      ) : orders.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {pagedOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-1 gap-2">
                <p className="font-medium text-gray-900">{order.customer_name}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    order.source === 'OWNER' ? 'bg-indigo-100 text-indigo-700' : 'bg-sky-100 text-sky-700'
                  }`}>
                    {order.source === 'OWNER' ? 'Booked by Admin' : 'Booked by Customer'}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                {order.floor_name} · Seat {order.seat_code} · {order.customer_mobile}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                <span>
                  {order.seat_type === 'HALF_TIME' ? 'Half Day' : 'Full Day'} · {order.duration_label} · {new Date(order.start_date).toLocaleDateString()} – {new Date(order.end_date).toLocaleDateString()}
                </span>
                <span>₹{Number(order.amount).toFixed(0)}</span>
                <span className={order.payment_status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}>
                  {order.payment_method} · {order.payment_status}
                </span>
              </div>

              {order.status === 'PENDING_APPROVAL' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => rejectOrder({ libraryId: library.id, orderId: order.id })}
                    className="flex-1 rounded-lg border border-red-200 text-red-600 text-sm font-medium py-2 hover:bg-red-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => approveOrder({ libraryId: library.id, orderId: order.id })}
                    className="flex-1 rounded-lg bg-emerald-600 text-white text-sm font-medium py-2 hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                </div>
              )}

              {order.status === 'CONFIRMED' && order.payment_status === 'PENDING' && (
                <button
                  onClick={() => markOrderPaid({ libraryId: library.id, orderId: order.id })}
                  disabled={isMarkingPaid}
                  className="w-full mt-3 rounded-lg border border-emerald-200 text-emerald-700 text-sm font-medium py-2 hover:bg-emerald-50 disabled:opacity-50"
                >
                  Mark as Paid
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
