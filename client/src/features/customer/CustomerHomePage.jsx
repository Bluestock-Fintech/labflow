import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { MapPin, Sparkles } from 'lucide-react';
import { useGetPublicLibrariesQuery, useGetMyOrdersQuery } from '../../app/api';
import { SkeletonList, SkeletonCard } from '../../components/Skeleton';
import { expiryLabel, expiryStyle } from '../../utils/planStatus';
import quotes from '../../data/motivationalQuotes.json';
import Pagination from '../../components/Pagination';
import { usePagination } from '../../hooks/usePagination';

export default function CustomerHomePage() {
  const user = useSelector((s) => s.auth.user);
  const { data: ordersData, isLoading: ordersLoading } = useGetMyOrdersQuery();
  const { data: librariesData, isLoading: librariesLoading } = useGetPublicLibrariesQuery();

  const quote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], []);

  const activeOrders = (ordersData?.data ?? []).filter((o) => o.status === 'CONFIRMED');
  const libraries = librariesData?.data ?? [];
  const { page, pageSize, total, paged: pagedLibraries, setPage, setPageSize } = usePagination(libraries);

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div>
        <p className="text-sm text-gray-500">Good day,</p>
        <h1 className="text-xl font-semibold text-gray-900">{user?.name}</h1>
      </div>

      <div className="rounded-2xl bg-indigo-600 text-white p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={1.75} />
        <p className="text-sm leading-relaxed">{quote}</p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-gray-900">Currently Enrolled</h2>
          {activeOrders.length > 0 && (
            <Link to="/customer/enrolled" className="text-xs text-indigo-600 font-medium hover:underline">
              View all
            </Link>
          )}
        </div>
        {ordersLoading ? (
          <SkeletonList count={1} lines={2} />
        ) : activeOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-6 text-center">
            <p className="text-sm text-gray-500">Not enrolled anywhere yet — pick a library below.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeOrders.slice(0, 2).map((o) => (
              <Link
                key={o.id}
                to="/customer/enrolled"
                className="block bg-white rounded-2xl border border-gray-200 p-4 hover:border-indigo-300"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-gray-900">{o.library_name}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${expiryStyle(o.end_date)}`}>
                    {expiryLabel(o.end_date)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{o.floor_name} · Seat {o.seat_code}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-medium text-gray-900 mb-3">Browse Libraries</h2>
        {librariesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </div>
        ) : libraries.length === 0 ? (
          <p className="text-sm text-gray-500">No libraries available yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pagedLibraries.map((lib) => (
                <Link
                  key={lib.id}
                  to={`/l/${lib.slug}`}
                  className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-indigo-300"
                >
                  <p className="font-medium text-gray-900">{lib.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" strokeWidth={1.75} />
                    {[lib.area, lib.city].filter(Boolean).join(', ') || 'Location not set'}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    {lib.total_seats > 0 && (
                      <span className="text-xs text-emerald-600 font-medium">
                        {lib.available_seats}/{lib.total_seats} available
                      </span>
                    )}
                    {lib.cheapest_full_time_price && (
                      <span className="text-xs text-gray-600">
                        from <span className="font-semibold text-gray-900">₹{Number(lib.cheapest_full_time_price).toFixed(0)}</span>/mo
                      </span>
                    )}
                  </div>
                </Link>
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
      </section>
    </div>
  );
}
