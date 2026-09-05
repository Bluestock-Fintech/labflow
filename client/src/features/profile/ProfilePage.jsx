import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Check, Pencil } from 'lucide-react';
import { logout } from '../auth/authSlice';
import { useOwnerLibrary } from '../libraries/useOwnerLibrary';
import { useUpdateLibraryMutation } from '../../app/api';

// Google Maps links sometimes encode coordinates directly (…/@lat,lng,… or
// …!3dlat!4dlng…) — when present we can embed a live preview without an API
// key. Short links (maps.app.goo.gl/…) don't, so we fall back to the address.
function extractLatLng(url) {
  if (!url) return null;
  const at = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return `${at[1]},${at[2]}`;
  const bang = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (bang) return `${bang[1]},${bang[2]}`;
  return null;
}

function LocationEditor({ library }) {
  const [updateLibrary, { isLoading }] = useUpdateLibraryMutation();
  const hasSavedLocation = Boolean(library.map_link || library.address);
  const [editing, setEditing] = useState(!hasSavedLocation);
  const [mapLink, setMapLink] = useState(library.map_link ?? '');
  const [address, setAddress] = useState(library.address ?? '');

  useEffect(() => {
    setMapLink(library.map_link ?? '');
    setAddress(library.address ?? '');
  }, [library.map_link, library.address]);

  const coords = extractLatLng(mapLink);
  const previewQuery = coords || address.trim();
  const previewSrc = previewQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(previewQuery)}&output=embed`
    : null;

  async function handleSave(e) {
    e.preventDefault();
    try {
      await updateLibrary({ libraryId: library.id, map_link: mapLink, address }).unwrap();
      setEditing(false);
    } catch {
      // form stays as-is; user can retry
    }
  }

  if (!editing) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
          <button
            onClick={() => setEditing(true)}
            aria-label="Edit location"
            className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
            Edit
          </button>
        </div>
        <h2 className="font-medium text-gray-900 mb-3">Map link &amp; address</h2>

        {previewSrc && (
          <div className="rounded-xl overflow-hidden border border-gray-200 mb-3">
            <iframe
              title="Location preview"
              src={previewSrc}
              className="w-full h-40 border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}

        {address && <p className="text-sm text-gray-700 mb-2">{address}</p>}

        {mapLink && (
          <a href={mapLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:underline">
            <MapPin className="w-4 h-4" strokeWidth={1.75} />
            Open in Google Maps ↗
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</p>
      <h2 className="font-medium text-gray-900 mb-3">Map link &amp; address</h2>

      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps link</label>
          <input
            type="url"
            value={mapLink}
            onChange={(e) => setMapLink(e.target.value)}
            placeholder="https://maps.app.goo.gl/…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            placeholder="Shop no. 4, Sadashiv Peth, Pune"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {previewSrc ? (
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <iframe
              title="Location preview"
              src={previewSrc}
              className="w-full h-40 border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          mapLink && (
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
              No live preview for this link — add an address above, or paste a link with coordinates in it.
            </p>
          )
        )}

        {mapLink && (
          <a href={mapLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:underline">
            <MapPin className="w-4 h-4" strokeWidth={1.75} />
            Open in Google Maps ↗
          </a>
        )}

        <div className="flex gap-2">
          {hasSavedLocation && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium py-2.5 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              'Saving…'
            ) : (
              <>
                <Check className="w-4 h-4" strokeWidth={2} />
                Save location
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

const STATUS_STYLES = {
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  DRAFT: 'bg-gray-100 text-gray-500',
  SUSPENDED: 'bg-red-100 text-red-700',
  CLOSED: 'bg-gray-100 text-gray-500',
};

function LibraryDetailsEditor({ library }) {
  const [updateLibrary, { isLoading, error }] = useUpdateLibraryMutation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(library.name ?? '');
  const [email, setEmail] = useState(library.email ?? '');
  const [mobile, setMobile] = useState(library.mobile ?? '');

  useEffect(() => {
    setName(library.name ?? '');
    setEmail(library.email ?? '');
    setMobile(library.mobile ?? '');
  }, [library.name, library.email, library.mobile]);

  async function handleSave(e) {
    e.preventDefault();
    try {
      await updateLibrary({ libraryId: library.id, name, email, mobile }).unwrap();
      setEditing(false);
    } catch {
      // form stays as-is; user can retry
    }
  }

  if (!editing) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Library</p>
          <button
            onClick={() => setEditing(true)}
            aria-label="Edit library details"
            className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
            Edit
          </button>
        </div>
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900">{library.name}</p>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[library.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {library.status}
          </span>
        </div>
        {library.email && <p className="text-sm text-gray-500 mt-1">{library.email}</p>}
        {library.mobile && <p className="text-sm text-gray-500">{library.mobile}</p>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Library</p>
      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Library name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">Email can't be changed.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
          <input
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error.data?.error?.message || 'Could not save.'}</p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex-1 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium py-2.5 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              'Saving…'
            ) : (
              <>
                <Check className="w-4 h-4" strokeWidth={2} />
                Save
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  const user = useSelector((s) => s.auth.user);
  const { library } = useOwnerLibrary();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Owner</p>
        <h1 className="text-lg font-semibold text-gray-900">{user?.name}</h1>
        <p className="text-sm text-gray-500">{user?.email}</p>
        <p className="text-sm text-gray-500">{user?.mobile}</p>
      </div>

      {library && <LibraryDetailsEditor library={library} />}

      {library && <LocationEditor library={library} />}

      <div className="space-y-2">
        <Link to="/dashboard/facilities" className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 p-4 hover:border-indigo-300">
          <div>
            <p className="font-medium text-gray-900">Common Facilities</p>
            <p className="text-sm text-gray-500">Parking, WiFi, RO Water and more</p>
          </div>
          <span className="flex items-center gap-1 text-xs text-indigo-600 shrink-0">
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
            Edit
          </span>
        </Link>
        <Link to="/dashboard/photos" className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 p-4 hover:border-indigo-300">
          <div>
            <p className="font-medium text-gray-900">Photos</p>
            <p className="text-sm text-gray-500">Showcase your library on the public page</p>
          </div>
          <span className="flex items-center gap-1 text-xs text-indigo-600 shrink-0">
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
            Edit
          </span>
        </Link>
      </div>

      <button
        onClick={() => { dispatch(logout()); navigate('/login'); }}
        className="w-full rounded-lg border border-red-200 text-red-600 text-sm font-medium py-2.5 hover:bg-red-50"
      >
        Log out
      </button>
    </div>
  );
}
