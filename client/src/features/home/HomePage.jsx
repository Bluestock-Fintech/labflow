import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Building2,
  LayoutGrid,
  ClipboardList,
  Search,
  Armchair,
  Bell,
  MapPin,
  ArrowRight,
  Sparkles,
  X,
} from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import PublicBottomNav from '../../components/PublicBottomNav';
import PublicSidebar from '../../components/PublicSidebar';
import { useGetPublicLibrariesQuery } from '../../app/api';
import { SkeletonCard } from '../../components/Skeleton';
import quotes from '../../data/motivationalQuotes.json';

function dashboardPathFor(role) {
  if (role === 'SUPER_ADMIN') return '/admin';
  if (role === 'CUSTOMER') return '/customer/home';
  return '/dashboard';
}

function AlreadyLoggedInModal({ onClose }) {
  const user = useSelector((s) => s.auth.user);
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" strokeWidth={1.75} />
        </button>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">You're already logged in</h2>
        <p className="text-sm text-gray-500 mb-5">
          Signed in as <span className="font-medium text-gray-700">{user?.name}</span>. Head to your dashboard to continue.
        </p>
        <button
          onClick={() => navigate(dashboardPathFor(user?.role))}
          className="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

const OWNER_STEPS = [
  {
    icon: Building2,
    title: 'Register your library',
    body: 'Add your name, mobile and email — get a public booking page in minutes.',
  },
  {
    icon: LayoutGrid,
    title: 'Set up floors & pricing',
    body: 'Add up to 10 floors, draw the seat layout, and set monthly/half-day/per-day prices.',
  },
  {
    icon: ClipboardList,
    title: 'Manage bookings & customers',
    body: 'Approve requests, track expiries, renew subscriptions — all from your phone.',
  },
];

const STUDENT_STEPS = [
  {
    icon: Search,
    title: 'Find a library',
    body: 'Search by name or open the link your library shared with you.',
  },
  {
    icon: Armchair,
    title: 'See seats live',
    body: 'View every floor\'s real seat map and pick one that\'s actually available.',
  },
  {
    icon: Bell,
    title: 'Book & stay on top of it',
    body: 'Book instantly, then track your expiry and renew from your dashboard.',
  },
];

const CARD_ACCENTS = [
  'from-indigo-400 via-violet-400 to-fuchsia-400',
  'from-emerald-400 via-teal-400 to-cyan-400',
  'from-amber-400 via-orange-400 to-rose-400',
  'from-sky-400 via-blue-400 to-indigo-400',
];

function LibraryCard({ lib, index = 0 }) {
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
  return (
    <Link
      to={`/l/${lib.slug}`}
      className="snap-start shrink-0 w-64 bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition"
    >
      <div className={`h-1.5 bg-gradient-to-r ${accent}`} />
      <div className="p-4">
        <p className="font-medium text-gray-900 truncate">{lib.name}</p>
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{[lib.area, lib.city].filter(Boolean).join(', ') || 'Location not set'}</span>
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
      </div>
    </Link>
  );
}

const MARQUEE_ITEMS = [
  '100+ Libraries', 'Real-time Seat Availability', 'Instant Booking', 'No Waiting Lines',
  'Verified Owners', 'Flexible Plans — Daily to Monthly', 'Live Seat Maps', 'Renew in One Tap',
];

function MarqueePoints() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="overflow-hidden py-2 mb-6 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div className="marquee-track flex w-max gap-8 whitespace-nowrap">
        {[...items, ...items].map((text, i) => (
          <span key={i} className="flex items-center gap-2 text-sm font-medium text-gray-500/80">
            {text}
            <span className="text-gray-400/50">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { data, isLoading } = useGetPublicLibrariesQuery();
  const libraries = data?.data ?? [];
  const token = useSelector((s) => s.auth.token);
  const [showLoggedInModal, setShowLoggedInModal] = useState(Boolean(token));
  const quote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], []);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {showLoggedInModal && <AlreadyLoggedInModal onClose={() => setShowLoggedInModal(false)} />}
      <PublicSidebar />
      <PublicBottomNav />
      <div className="flex-1 flex flex-col min-w-0 pb-14 md:pb-0">
      <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <BrandLogo />
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700"
          >
            Register as Library
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative px-4 pt-16 pb-20 text-center overflow-hidden min-h-[80vh] flex flex-col items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/website-section1.jpg')" }}
          />
          <div className="absolute inset-0 bg-white/80" />
          <div className="relative w-full">
            <MarqueePoints />
            <h1 className="text-3xl sm:text-5xl font-semibold text-gray-900 mb-3 max-w-lg mx-auto">
              Find and book study seats near you
            </h1>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              LabFlow helps study libraries manage floors, seats and bookings —
              and helps students find an available seat in seconds.
            </p>
            <div className="flex items-center justify-center gap-3 mb-8">
              <Link to="/libraries" className="rounded-lg bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 hover:bg-indigo-700 shadow-sm">
                Find a Library
              </Link>
              <Link to="/register" className="rounded-lg border border-gray-300 bg-white/90 text-gray-700 text-sm font-medium px-5 py-2.5 hover:bg-white">
                Register as Library
              </Link>
            </div>
            <div className="max-w-md mx-auto rounded-2xl bg-white/30 backdrop-blur-md border border-white/50 text-gray-800 p-4 flex items-start gap-3 text-left shadow-lg">
              <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-indigo-500" strokeWidth={1.75} />
              <p className="text-sm leading-relaxed">{quote}</p>
            </div>
          </div>
        </section>

        <section id="libraries" className="py-10 px-4">
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Available Libraries</h2>
              <span className="text-xs text-gray-400">{libraries.length} listed</span>
            </div>

            {isLoading ? (
              <div className="flex gap-4 overflow-x-auto pb-2">
                <div className="shrink-0 w-64"><SkeletonCard lines={2} /></div>
                <div className="shrink-0 w-64"><SkeletonCard lines={2} /></div>
                <div className="shrink-0 w-64"><SkeletonCard lines={2} /></div>
              </div>
            ) : libraries.length === 0 ? (
              <p className="text-sm text-gray-500">No libraries published yet — check back soon.</p>
            ) : (
              <>
                <div className="space-y-4 overflow-hidden">
                  {[0, 1, 2].map((rowIndex) => {
                    const row = libraries.filter((_, i) => i % 3 === rowIndex);
                    if (row.length === 0) return null;
                    return (
                      <div key={rowIndex} className="overflow-hidden">
                        <div className={`card-row-track flex w-max gap-4 ${rowIndex === 1 ? 'reverse' : ''}`}>
                          {[...row, ...row].map((lib, i) => (
                            <LibraryCard key={`${lib.id}-${i}`} lib={lib} index={i} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center mt-4">
                  <Link
                    to="/libraries"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
                  >
                    View more
                    <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="relative py-16 px-4 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/website-section2.jpg')" }}
          />
          <div className="absolute inset-0 bg-gray-900/70" />

          <div className="relative max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-white">For Library Owners</h2>
              <p className="text-sm text-white/70 mt-1">Run your whole library from your phone.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {OWNER_STEPS.map((step, i) => (
                <div key={step.title} className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm p-5">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                    <step.icon className="w-5 h-5 text-white" strokeWidth={1.75} />
                  </div>
                  <p className="text-xs font-semibold text-indigo-300 mb-1">STEP {i + 1}</p>
                  <p className="font-medium text-white mb-1">{step.title}</p>
                  <p className="text-sm text-white/70">{step.body}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link to="/register" className="inline-flex items-center gap-1.5 text-sm font-medium text-white hover:underline">
                Register your library
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </Link>
            </div>

            <div className="h-px bg-white/15 my-12" />

            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-white">For Students</h2>
              <p className="text-sm text-white/70 mt-1">Discover and book seats at libraries near you.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {STUDENT_STEPS.map((step, i) => (
                <div key={step.title} className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm p-5">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                    <step.icon className="w-5 h-5 text-white" strokeWidth={1.75} />
                  </div>
                  <p className="text-xs font-semibold text-emerald-300 mb-1">STEP {i + 1}</p>
                  <p className="font-medium text-white mb-1">{step.title}</p>
                  <p className="text-sm text-white/70">{step.body}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link to="/libraries" className="inline-flex items-center gap-1.5 text-sm font-medium text-white hover:underline">
                Browse libraries
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      </div>
    </div>
  );
}
