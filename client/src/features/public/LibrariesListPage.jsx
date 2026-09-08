import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, BookOpen, Phone, Armchair, Search, X } from 'lucide-react';
import { useGetPublicLibrariesQuery } from '../../app/api';
import BrandLogo from '../../components/BrandLogo';
import PublicBottomNav from '../../components/PublicBottomNav';
import PublicSidebar from '../../components/PublicSidebar';
import LocationPrompt from '../../components/LocationPrompt';
import { SkeletonCard } from '../../components/Skeleton';
import { useNearbyLibraries } from '../../hooks/useNearbyLibraries';
import { MAJOR_CITIES } from '../../data/cities';

const CARD_GRADIENTS = [
  'from-indigo-100 via-indigo-50 to-violet-100',
  'from-emerald-100 via-teal-50 to-cyan-100',
  'from-amber-100 via-orange-50 to-rose-100',
  'from-sky-100 via-blue-50 to-indigo-100',
  'from-fuchsia-100 via-pink-50 to-rose-100',
  'from-lime-100 via-green-50 to-emerald-100',
  'from-orange-100 via-amber-50 to-yellow-100',
  'from-cyan-100 via-sky-50 to-blue-100',
  'from-purple-100 via-violet-50 to-fuchsia-100',
  'from-rose-100 via-red-50 to-orange-100',
  'from-teal-100 via-emerald-50 to-lime-100',
  'from-blue-100 via-indigo-50 to-purple-100',
  'from-yellow-100 via-lime-50 to-green-100',
  'from-pink-100 via-fuchsia-50 to-purple-100',
  'from-red-100 via-rose-50 to-pink-100',
];

function LibraryCard({ lib, index = 0 }) {
  const hasSeats = lib.total_seats > 0;
  const isFull = hasSeats && lib.available_seats === 0;
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-indigo-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <Link to={`/l/${lib.slug}`} className="block">
        <div className={`relative h-32 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
          {lib.cover_photo ? (
            <img
              src={lib.cover_photo}
              alt={lib.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <BookOpen className="w-9 h-9 text-indigo-300" strokeWidth={1.5} />
          )}
          <span
            className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm ${
              !hasSeats
                ? 'bg-white/90 text-gray-500'
                : isFull
                ? 'bg-red-500 text-white'
                : 'bg-emerald-500 text-white'
            }`}
          >
            {!hasSeats ? 'New Listing' : isFull ? 'Full' : `${lib.available_seats} free`}
          </span>
        </div>

        <div className="p-4 pb-3">
          <p className="font-medium text-gray-900 truncate">{lib.name}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 shrink-0" strokeWidth={1.75} />
            <span className="truncate">{[lib.area, lib.city].filter(Boolean).join(', ') || 'Location not set'}</span>
          </p>
        </div>
      </Link>

      <div className="px-4 pb-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        {hasSeats ? (
          <>
            <span className="flex items-center gap-1 text-xs text-gray-600">
              <Armchair className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.75} />
              <span className={isFull ? 'text-red-600 font-medium' : 'text-emerald-600 font-medium'}>
                {lib.available_seats}/{lib.total_seats}
              </span>
              available
            </span>
            {lib.cheapest_full_time_price && (
              <span className="text-xs text-gray-600">
                from <span className="font-semibold text-gray-900">₹{Number(lib.cheapest_full_time_price).toFixed(0)}</span>/mo
              </span>
            )}
          </>
        ) : (
          <>
            <span className="text-xs text-gray-400">Seat details coming soon</span>
            {lib.mobile && (
              <a
                href={`tel:${lib.mobile}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 shrink-0"
              >
                <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
                Call
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function LibrariesListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useNearbyLibraries();
  const { data, isLoading } = useGetPublicLibrariesQuery(location.queryParams);
  const allLibraries = data?.data ?? [];
  const [query, setQuery] = useState(searchParams.get('q') || '');

  // Pick up a city passed in from a link (e.g. the homepage search bar) once on load.
  useEffect(() => {
    const urlCity = searchParams.get('city');
    if (urlCity) location.useCity(urlCity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const next = new URLSearchParams();
    if (query) next.set('q', query);
    if (location.city) next.set('city', location.city);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, location.city]);

  const libraries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allLibraries;
    return allLibraries.filter((lib) =>
      [lib.name, lib.area, lib.city].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    );
  }, [allLibraries, query]);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <PublicSidebar />
      <PublicBottomNav />
      <div className="flex-1 flex flex-col min-w-0 pb-14 md:pb-0">
      <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <BrandLogo />
        <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
          Home
        </Link>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">All Libraries</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isLoading ? 'Loading…' : `${libraries.length} librar${libraries.length === 1 ? 'y' : 'ies'} available`}
          </p>
        </div>

        <div className="relative mb-3">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search libraries by name or area…"
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-9 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-3 -mx-1 px-1">
          <button
            onClick={() => location.useCity('')}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium border transition ${
              !location.city
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
          >
            All Cities
          </button>
          {MAJOR_CITIES.map((c) => (
            <button
              key={c}
              onClick={() => location.useCity(c)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium border transition ${
                location.city === c
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <LocationPrompt location={location} />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} lines={2} />)}
          </div>
        ) : libraries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-10 text-center">
            <p className="text-sm text-gray-500">
              {query
                ? 'No libraries match your search — try a different name or city.'
                : 'No libraries published yet — check back soon.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {libraries.map((lib, i) => (
              <LibraryCard key={lib.id} lib={lib} index={i} />
            ))}
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
