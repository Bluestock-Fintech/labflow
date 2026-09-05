import { useState } from 'react';

export default function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        aria-label="More info"
        className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-semibold flex items-center justify-center hover:bg-gray-300"
      >
        i
      </button>
      {open && (
        <span className="absolute z-10 top-full left-1/2 -translate-x-1/2 mt-1.5 w-56 rounded-lg bg-gray-900 text-white text-xs px-2.5 py-2 shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}
