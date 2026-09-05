import { X } from 'lucide-react';

export default function BottomSheetModal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <h2 className="font-medium text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3">{children}</div>
      </div>
    </div>
  );
}
