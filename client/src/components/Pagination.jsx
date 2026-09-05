import { useEffect, useState } from 'react';

function pageWindow(page, totalPages) {
  const pages = [];
  const add = (p) => { if (!pages.includes(p)) pages.push(p); };

  add(1);
  for (let p = page - 1; p <= page + 1; p += 1) {
    if (p > 1 && p < totalPages) add(p);
  }
  if (totalPages > 1) add(totalPages);

  const withEllipsis = [];
  let prev = 0;
  for (const p of pages) {
    if (prev && p - prev > 1) withEllipsis.push('...');
    withEllipsis.push(p);
    prev = p;
  }
  return withEllipsis;
}

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const [jumpValue, setJumpValue] = useState(String(page));

  useEffect(() => setJumpValue(String(page)), [page]);

  function go(p) {
    const next = Math.min(totalPages, Math.max(1, p));
    if (next !== page) onPageChange(next);
  }

  function handleJump() {
    const n = parseInt(jumpValue, 10);
    if (Number.isFinite(n)) go(n);
    else setJumpValue(String(page));
  }

  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-gray-500 pt-2">
      <span className="whitespace-nowrap">{start}–{end} / {total}</span>

      <div className="flex items-center gap-1">
        {pageWindow(page, totalPages).map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-1.5 text-gray-300">…</span>
          ) : (
            <button
              key={p}
              onClick={() => go(p)}
              className={`min-w-[26px] h-[26px] rounded-md text-xs font-medium ${
                p === page ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      <div className="flex items-center gap-3 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span>Per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-1.5 py-1 text-xs bg-white"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span>Jump To</span>
          <input
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleJump(); }}
            className="w-10 rounded-md border border-gray-300 px-1.5 py-1 text-xs text-center"
          />
          <button
            onClick={handleJump}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium hover:bg-gray-50"
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
}
