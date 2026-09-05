import { useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { MAJOR_CITIES } from '../data/cities';

export default function LocationPrompt({ location }) {
  const { permissionState, requestLocation, useManualPincode, useCity, clear, coords, pincode, city } = location;
  const [manualInput, setManualInput] = useState('');
  const [dismissed, setDismissed] = useState(false);

  const active = coords || pincode || city;

  if (dismissed || active) {
    return active ? (
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-4">
        <MapPin className="w-3.5 h-3.5 text-indigo-500" strokeWidth={1.75} />
        {coords
          ? 'Showing libraries within 30km of your location'
          : pincode
          ? `Showing libraries near pincode ${pincode}`
          : `Showing libraries in ${city}`}
        <button onClick={clear} className="text-indigo-600 hover:underline">
          Clear
        </button>
      </div>
    ) : null;
  }

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 mb-4 flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" strokeWidth={1.75} />
        <p className="text-xs text-indigo-900 flex-1">
          Find libraries near you — share your location, pick a city, or enter your pincode.
        </p>
        <button onClick={() => setDismissed(true)} className="text-gray-400 hover:text-gray-600 shrink-0">
          <X className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={requestLocation}
          disabled={permissionState === 'asked'}
          className="rounded-lg bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-60 shrink-0"
        >
          {permissionState === 'asked' ? 'Locating…' : 'Use my location'}
        </button>

        <select
          value=""
          onChange={(e) => e.target.value && useCity(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs bg-white text-gray-700"
        >
          <option value="">Select city…</option>
          {MAJOR_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

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
      </div>
    </div>
  );
}
