import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutGrid,
  IndianRupee,
  Image as ImageIcon,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Navigation,
  ArrowLeft,
  Hand,
} from 'lucide-react';
import { useGetPublicLibraryQuery, useGetPublicLibraryFloorsQuery } from '../../app/api';
import { Skeleton } from '../../components/Skeleton';
import FacilityIcon from '../../components/FacilityIcon';

function FacilityChip({ name, price }) {
  return (
    <div className="flex flex-col items-center gap-1.5 w-[76px]">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
        <FacilityIcon name={name} className="w-6 h-6 text-indigo-600" />
      </div>
      <p className="text-[11px] font-medium text-gray-700 text-center leading-tight">{name}</p>
      {Number(price) > 0 && <p className="text-[10px] text-gray-400">₹{Number(price).toFixed(0)}</p>}
    </div>
  );
}

function SeatIcon({ seatNumber, available, onBook }) {
  if (seatNumber === null) {
    return <div className="w-8 h-8 rounded-full border border-dashed border-gray-200" />;
  }

  if (available && onBook) {
    return (
      <button
        type="button"
        onClick={onBook}
        title={`Seat ${seatNumber} · Available — tap to book`}
        className="w-8 h-8 rounded-full border-2 border-emerald-300 bg-emerald-50 text-emerald-700 flex items-center justify-center text-[9px] font-semibold hover:bg-emerald-600 hover:border-emerald-600 hover:text-white transition-colors active:scale-95"
      >
        {seatNumber}
      </button>
    );
  }

  return (
    <div
      title={`Seat ${seatNumber} · ${available ? 'Available' : 'Unavailable'}`}
      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[9px] font-semibold ${
        available
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
          : 'border-red-300 bg-red-50 text-red-700 opacity-70 cursor-not-allowed'
      }`}
    >
      {seatNumber}
    </div>
  );
}

function DeskBar() {
  return <div className="w-1 h-8 rounded-full bg-sky-200" />;
}

// One contiguous block of the grid (the whole floor, or one half of a SPLIT
// layout): rows of seat-pairs with a desk bar between each pair. `ordinalByCell`
// is keyed by global cell index across the whole grid (computed once by the
// caller) so seat numbers stay continuous across a SPLIT layout's two halves.
function LayoutBlock({ rows, columns, cellOffset, ordinalByCell, seatByNumber, flowByColumn, onSeatClick }) {
  const cellsByRow = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: columns }, (_, c) => {
      const localIndex = flowByColumn ? c * rows + r : r * columns + c;
      return cellOffset + localIndex;
    })
  );

  return (
    <div className="space-y-2.5">
      {cellsByRow.map((row, rowIdx) => (
        <div key={rowIdx} className="flex items-center gap-2">
          {row.map((cellIndex, colIdx) => {
            const seatNumber = ordinalByCell.get(cellIndex) ?? null;
            const seat = seatNumber !== null ? seatByNumber.get(seatNumber) : null;
            const isPairStart = colIdx % 2 === 0;
            const hasPairPartner = colIdx + 1 < row.length;
            return (
              <div key={cellIndex} className="flex items-center gap-2">
                <SeatIcon
                  seatNumber={seatNumber}
                  available={seat?.status === 'AVAILABLE'}
                  onBook={seat && seat.status === 'AVAILABLE' ? () => onSeatClick?.(seat) : undefined}
                />
                {isPairStart && hasPairPartner && <DeskBar />}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Assigns seat ordinals to non-blocked cells of one block, in the same
// traversal order LayoutBlock renders them, starting from `startOrdinal`.
// Returns the populated map plus the next free ordinal for the next block.
function assignOrdinals(rows, columns, cellOffset, blocked, flowByColumn, startOrdinal, into) {
  let ordinal = startOrdinal;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < columns; c += 1) {
      const localIndex = flowByColumn ? c * rows + r : r * columns + c;
      const cellIndex = cellOffset + localIndex;
      if (!blocked.has(cellIndex)) {
        ordinal += 1;
        into.set(cellIndex, ordinal);
      }
    }
  }
  return ordinal;
}

function FloorSeatMap({ floor, onSeatClick }) {
  const layout = floor.layout_config;
  const seatByNumber = new Map(floor.seats.map((s) => [Number(s.seat_number), s]));

  if (!layout) {
    return (
      <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
        {floor.seats.map((seat) => (
          <SeatIcon
            key={seat.id}
            seatNumber={seat.seat_number}
            available={seat.status === 'AVAILABLE'}
            onBook={seat.status === 'AVAILABLE' ? () => onSeatClick?.(seat) : undefined}
          />
        ))}
      </div>
    );
  }

  const blocked = new Set(layout.blocked ?? []);
  const { type, rows, columns } = layout;
  const flowByColumn = type === 'VERTICAL';
  const capacity = rows * columns - blocked.size;

  // Floor may have more seats than the saved layout grid covers (e.g. seats
  // added after the layout was drawn) — show those as an extra wrapped row.
  const overflowSeats = floor.seats.filter((s) => Number(s.seat_number) > capacity);

  const ordinalByCell = new Map();
  let grid;

  if (type === 'SPLIT') {
    const leftCols = Math.ceil(columns / 2);
    const rightCols = Math.floor(columns / 2);
    const afterLeft = assignOrdinals(rows, leftCols, 0, blocked, flowByColumn, 0, ordinalByCell);
    assignOrdinals(rows, rightCols, rows * leftCols, blocked, flowByColumn, afterLeft, ordinalByCell);
    grid = (
      <div className="flex items-start gap-4 overflow-x-auto pb-2">
        <LayoutBlock rows={rows} columns={leftCols} cellOffset={0} ordinalByCell={ordinalByCell} seatByNumber={seatByNumber} flowByColumn={flowByColumn} onSeatClick={onSeatClick} />
        <div className="self-stretch w-px bg-gray-200 mx-1" />
        <LayoutBlock rows={rows} columns={rightCols} cellOffset={rows * leftCols} ordinalByCell={ordinalByCell} seatByNumber={seatByNumber} flowByColumn={flowByColumn} onSeatClick={onSeatClick} />
      </div>
    );
  } else {
    assignOrdinals(rows, columns, 0, blocked, flowByColumn, 0, ordinalByCell);
    grid = (
      <div className="overflow-x-auto pb-2">
        <LayoutBlock rows={rows} columns={columns} cellOffset={0} ordinalByCell={ordinalByCell} seatByNumber={seatByNumber} flowByColumn={flowByColumn} onSeatClick={onSeatClick} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {grid}
      {overflowSeats.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-400 mb-1">Additional seats</p>
          <div className="flex flex-wrap gap-2">
            {overflowSeats.map((seat) => (
              <SeatIcon
                key={seat.id}
                seatNumber={seat.seat_number}
                available={seat.status === 'AVAILABLE'}
                onBook={seat.status === 'AVAILABLE' ? () => onSeatClick?.(seat) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FloorPricing({ pricing }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="rounded-lg bg-gray-50 border border-gray-200 py-2">
        <p className="text-[11px] text-gray-500">Full-time</p>
        <p className="text-sm font-semibold text-gray-900">₹{pricing.per_chair_full_time_price.toFixed(0)}</p>
      </div>
      <div className="rounded-lg bg-gray-50 border border-gray-200 py-2">
        <p className="text-[11px] text-gray-500">Half-time</p>
        <p className="text-sm font-semibold text-gray-900">₹{pricing.per_chair_half_time_price.toFixed(0)}</p>
      </div>
      <div className="rounded-lg bg-gray-50 border border-gray-200 py-2">
        <p className="text-[11px] text-gray-500">Per day</p>
        <p className="text-sm font-semibold text-gray-900">₹{pricing.per_chair_per_day_price.toFixed(0)}</p>
      </div>
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'pricing', label: 'Pricing', icon: IndianRupee },
  { id: 'photos', label: 'Photos', icon: ImageIcon },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'contact', label: 'Contact', icon: Phone },
];

export default function PublicLibraryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const customer = useSelector((s) => (s.auth.user?.role === 'CUSTOMER' ? s.auth.user : null));
  const { data: libraryData, isLoading: libraryLoading, error: libraryError } = useGetPublicLibraryQuery(slug);
  const { data: floorsData, isLoading: floorsLoading } = useGetPublicLibraryFloorsQuery(slug);

  const library = libraryData?.data;
  const floors = floorsData?.data ?? [];

  const [activeTab, setActiveTab] = useState('overview');
  const [bookingNotice, setBookingNotice] = useState(null);

  function goToSection(id) {
    setActiveTab(id);
    window.scrollTo(0, 0);
  }

  function handleSeatClick(seat, floor) {
    if (!customer) {
      const params = new URLSearchParams({
        slug,
        seatNumber: String(seat.seat_number),
        floorName: floor.floor_name,
      });
      navigate(`/customer-auth?${params.toString()}`);
      return;
    }
    // No booking API yet — confirm the selection inline for a logged-in customer.
    setBookingNotice(`Seat ${seat.seat_number} on ${floor.floor_name} selected. The library owner will confirm your booking shortly.`);
    setActiveTab('overview');
    window.scrollTo(0, 0);
  }

  const availableSeats = useMemo(
    () => floors.reduce((sum, f) => sum + f.seats.filter((s) => s.status === 'AVAILABLE').length, 0),
    [floors]
  );

  const cheapestFullTime = useMemo(() => {
    if (floors.length === 0) return null;
    return Math.min(...floors.map((f) => f.pricing.per_chair_full_time_price));
  }, [floors]);

  if (!libraryLoading && (libraryError || !library)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-sm text-gray-600">This library page doesn't exist.</p>
      </div>
    );
  }

  // library.map_link may be a share link with embedded coordinates
  // (…/@lat,lng,… or …!3dlat!4dlng…); prefer those for an accurate preview,
  // otherwise fall back to a best-effort address/name query.
  const linkCoords = library?.map_link?.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ?? library?.map_link?.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const mapQuery = library
    ? library.latitude && library.longitude
      ? `${library.latitude},${library.longitude}`
      : linkCoords
      ? `${linkCoords[1]},${linkCoords[2]}`
      : [library.name, library.address, library.area, library.city].filter(Boolean).join(', ')
    : '';
  const mapEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;
  const mapLinkHref = library?.map_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            className="shrink-0 w-9 h-9 -ml-1.5 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
          </button>
          <div className="min-w-0 flex-1">
            {libraryLoading ? (
              <div className="space-y-1.5 py-0.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            ) : (
              <>
                <h1 className="text-lg font-semibold text-gray-900 truncate">{library.name}</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {[library.area, library.city].filter(Boolean).join(', ') || 'Location not set'}
                </p>
              </>
            )}
          </div>
        </div>

        <nav className="hidden md:flex max-w-2xl mx-auto mt-3 gap-1 border-t border-gray-100 pt-2 -mb-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => goToSection(tab.id)}
                className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {activeTab === 'overview' && (
        <section className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex gap-4 text-sm text-gray-600">
              <div>
                {libraryLoading ? <Skeleton className="h-7 w-8 mb-1" /> : (
                  <p className="text-2xl font-semibold text-gray-900">{library.floor_count}</p>
                )}
                <p className="text-xs text-gray-500">{libraryLoading ? 'Floors' : `Floor${library.floor_count === 1 ? '' : 's'}`}</p>
              </div>
              <div>
                {libraryLoading ? <Skeleton className="h-7 w-8 mb-1" /> : (
                  <p className="text-2xl font-semibold text-gray-900">{library.total_seats}</p>
                )}
                <p className="text-xs text-gray-500">Total seats</p>
              </div>
              <div>
                {libraryLoading || floorsLoading ? <Skeleton className="h-7 w-8 mb-1" /> : (
                  <p className="text-2xl font-semibold text-emerald-600">{availableSeats}</p>
                )}
                <p className="text-xs text-gray-500">Available now</p>
              </div>
            </div>
            {(libraryLoading || floorsLoading) ? (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Skeleton className="h-4 w-48" />
              </div>
            ) : cheapestFullTime !== null && (
              <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                Starting at <span className="font-semibold text-gray-900">₹{cheapestFullTime.toFixed(0)}</span>/month, full-time
              </p>
            )}
          </div>

          {libraryLoading ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h2 className="font-medium text-gray-900 mb-3">Facilities</h2>
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 w-[76px]">
                    <Skeleton className="w-14 h-14 rounded-2xl" />
                    <Skeleton className="h-2.5 w-12" />
                  </div>
                ))}
              </div>
            </div>
          ) : library.facilities?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h2 className="font-medium text-gray-900 mb-3">Facilities</h2>
              <div className="flex flex-wrap gap-3">
                {library.facilities.map((f) => (
                  <FacilityChip key={f.facility_id} name={f.name} price={f.price} />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-medium text-gray-900">Floor Map</h2>
                <span className="flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5">
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-red-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-red-500" />
                  </span>
                  <span className="text-[10px] font-semibold text-red-600 tracking-wide">LIVE</span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full border-2 border-emerald-300 bg-emerald-50 inline-block" />
                  Available
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full border-2 border-red-300 bg-red-50 inline-block" />
                  Unavailable
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1 h-3 rounded-full bg-sky-200 inline-block" />
                  Desk
                </span>
              </div>
            </div>
            <div className="tap-hint flex items-center gap-2 rounded-lg border px-3 py-2 mb-3 transition-colors">
              <Hand className="tap-hint-icon w-4 h-4 shrink-0" strokeWidth={2} />
              <p className="text-xs font-medium">Tap an available seat to book it.</p>
            </div>
            {bookingNotice && (
              <div className="mb-3 text-xs rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 flex items-start justify-between gap-2">
                <span>{bookingNotice}</span>
                <button
                  type="button"
                  onClick={() => setBookingNotice(null)}
                  className="shrink-0 text-emerald-600 hover:text-emerald-800 font-medium"
                >
                  Dismiss
                </button>
              </div>
            )}
            {floorsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }, (_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {Array.from({ length: 12 }, (_, j) => (
                        <Skeleton key={j} className="w-8 h-8 rounded-full" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : floors.length === 0 ? (
              <p className="text-sm text-gray-500">No floors published yet.</p>
            ) : (
              <div className="space-y-4">
                {floors.map((floor) => {
                  const available = floor.seats.filter((s) => s.status === 'AVAILABLE').length;
                  return (
                    <div key={floor.id} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{floor.floor_name}</h3>
                        <span className="text-xs text-gray-500">{available}/{floor.seats.length} available</span>
                      </div>

                      {floor.facilities?.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {floor.facilities.map((f) => (
                            <FacilityChip key={f.id} name={f.name} price={f.price} />
                          ))}
                        </div>
                      )}

                      <FloorSeatMap floor={floor} onSeatClick={(seat) => handleSeatClick(seat, floor)} />
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[11px] text-gray-400 text-center mt-4">Actual layout may vary.</p>
          </div>
        </section>
        )}

        {activeTab === 'pricing' && (
        <section>
          <h2 className="font-medium text-gray-900 mb-3">Pricing by floor</h2>
          {floorsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : floors.length === 0 ? (
            <p className="text-sm text-gray-500">No floors published yet.</p>
          ) : (
            <div className="space-y-3">
              {floors.map((floor) => (
                <div key={floor.id} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
                  <p className="text-sm font-medium text-gray-800">{floor.floor_name}</p>
                  <FloorPricing pricing={floor.pricing} />
                </div>
              ))}
            </div>
          )}
        </section>
        )}

        {activeTab === 'photos' && (
        <section>
          <h2 className="font-medium text-gray-900 mb-3">Photos</h2>
          {libraryLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : library.photos?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {library.photos.map((photo) => (
                <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={photo.storage_key} alt={photo.title ?? library.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
              <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm text-gray-500">No photos added yet.</p>
            </div>
          )}
        </section>
        )}

        {activeTab === 'location' && (
        <section>
          <h2 className="font-medium text-gray-900 mb-3">Location</h2>
          {libraryLoading ? (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <Skeleton className="w-full h-56 rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <iframe
              title="Library location"
              src={mapEmbedSrc}
              className="w-full h-56 border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="p-4 space-y-2">
              <p className="text-sm text-gray-700 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" strokeWidth={1.75} />
                {[library.address, library.area, library.city].filter(Boolean).join(', ') || 'Address not set'}
              </p>
              <a
                href={mapLinkHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:underline"
              >
                <Navigation className="w-4 h-4" strokeWidth={1.75} />
                Get directions
              </a>
            </div>
          </div>
          )}
        </section>
        )}

        {activeTab === 'contact' && (
        <section>
          <h2 className="font-medium text-gray-900 mb-3">Contact</h2>
          {libraryLoading ? (
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
            {library.mobile && (
              <a href={`tel:${library.mobile}`} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-emerald-600" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{library.mobile}</p>
                  <p className="text-xs text-gray-500">Call</p>
                </div>
              </a>
            )}
            {library.mobile && (
              <a
                href={`https://wa.me/${library.mobile.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3.5"
              >
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-green-600" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">WhatsApp</p>
                  <p className="text-xs text-gray-500">Message the library</p>
                </div>
              </a>
            )}
            {library.email && (
              <a href={`mailto:${library.email}`} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-indigo-600" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate">{library.email}</p>
                  <p className="text-xs text-gray-500">Email</p>
                </div>
              </a>
            )}
            {!library.mobile && !library.email && (
              <p className="text-sm text-gray-500 px-4 py-3.5">No contact details added yet.</p>
            )}
          </div>
          )}
        </section>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex justify-around py-1.5 z-20">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => goToSection(tab.id)}
              className={`flex flex-col items-center gap-0.5 text-[11px] font-medium px-3 py-1 ${
                isActive ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={1.75} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
