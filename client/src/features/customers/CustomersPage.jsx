import { useMemo, useState } from 'react';
import { Mail, MessageCircle, Phone, Send, X } from 'lucide-react';
import {
  useGetFloorsQuery,
  useGetOrdersQuery,
  useRenewOrderMutation,
  useCancelOrderMutation,
} from '../../app/api';
import { useOwnerLibrary } from '../libraries/useOwnerLibrary';
import { SkeletonList } from '../../components/Skeleton';
import NewOrderForm, { DURATION_PRESETS } from '../orders/NewOrderForm';
import Pagination from '../../components/Pagination';
import { usePagination } from '../../hooks/usePagination';

function daysLeft(endDate) {
  const ms = new Date(endDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

function planStatus(endDate) {
  const d = daysLeft(endDate);
  if (d < 0) return 'expired';
  if (d <= 7) return 'expiring';
  return 'active';
}

function ExpiryBadge({ endDate }) {
  const d = daysLeft(endDate);
  const status = planStatus(endDate);
  const styles = {
    expired: 'bg-red-100 text-red-700',
    expiring: 'bg-amber-100 text-amber-700',
    active: 'bg-emerald-100 text-emerald-700',
  };
  const label = d < 0 ? `Expired ${Math.abs(d)}d ago` : d === 0 ? 'Expires today' : `${d}d left`;
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[status]}`}>{label}</span>;
}

const CUSTOMER_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'expiring', label: 'Expiring Soon' },
  { id: 'expired', label: 'Expired' },
  { id: 'active', label: 'Enrolled' },
  { id: 'left', label: 'Left' },
];

function RenewForm({ library, customer, onClose }) {
  const [startDate, setStartDate] = useState(() => {
    const base = new Date(customer.end_date);
    const today = new Date();
    const start = base > today ? base : today;
    start.setDate(start.getDate() + (base > today ? 1 : 0));
    return start.toISOString().slice(0, 10);
  });
  const [durationLabel, setDurationLabel] = useState('1 Month');
  const [customDays, setCustomDays] = useState('30');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [renewOrder, { isLoading, error }] = useRenewOrderMutation();

  async function handleSubmit(e) {
    e.preventDefault();
    const durationDays = durationLabel === 'Custom' ? Number(customDays) || 0 : undefined;
    try {
      await renewOrder({
        libraryId: library.id,
        orderId: customer.id,
        start_date: startDate,
        duration_label: durationLabel,
        duration_days: durationDays ?? { '15 Days': 15, '1 Month': 30, '2 Months': 60, '3 Months': 90 }[durationLabel],
        payment_method: paymentMethod,
      }).unwrap();
      onClose();
    } catch {
      // error surfaced below
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-gray-100 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
          <select
            value={durationLabel}
            onChange={(e) => setDurationLabel(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm bg-white"
          >
            {DURATION_PRESETS.map((label) => (
              <option key={label} value={label}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      {durationLabel === 'Custom' && (
        <input
          type="number"
          min="1"
          value={customDays}
          onChange={(e) => setCustomDays(e.target.value)}
          placeholder="Number of days"
          className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm"
        />
      )}
      <div className="flex gap-2">
        {['CASH', 'ONLINE'].map((method) => (
          <button
            key={method}
            type="button"
            onClick={() => setPaymentMethod(method)}
            className={`flex-1 rounded-lg border py-1.5 text-xs font-medium ${
              paymentMethod === method ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-600'
            }`}
          >
            {method === 'CASH' ? 'Cash' : 'Online'}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-600">{error.data?.error?.message || 'Could not renew.'}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium py-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-lg bg-indigo-600 text-white text-xs font-medium py-2 disabled:opacity-50"
        >
          {isLoading ? 'Renewing…' : 'Confirm Renewal'}
        </button>
      </div>
    </form>
  );
}

function CustomerCard({ library, customer: c, floors }) {
  const [cancelOrder, { isLoading: isLeaving }] = useCancelOrderMutation();
  const [showRenew, setShowRenew] = useState(false);
  const [showRejoin, setShowRejoin] = useState(false);

  async function handleLeave() {
    if (!window.confirm(`Mark ${c.customer_name} as having left? Their seat will become available.`)) return;
    await cancelOrder({ libraryId: library.id, orderId: c.id }).unwrap().catch(() => {});
  }

  if (c.state === 'left') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-start justify-between mb-1 gap-2">
          <p className="font-medium text-gray-900">{c.customer_name}</p>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Left</span>
        </div>
        <p className="text-xs text-gray-500 mb-0.5">Last seat: {c.floor_name} · {c.seat_code}</p>
        <p className="text-xs text-gray-500">{c.customer_mobile}{c.customer_email ? ` · ${c.customer_email}` : ''}</p>

        {!showRejoin ? (
          <button
            onClick={() => setShowRejoin(true)}
            className="w-full mt-3 rounded-lg bg-indigo-600 text-white text-xs font-medium py-2 hover:bg-indigo-700"
          >
            Rejoin
          </button>
        ) : (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <NewOrderForm
              library={library}
              floors={floors}
              initial={{ customer_name: c.customer_name, customer_mobile: c.customer_mobile, customer_email: c.customer_email }}
              onClose={() => setShowRejoin(false)}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-1 gap-2">
        <p className="font-medium text-gray-900">{c.customer_name}</p>
        <ExpiryBadge endDate={c.end_date} />
      </div>
      <p className="text-xs text-gray-500 mb-0.5">{c.floor_name} · Seat {c.seat_code}</p>
      <p className="text-xs text-gray-500">{c.customer_mobile}{c.customer_email ? ` · ${c.customer_email}` : ''}</p>
      <p className="text-xs text-gray-400 mt-1">
        Enrolled {new Date(c.start_date).toLocaleDateString()} · until {new Date(c.end_date).toLocaleDateString()}
      </p>

      <div className="flex gap-2 mt-3">
        <a
          href={`https://wa.me/91${c.customer_mobile}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-green-200 text-green-700 text-xs font-medium py-2 hover:bg-green-50"
        >
          <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
          WhatsApp
        </a>
        <a
          href={`tel:${c.customer_mobile}`}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 text-indigo-700 text-xs font-medium py-2 hover:bg-indigo-50"
        >
          <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
          Call
        </a>
        <a
          href={c.customer_email ? `mailto:${c.customer_email}` : undefined}
          onClick={(e) => { if (!c.customer_email) e.preventDefault(); }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border text-xs font-medium py-2 ${
            c.customer_email
              ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
              : 'border-gray-200 text-gray-300 cursor-not-allowed'
          }`}
        >
          <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
          Email
        </a>
      </div>

      {!showRenew ? (
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleLeave}
            disabled={isLeaving}
            className="flex-1 rounded-lg border border-red-200 text-red-600 text-xs font-medium py-2 hover:bg-red-50 disabled:opacity-50"
          >
            {isLeaving ? 'Updating…' : 'Leave'}
          </button>
          <button
            onClick={() => setShowRenew(true)}
            className="flex-1 rounded-lg border border-indigo-200 text-indigo-700 text-xs font-medium py-2 hover:bg-indigo-50"
          >
            Renew
          </button>
        </div>
      ) : (
        <RenewForm library={library} customer={c} onClose={() => setShowRenew(false)} />
      )}
    </div>
  );
}

function BulkMailModal({ library, customers, onClose }) {
  const mailable = useMemo(
    () => customers.filter((c) => c.state !== 'left' && c.customer_email).sort((a, b) => daysLeft(a.end_date) - daysLeft(b.end_date)),
    [customers]
  );

  const [selected, setSelected] = useState(
    () => new Set(mailable.filter((c) => daysLeft(c.end_date) <= 7).map((c) => c.customer_mobile))
  );
  const [subject, setSubject] = useState(`Payment reminder — ${library.name}`);
  const [body, setBody] = useState(
    `Hi,\n\nThis is a friendly reminder that your seat subscription at ${library.name} is ending soon. Please renew your payment to keep your seat.\n\nThanks!`
  );

  function toggle(mobile) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(mobile)) next.delete(mobile);
      else next.add(mobile);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === mailable.length ? new Set() : new Set(mailable.map((c) => c.customer_mobile))));
  }

  function handleSend() {
    const bcc = mailable.filter((c) => selected.has(c.customer_mobile)).map((c) => c.customer_email).join(',');
    window.location.href = `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    onClose();
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-medium text-gray-900">Bulk Mail — Payment Reminder</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-700">
                Send to · {selected.size} of {mailable.length} selected
              </label>
              <button onClick={toggleAll} className="text-xs text-indigo-600 hover:underline">
                {selected.size === mailable.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-56 overflow-y-auto">
              {mailable.length === 0 ? (
                <p className="text-xs text-gray-500 px-3 py-3">No customers with an email on file.</p>
              ) : (
                mailable.map((c) => {
                  const d = daysLeft(c.end_date);
                  const label = d < 0 ? `Expired ${Math.abs(d)}d ago` : d === 0 ? 'Expires today' : `${d}d left`;
                  return (
                    <label key={c.customer_mobile} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selected.has(c.customer_mobile)}
                        onChange={() => toggle(c.customer_mobile)}
                        className="rounded border-gray-300"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{c.customer_name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{c.customer_email}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        d < 0 ? 'bg-red-100 text-red-700' : d <= 7 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {label}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium py-2.5">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={selected.size === 0}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" strokeWidth={1.75} />
            Send to {selected.size}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const { library, isLoading: libraryLoading } = useOwnerLibrary();
  const { data: floorsData } = useGetFloorsQuery(library?.id, { skip: !library });
  const { data: ordersData, isLoading } = useGetOrdersQuery(library?.id, { skip: !library });
  const [statusFilter, setStatusFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');
  const [showBulkMail, setShowBulkMail] = useState(false);

  const floors = floorsData?.data ?? [];
  const orders = ordersData?.data ?? [];

  const allCustomers = useMemo(() => {
    const byMobile = new Map();
    for (const o of orders) {
      if (o.status !== 'CONFIRMED' && o.status !== 'CANCELLED') continue;
      const existing = byMobile.get(o.customer_mobile);
      if (!existing) {
        byMobile.set(o.customer_mobile, { confirmed: null, cancelled: null });
      }
      const entry = byMobile.get(o.customer_mobile);
      if (o.status === 'CONFIRMED') {
        if (!entry.confirmed || new Date(o.created_at) > new Date(entry.confirmed.created_at)) entry.confirmed = o;
      } else if (o.status === 'CANCELLED') {
        if (!entry.cancelled || new Date(o.created_at) > new Date(entry.cancelled.created_at)) entry.cancelled = o;
      }
    }

    const result = [];
    for (const { confirmed, cancelled } of byMobile.values()) {
      if (confirmed && (!cancelled || new Date(confirmed.created_at) > new Date(cancelled.created_at))) {
        result.push({ ...confirmed, state: planStatus(confirmed.end_date) });
      } else if (cancelled) {
        result.push({ ...cancelled, state: 'left' });
      }
    }
    return result.sort((a, b) => {
      if (a.state === 'left') return 1;
      if (b.state === 'left') return -1;
      return daysLeft(a.end_date) - daysLeft(b.end_date);
    });
  }, [orders]);

  const floorNames = useMemo(
    () => [...new Set(allCustomers.map((c) => c.floor_name))],
    [allCustomers]
  );

  const customers = useMemo(() => {
    return allCustomers.filter((c) => {
      if (statusFilter !== 'all' && c.state !== statusFilter) return false;
      if (floorFilter !== 'all' && c.floor_name !== floorFilter) return false;
      return true;
    });
  }, [allCustomers, statusFilter, floorFilter]);

  const expiredCustomers = useMemo(
    () => allCustomers.filter((c) => c.state === 'expired' && c.customer_email),
    [allCustomers]
  );

  function notifyExpired() {
    const bcc = expiredCustomers.map((c) => c.customer_email).join(',');
    const subject = encodeURIComponent(`Your seat at ${library.name} has expired`);
    const body = encodeURIComponent(
      `Hi,\n\nYour seat booking at ${library.name} has expired. Please renew to continue using your seat.\n\nThanks!`
    );
    window.location.href = `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`;
  }

  const { page, pageSize, total, paged: pagedCustomers, setPage, setPageSize } = usePagination(customers);

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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Customers</h1>
        </div>
        <button
          onClick={() => setShowBulkMail(true)}
          className="shrink-0 flex items-center gap-1.5 rounded-lg border border-indigo-200 text-indigo-700 text-xs font-medium px-3 py-2 hover:bg-indigo-50"
        >
          <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
          Bulk Mail
        </button>
      </div>

      {isLoading ? (
        <SkeletonList count={3} lines={2} />
      ) : (
        <>
          {expiredCustomers.length > 0 && (
            <button
              onClick={notifyExpired}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 text-white text-sm font-medium py-2.5 hover:bg-red-700"
            >
              <Mail className="w-4 h-4" strokeWidth={1.75} />
              Notify {expiredCustomers.length} Expired-Plan Customer{expiredCustomers.length === 1 ? '' : 's'}
            </button>
          )}

          <div className="flex flex-wrap gap-2">
            <div className="flex flex-wrap rounded-lg bg-gray-100 p-1 gap-0.5">
              {CUSTOMER_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap ${
                    statusFilter === f.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {floorNames.length > 1 && (
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs bg-white"
              >
                <option value="all">All floors</option>
                {floorNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            )}
          </div>

          {customers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-8 text-center">
              <p className="text-sm text-gray-500">No customers match this filter.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {pagedCustomers.map((c) => (
                  <CustomerCard key={c.customer_mobile} library={library} customer={c} floors={floors} />
                ))}
              </div>
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </>
      )}

      {showBulkMail && (
        <BulkMailModal library={library} customers={allCustomers} onClose={() => setShowBulkMail(false)} />
      )}
    </div>
  );
}
