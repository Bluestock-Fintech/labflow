import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Share2, Check, Users, Wallet, Clock, CheckCircle2, CalendarDays } from 'lucide-react';
import { Skeleton, SkeletonCard } from '../../components/Skeleton';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useGetFloorsQuery, useGetOrdersQuery } from '../../app/api';
import { useOwnerLibrary } from '../libraries/useOwnerLibrary';

const SEAT_STATUS_COLORS = {
  Available: '#10b981',
  Occupied: '#f43f5e',
  Blocked: '#f59e0b',
};

export default function DashboardPage() {
  const user = useSelector((s) => s.auth.user);
  const { library, isLoading } = useOwnerLibrary();
  const { data: floorsData } = useGetFloorsQuery(library?.id, { skip: !library });
  const { data: ordersData } = useGetOrdersQuery(library?.id, { skip: !library });
  const floors = floorsData?.data ?? [];
  const orders = ordersData?.data ?? [];
  const totalSeats = floors.reduce((sum, f) => sum + f.total_seats, 0);
  const [copied, setCopied] = useState(false);

  const liveOrders = useMemo(
    () => orders.filter((o) => o.status !== 'REJECTED' && o.status !== 'CANCELLED'),
    [orders]
  );

  const DATE_FILTERS = [
    { id: 'thisMonth', label: 'This Month' },
    { id: 'prevMonth', label: 'Previous Month' },
    { id: 'last3Months', label: 'Last 3 Months' },
    { id: 'custom', label: 'Custom' },
  ];

  const todayStr = new Date().toISOString().slice(0, 10);
  const [dateFilter, setDateFilter] = useState('thisMonth');
  const [customStart, setCustomStart] = useState(todayStr);
  const [customEnd, setCustomEnd] = useState(todayStr);

  const dateRange = useMemo(() => {
    const now = new Date();
    if (dateFilter === 'thisMonth') {
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      };
    }
    if (dateFilter === 'prevMonth') {
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 1),
      };
    }
    if (dateFilter === 'last3Months') {
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      };
    }
    // custom
    const start = new Date(customStart);
    const end = new Date(customEnd);
    end.setDate(end.getDate() + 1); // inclusive of end date
    return { start, end };
  }, [dateFilter, customStart, customEnd]);

  const periodOrders = useMemo(
    () => liveOrders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= dateRange.start && d < dateRange.end;
    }),
    [liveOrders, dateRange]
  );

  const businessStats = useMemo(() => {
    const totalCustomers = new Set(periodOrders.map((o) => o.customer_mobile)).size;
    const pendingPayment = periodOrders
      .filter((o) => o.payment_status === 'PENDING')
      .reduce((sum, o) => sum + Number(o.amount), 0);
    const paidAmount = periodOrders
      .filter((o) => o.payment_status === 'PAID')
      .reduce((sum, o) => sum + Number(o.amount), 0);
    const totalRevenue = periodOrders.reduce((sum, o) => sum + Number(o.amount), 0);

    return {
      totalCustomers,
      periodCount: periodOrders.length,
      pendingPayment,
      paidAmount,
      totalRevenue,
    };
  }, [periodOrders]);

  function formatCurrency(n) {
    return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }

  function countByStatus(seats) {
    const counts = { Available: 0, Occupied: 0, Blocked: 0 };
    (seats ?? []).forEach((seat) => {
      if (seat.status === 'AVAILABLE') counts.Available += 1;
      else if (seat.status === 'BLOCKED') counts.Blocked += 1;
      else counts.Occupied += 1;
    });
    return counts;
  }

  const seatStatusData = useMemo(() => {
    const totals = { Available: 0, Occupied: 0, Blocked: 0 };
    floors.forEach((floor) => {
      const counts = countByStatus(floor.seats);
      totals.Available += counts.Available;
      totals.Occupied += counts.Occupied;
      totals.Blocked += counts.Blocked;
    });
    return Object.entries(totals)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [floors]);

  const floorSeatData = useMemo(
    () =>
      floors.map((f) => {
        const counts = countByStatus(f.seats);
        return { name: f.floor_name, total: f.total_seats, ...counts };
      }),
    [floors]
  );

  const floorPieData = useMemo(
    () =>
      floors.map((f) => {
        const counts = countByStatus(f.seats);
        return {
          id: f.id,
          name: f.floor_name,
          total: f.total_seats,
          available: counts.Available,
          data: Object.entries(counts)
            .filter(([, value]) => value > 0)
            .map(([name, value]) => ({ name, value })),
        };
      }),
    [floors]
  );

  async function handleShare() {
    if (!library) return;
    const url = `${window.location.origin}/l/${library.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: library.name, url });
      } catch {
        // user cancelled the share sheet
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — nothing more we can do
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-40" />
        </div>
        <SkeletonCard lines={2} />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
        <SkeletonCard lines={1} />
        <SkeletonCard lines={1} />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">Good day,</p>
          <h1 className="text-xl font-semibold text-gray-900">{user?.name}</h1>
        </div>
        {library && (
          <Link
            to="/dashboard/orders"
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium px-3 py-2 hover:bg-indigo-700 mt-1"
          >
            + Create Order
          </Link>
        )}
      </div>

      {!library ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">No library found on this account.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{library.status}</p>
            <h2 className="text-lg font-semibold text-gray-900">{library.name}</h2>
            <p className="text-sm text-gray-500">{[library.area, library.city].filter(Boolean).join(', ') || 'No address set'}</p>
            <div className="flex items-center gap-2 mt-2">
              <a
                href={`/l/${library.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 font-mono hover:underline"
              >
                /l/{library.slug} ↗
              </a>
              <button
                onClick={handleShare}
                className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-full px-2 py-0.5 hover:bg-gray-50"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" strokeWidth={2} />
                    Copied
                  </>
                ) : (
                  <>
                    <Share2 className="w-3 h-3" strokeWidth={1.75} />
                    Share
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <p className="font-medium text-gray-900">Business overview</p>
              <div className="flex flex-wrap rounded-lg bg-gray-100 p-1 gap-0.5">
                {DATE_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setDateFilter(f.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                      dateFilter === f.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="date"
                  value={customStart}
                  max={customEnd}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  max={todayStr}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs"
                />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mb-2">
                  <Users className="w-4 h-4 text-indigo-600" strokeWidth={1.75} />
                </div>
                <p className="text-xl font-semibold text-gray-900">{businessStats.totalCustomers}</p>
                <p className="text-xs text-gray-500">Customers</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center mb-2">
                  <CalendarDays className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                </div>
                <p className="text-xl font-semibold text-gray-900">{businessStats.periodCount}</p>
                <p className="text-xs text-gray-500">Bookings</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center mb-2">
                  <Clock className="w-4 h-4 text-amber-600" strokeWidth={1.75} />
                </div>
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(businessStats.pendingPayment)}</p>
                <p className="text-xs text-gray-500">Pending payment</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
                </div>
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(businessStats.paidAmount)}</p>
                <p className="text-xs text-gray-500">Payment paid</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 col-span-2 sm:col-span-1">
                <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center mb-2">
                  <Wallet className="w-4 h-4 text-violet-600" strokeWidth={1.75} />
                </div>
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(businessStats.totalRevenue)}</p>
                <p className="text-xs text-gray-500">Total revenue</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-2xl font-semibold text-gray-900">{floors.length}</p>
              <p className="text-sm text-gray-500">Floors</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-2xl font-semibold text-gray-900">{totalSeats}</p>
              <p className="text-sm text-gray-500">Total seats</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-2xl font-semibold text-emerald-600">
                {floorSeatData.reduce((sum, f) => sum + f.Available, 0)}
              </p>
              <p className="text-sm text-gray-500">Available</p>
            </div>
          </div>

          {floors.length > 0 && (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <p className="font-medium text-gray-900 px-4 pt-4 pb-2">Seats by floor</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wide border-t border-gray-100">
                      <th className="px-4 py-2 font-medium">Floor</th>
                      <th className="px-4 py-2 font-medium text-right">Total</th>
                      <th className="px-4 py-2 font-medium text-right">Available</th>
                      <th className="px-4 py-2 font-medium text-right">Occupied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {floorSeatData.map((f) => (
                      <tr key={f.name} className="border-t border-gray-100">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{f.name}</td>
                        <td className="px-4 py-2.5 text-right text-gray-700">{f.total}</td>
                        <td className="px-4 py-2.5 text-right text-emerald-600 font-medium">{f.Available}</td>
                        <td className="px-4 py-2.5 text-right text-rose-500">{f.Occupied + f.Blocked}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200 bg-gray-50">
                      <td className="px-4 py-2.5 font-semibold text-gray-900">Total</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                        {floorSeatData.reduce((sum, f) => sum + f.total, 0)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-700">
                        {floorSeatData.reduce((sum, f) => sum + f.Available, 0)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-rose-600">
                        {floorSeatData.reduce((sum, f) => sum + f.Occupied + f.Blocked, 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="font-medium text-gray-900 mb-1">Overall seat availability</p>
                {seatStatusData.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={seatStatusData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={40}
                          outerRadius={65}
                          paddingAngle={2}
                        >
                          {seatStatusData.map((entry) => (
                            <Cell key={entry.name} fill={SEAT_STATUS_COLORS[entry.name]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={24} iconType="circle" iconSize={8} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No seat data yet.</p>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="font-medium text-gray-900 mb-2">Available seats by floor</p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={floorSeatData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip cursor={{ fill: '#f5f3ff' }} />
                      <Legend verticalAlign="bottom" height={24} iconType="circle" iconSize={8} />
                      <Bar dataKey="Available" stackId="s" fill={SEAT_STATUS_COLORS.Available} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Occupied" stackId="s" fill={SEAT_STATUS_COLORS.Occupied} />
                      <Bar dataKey="Blocked" stackId="s" fill={SEAT_STATUS_COLORS.Blocked} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="font-medium text-gray-900 mb-2">Seat availability by floor</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {floorPieData.map((floor) => (
                    <div key={floor.id} className="text-center">
                      <div className="h-28">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={floor.data}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={26}
                              outerRadius={40}
                              paddingAngle={2}
                            >
                              {floor.data.map((entry) => (
                                <Cell key={entry.name} fill={SEAT_STATUS_COLORS[entry.name]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-xs font-medium text-gray-700 truncate">{floor.name}</p>
                      <p className="text-[11px]">
                        <span className="text-emerald-600 font-semibold">{floor.available}</span>
                        <span className="text-gray-400">/{floor.total} available</span>
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-3 mt-2 text-[11px] text-gray-500">
                  {Object.entries(SEAT_STATUS_COLORS).map(([label, color]) => (
                    <span key={label} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Link to="/dashboard/floors" className="block bg-white rounded-2xl border border-gray-200 p-4 hover:border-indigo-300">
              <p className="font-medium text-gray-900">Manage Floors</p>
              <p className="text-sm text-gray-500">Add floors, seats, pricing and premium facilities</p>
            </Link>
            <Link to="/dashboard/facilities" className="block bg-white rounded-2xl border border-gray-200 p-4 hover:border-indigo-300">
              <p className="font-medium text-gray-900">Common Facilities</p>
              <p className="text-sm text-gray-500">Parking, WiFi, RO Water and more</p>
            </Link>
            <Link to="/dashboard/photos" className="block bg-white rounded-2xl border border-gray-200 p-4 hover:border-indigo-300">
              <p className="font-medium text-gray-900">Photos</p>
              <p className="text-sm text-gray-500">Showcase your library on the public page</p>
            </Link>
            <a
              href={`/l/${library.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-2xl border border-gray-200 p-4 hover:border-indigo-300"
            >
              <p className="font-medium text-gray-900">Public Page ↗</p>
              <p className="text-sm text-gray-500">What customers see — seat map, floors and pricing, no login required</p>
            </a>
          </div>
        </>
      )}
    </div>
  );
}
