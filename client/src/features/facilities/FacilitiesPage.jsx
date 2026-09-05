import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import {
  useGetFacilitiesQuery,
  useGetCommonFacilitiesQuery,
  useSetCommonFacilitiesMutation,
} from '../../app/api';
import { useOwnerLibrary } from '../libraries/useOwnerLibrary';
import RupeeInput from '../../components/RupeeInput';
import FacilityIcon from '../../components/FacilityIcon';
import { Skeleton, SkeletonCard } from '../../components/Skeleton';

export default function FacilitiesPage() {
  const navigate = useNavigate();
  const { library, isLoading: libraryLoading } = useOwnerLibrary();
  const { data: facilitiesData } = useGetFacilitiesQuery();
  const { data: currentData } = useGetCommonFacilitiesQuery(library?.id, { skip: !library });
  const [setCommonFacilities, { isLoading: isSaving, error }] = useSetCommonFacilitiesMutation();

  const commonFacilities = (facilitiesData?.data ?? []).filter((f) => f.default_scope === 'COMMON');
  const [selected, setSelected] = useState({});

  useEffect(() => {
    if (currentData?.data) {
      const map = {};
      currentData.data.forEach((f) => { map[f.facility_id] = String(f.price); });
      setSelected(map);
    }
  }, [currentData]);

  function toggle(facilityId) {
    setSelected((prev) => {
      const next = { ...prev };
      if (facilityId in next) delete next[facilityId];
      else next[facilityId] = '0';
      return next;
    });
  }

  async function handleSave() {
    if (!library) return;
    const facilities = Object.entries(selected).map(([facility_id, price]) => ({
      facility_id,
      price: Number(price) || 0,
    }));
    try {
      await setCommonFacilities({ libraryId: library.id, facilities }).unwrap();
      navigate('/dashboard/profile');
    } catch {
      // error surfaced below
    }
  }

  if (libraryLoading) {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <SkeletonCard lines={4} />
      </div>
    );
  }
  if (!library) return <p className="p-4 text-sm text-gray-600">Register a library first.</p>;

  const selectedCount = Object.keys(selected).length;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4 pb-24">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Common Facilities</h1>
        <p className="text-sm text-gray-500">Available across the whole library, not per floor.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-xs text-gray-500 mb-3">
          Tap a facility to enable it{selectedCount > 0 ? ` · ${selectedCount} selected` : ''}
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {commonFacilities.map((facility) => {
            const checked = facility.id in selected;
            return (
              <div
                key={facility.id}
                className={`relative flex flex-col items-center gap-2 rounded-2xl border p-3 transition-colors ${
                  checked
                    ? 'border-indigo-300 bg-indigo-50/60'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <button type="button" onClick={() => toggle(facility.id)} className="flex flex-col items-center gap-2 w-full">
                  {checked && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </span>
                  )}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      checked ? 'bg-indigo-100' : 'bg-gray-100'
                    }`}
                  >
                    <FacilityIcon
                      name={facility.name}
                      className={`w-6 h-6 ${checked ? 'text-indigo-600' : 'text-gray-500'}`}
                    />
                  </div>
                  <p className="text-xs font-medium text-gray-700 text-center leading-tight">{facility.name}</p>
                </button>

                {checked && (
                  <RupeeInput
                    value={selected[facility.id]}
                    onChange={(v) => setSelected((prev) => ({ ...prev, [facility.id]: v }))}
                    placeholder="0 = free"
                    className="w-full text-center"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">Could not save facilities.</p>}

      <div className="fixed bottom-16 md:bottom-4 inset-x-0 px-4 md:px-0 md:static">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700 disabled:opacity-50 shadow-lg md:shadow-none"
          >
            {isSaving ? 'Saving…' : 'Save Facilities'}
          </button>
        </div>
      </div>
    </div>
  );
}
