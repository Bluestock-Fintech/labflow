import { useState } from 'react';
import { MapPin, X } from 'lucide-react';

export default function LocationPrompt({ location }) {
  const { permissionState, requestLocation, useManualPincode, coords, pincode } = location;
  const [manualInput, setManualInput] = useState('');
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || coords || pincode) {
    return coords || pincode ? (
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <MapPin className="w-3.5 h-3.5 text-indigo-500" strokeWidth={1.75} />
        {coords ? 'Showing libraries within 30km of your location' : `Showing libraries near pincode ${pincode}`}
        <button
          onClick={() => {
            setDismissed(false);
            useManualPincode('');
            window.location.reload();
          }}
          className="text-indigo-600 hover:underline"
        >
          Clear
        </button>
      </div>
    ) : null;
  }

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 mb-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <MapPin className="w-4 h-4 text-indigo-500 shrink-0" strokeWidth={1.75} />
      <p className="text-xs text-indigo-900 flex-1">
        Share your location to see libraries near you, or enter your pincode.
      </p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="Pincode"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value.replace(/\D/g, ''))}
          className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
        />
        <button
          onClick={() => manualInput.length === 6 && useManualPincode(manualInput)}
          className="text-xs font-medium text-indigo-600 hover:underline shrink-0"
        >
          Use pincode
        </button>
        <button
          onClick={requestLocation}
          disabled={permissionState === 'asked'}
          className="rounded-lg bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-60 shrink-0"
        >
          {permissionState === 'asked' ? 'Locating…' : 'Use my location'}
        </button>
        <button onClick={() => setDismissed(true)} className="text-gray-400 hover:text-gray-600 shrink-0">
          <X className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
