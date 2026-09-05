import { useEffect, useState } from 'react';

const LAYOUT_TYPES = [
  { value: 'HORIZONTAL', label: 'Horizontal Rows', hint: 'Desks in rows facing the front, side by side' },
  { value: 'VERTICAL', label: 'Vertical Rows', hint: 'Desks in columns, front to back' },
  { value: 'SPLIT', label: 'Split (Facing Aisle)', hint: 'Two blocks with a walking aisle in the middle' },
];

const DEFAULT_TYPE = 'SPLIT';
const DEFAULT_ROWS = 5;
const DEFAULT_COLUMNS = 4;

export default function SeatLayoutBuilder({ totalSeats, value, onChange }) {
  const [type, setType] = useState(value?.type ?? DEFAULT_TYPE);
  const [rows, setRows] = useState(value?.rows ?? DEFAULT_ROWS);
  const [columns, setColumns] = useState(value?.columns ?? DEFAULT_COLUMNS);
  const [blocked, setBlocked] = useState(new Set(value?.blocked ?? []));

  useEffect(() => {
    onChange({ type, rows, columns, blocked: [...blocked] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, rows, columns, blocked]);

  const totalCells = rows * columns;
  const seatsPlaced = totalCells - blocked.size;

  function toggleCell(index) {
    setBlocked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function seatLabelForIndex(index) {
    if (blocked.has(index)) return null;
    let seatOrdinal = 0;
    for (let i = 0; i <= index; i += 1) {
      if (!blocked.has(i)) seatOrdinal += 1;
    }
    return seatOrdinal;
  }

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gridAutoFlow: type === 'VERTICAL' ? 'column' : 'row',
    gap: '6px',
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Layout style</p>
        <div className="grid grid-cols-1 gap-2">
          {LAYOUT_TYPES.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${
                type === opt.value ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="layout-type"
                checked={type === opt.value}
                onChange={() => setType(opt.value)}
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">{opt.label}</span>
                <span className="block text-xs text-gray-500">{opt.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Rows</label>
          <button type="button" onClick={() => setRows((r) => Math.max(1, r - 1))} className="w-7 h-7 rounded border border-gray-300 text-gray-600">−</button>
          <span className="w-6 text-center text-sm">{rows}</span>
          <button type="button" onClick={() => setRows((r) => Math.min(50, r + 1))} className="w-7 h-7 rounded border border-gray-300 text-gray-600">+</button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Columns</label>
          <button type="button" onClick={() => setColumns((c) => Math.max(1, c - 1))} className="w-7 h-7 rounded border border-gray-300 text-gray-600">−</button>
          <span className="w-6 text-center text-sm">{columns}</span>
          <button type="button" onClick={() => setColumns((c) => Math.min(50, c + 1))} className="w-7 h-7 rounded border border-gray-300 text-gray-600">+</button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500">
            Tap a desk to mark it as an aisle/gap. {seatsPlaced} of {totalSeats} seats placed
            {seatsPlaced !== totalSeats && (
              <span className="text-amber-600"> — adjust rows/columns to match</span>
            )}
            .
          </p>
          <div className="flex items-center gap-3 text-[10px] text-gray-500 shrink-0">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-200 border border-emerald-400 inline-block" />Seat</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-100 border border-dashed border-gray-300 inline-block" />Aisle</span>
          </div>
        </div>

        <div className="rounded-xl border-2 border-slate-300 bg-slate-50 p-4 relative">
          <div className="absolute top-2 right-3 text-[10px] tracking-widest text-slate-400 font-medium">FLOOR PLAN</div>

          {type === 'SPLIT' ? (
            <div className="flex items-stretch gap-2 overflow-x-auto pb-2 pt-2">
              <div style={{ ...gridStyle, gridTemplateColumns: `repeat(${Math.ceil(columns / 2)}, minmax(0,1fr))` }} className="flex-1">
                {Array.from({ length: rows * Math.ceil(columns / 2) }, (_, i) => i).map((index) => (
                  <SeatCell key={index} label={seatLabelForIndex(index)} onClick={() => toggleCell(index)} />
                ))}
              </div>
              <div className="w-8 flex items-center justify-center">
                <span className="text-[9px] text-slate-400 rotate-90 whitespace-nowrap tracking-wide">AISLE</span>
              </div>
              <div style={{ ...gridStyle, gridTemplateColumns: `repeat(${Math.floor(columns / 2)}, minmax(0,1fr))` }} className="flex-1">
                {Array.from({ length: rows * Math.floor(columns / 2) }, (_, i) => i + rows * Math.ceil(columns / 2)).map((index) => (
                  <SeatCell key={index} label={seatLabelForIndex(index)} onClick={() => toggleCell(index)} />
                ))}
              </div>
            </div>
          ) : (
            <div style={gridStyle} className="overflow-x-auto pb-2 pt-2">
              {Array.from({ length: totalCells }, (_, i) => i).map((index) => (
                <SeatCell key={index} label={seatLabelForIndex(index)} onClick={() => toggleCell(index)} />
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-8 h-1 rounded-full bg-slate-300 inline-block" />
            ENTRY
          </div>
        </div>
      </div>
    </div>
  );
}

function SeatCell({ label, onClick }) {
  const isAisle = label === null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`aspect-square min-w-[28px] rounded-md flex items-center justify-center text-[10px] font-semibold transition-colors ${
        isAisle
          ? 'bg-gray-100 text-gray-300 border border-dashed border-gray-300'
          : 'bg-emerald-200 text-emerald-800 border border-emerald-400 hover:bg-emerald-300 shadow-sm'
      }`}
      title={isAisle ? 'Aisle / gap' : `Seat ${label}`}
    >
      {isAisle ? '' : label}
    </button>
  );
}
