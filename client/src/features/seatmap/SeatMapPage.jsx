import { useGetFloorsQuery } from '../../app/api';
import { useOwnerLibrary } from '../libraries/useOwnerLibrary';
import { Skeleton, SkeletonList } from '../../components/Skeleton';

function SeatIcon({ ordinal, available }) {
  if (ordinal === null) {
    return <div className="w-9 h-9 rounded-full border border-dashed border-gray-200" />;
  }
  return (
    <div className="relative">
      <div
        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-[10px] font-semibold ${
          available
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-red-300 bg-red-50 text-red-700'
        }`}
        title={`Seat ${ordinal} · ${available ? 'Available' : 'Occupied'}`}
      >
        {ordinal}
      </div>
      <span
        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] ring-2 ring-white ${
          available ? 'bg-emerald-500' : 'bg-red-500'
        }`}
      >
        {available ? '✓' : '⊘'}
      </span>
    </div>
  );
}

function DeskBar() {
  return <div className="w-1.5 h-9 rounded-full bg-sky-200" />;
}

// One contiguous block of the grid (the whole floor, or one half of a SPLIT
// layout): rows of seat-pairs with a desk bar between each pair. `ordinalByCell`
// is keyed by global cell index across the whole grid (computed once by the
// caller) so seat numbers stay continuous across a SPLIT layout's two halves.
function LayoutBlock({ rows, columns, cellOffset, ordinalByCell, seatByNumber, flowByColumn }) {
  const cellsByRow = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: columns }, (_, c) => {
      const localIndex = flowByColumn ? c * rows + r : r * columns + c;
      return cellOffset + localIndex;
    })
  );

  return (
    <div className="space-y-3">
      {cellsByRow.map((row, rowIdx) => (
        <div key={rowIdx} className="flex items-center gap-2">
          {row.map((cellIndex, colIdx) => {
            const ordinal = ordinalByCell.get(cellIndex) ?? null;
            const seat = ordinal !== null ? seatByNumber.get(ordinal) : null;
            const isPairStart = colIdx % 2 === 0;
            const hasPairPartner = colIdx + 1 < row.length;
            return (
              <div key={cellIndex} className="flex items-center gap-2">
                <SeatIcon ordinal={ordinal} available={seat?.status === 'AVAILABLE'} />
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
// Returns the next free ordinal so a second block can continue the sequence.
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

function FloorLayout({ floor }) {
  const layout = floor.layout_config;
  const seatByNumber = new Map((floor.seats ?? []).map((s) => [Number(s.seat_number), s]));

  if (!layout) {
    // Older floor with no saved layout — fall back to a simple wrapped grid.
    const totalSeats = Number(floor.total_seats) || 0;
    return (
      <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
        {Array.from({ length: totalSeats }, (_, i) => i + 1).map((ordinal) => (
          <SeatIcon key={ordinal} ordinal={ordinal} available={seatByNumber.get(ordinal)?.status === 'AVAILABLE'} />
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
  const overflowSeats = (floor.seats ?? []).filter((s) => Number(s.seat_number) > capacity);

  const ordinalByCell = new Map();
  let grid;

  if (type === 'SPLIT') {
    const leftCols = Math.ceil(columns / 2);
    const rightCols = Math.floor(columns / 2);
    const afterLeft = assignOrdinals(rows, leftCols, 0, blocked, flowByColumn, 0, ordinalByCell);
    assignOrdinals(rows, rightCols, rows * leftCols, blocked, flowByColumn, afterLeft, ordinalByCell);
    grid = (
      <div className="flex items-start gap-4 overflow-x-auto pb-2">
        <LayoutBlock rows={rows} columns={leftCols} cellOffset={0} ordinalByCell={ordinalByCell} seatByNumber={seatByNumber} flowByColumn={flowByColumn} />
        <div className="self-stretch w-px bg-gray-200 relative mx-1">
          <span className="absolute top-1/2 -translate-y-1/2 -left-3 text-[9px] text-gray-400 rotate-90 whitespace-nowrap">AISLE</span>
        </div>
        <LayoutBlock rows={rows} columns={rightCols} cellOffset={rows * leftCols} ordinalByCell={ordinalByCell} seatByNumber={seatByNumber} flowByColumn={flowByColumn} />
      </div>
    );
  } else {
    assignOrdinals(rows, columns, 0, blocked, flowByColumn, 0, ordinalByCell);
    grid = (
      <div className="overflow-x-auto pb-2">
        <LayoutBlock rows={rows} columns={columns} cellOffset={0} ordinalByCell={ordinalByCell} seatByNumber={seatByNumber} flowByColumn={flowByColumn} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {grid}
      {overflowSeats.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-400 mb-1">Additional seats</p>
          <div className="flex flex-wrap gap-2">
            {overflowSeats.map((seat) => (
              <SeatIcon key={seat.id} ordinal={seat.seat_number} available={seat.status === 'AVAILABLE'} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SeatMapPage() {
  const { library, isLoading: libraryLoading } = useOwnerLibrary();
  const { data: floorsData, isLoading: floorsLoading } = useGetFloorsQuery(library?.id, {
    skip: !library,
  });

  const floors = floorsData?.data ?? [];

  if (libraryLoading || floorsLoading) {
    return (
      <div className="p-4 max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-56" />
        </div>
        <SkeletonList count={2} lines={2} />
      </div>
    );
  }

  if (!library) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-600">You don't have a library yet. Register one first.</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Seat Map</h1>
        <p className="text-sm text-gray-500">Live seat status by floor, matching each floor's layout</p>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px]">✓</span>
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px]">⊘</span>
          Occupied
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-4 rounded-full bg-sky-200 inline-block" />
          Desk
        </span>
      </div>

      {floors.length === 0 ? (
        <p className="text-sm text-gray-500">No floors added yet.</p>
      ) : (
        <div className="space-y-5">
          {floors.map((floor) => {
            const available = (floor.seats ?? []).filter((s) => s.status === 'AVAILABLE').length;
            return (
              <div key={floor.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">{floor.floor_name}</h3>
                  <span className="text-xs text-gray-500">{available}/{floor.total_seats} available</span>
                </div>
                <FloorLayout floor={floor} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
