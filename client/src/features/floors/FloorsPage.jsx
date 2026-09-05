import { useMemo, useState } from 'react';
import {
  useGetFacilitiesQuery,
  useGetFloorsQuery,
  useCreateFloorMutation,
  useUpdateFloorMutation,
  useDeleteFloorMutation,
} from '../../app/api';
import { useOwnerLibrary } from '../libraries/useOwnerLibrary';
import RupeeInput from '../../components/RupeeInput';
import InfoTooltip from '../../components/InfoTooltip';
import SeatLayoutBuilder from './SeatLayoutBuilder';
import { useHideMobileHeader } from '../../layouts/OwnerLayoutChrome';
import { Skeleton, SkeletonList } from '../../components/Skeleton';

const MAX_FLOORS = 10;

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const FLOOR_NAME_OPTIONS = [
  'Basement',
  'Ground',
  ...Array.from({ length: 9 }, (_, i) => `${ordinal(i + 1)} Floor`),
  'Other',
];

function emptyCustomFacility() {
  return { key: crypto.randomUUID(), custom_name: '', price: '' };
}

export default function FloorsPage() {
  const { library, isLoading: libraryLoading } = useOwnerLibrary();
  const { data: facilitiesData } = useGetFacilitiesQuery();
  const {
    data: floorsData,
    isLoading: floorsLoading,
  } = useGetFloorsQuery(library?.id, { skip: !library });
  const [createFloor, { isLoading: isCreating, error: createError }] = useCreateFloorMutation();
  const [updateFloor, { isLoading: isUpdating, error: updateError }] = useUpdateFloorMutation();
  const [deleteFloor] = useDeleteFloorMutation();
  const [deleteHint, setDeleteHint] = useState(null);

  async function handleDeleteFloor(floor) {
    if (floor.status !== 'DRAFT') {
      setDeleteHint(floor.id);
      return;
    }
    if (!window.confirm(`Delete "${floor.floor_name}"? This can't be undone.`)) return;
    try {
      await deleteFloor({ libraryId: library.id, floorId: floor.id }).unwrap();
    } catch (err) {
      alert(err?.data?.error?.message || 'Could not delete this floor.');
    }
  }

  const masterFacilities = (facilitiesData?.data ?? []).filter((f) => f.default_scope === 'FLOOR');
  const floors = floorsData?.data ?? [];

  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState('');
  const [form, setForm] = useState({
    floor_name: '',
    total_seats: '',
    full_time_price: '',
    half_time_price: '',
  });
  const [halfTimeTouched, setHalfTimeTouched] = useState(false);
  const [floorNameChoice, setFloorNameChoice] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState({}); // facility_id -> price string
  const [customFacilities, setCustomFacilities] = useState([]);
  const [layoutConfig, setLayoutConfig] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFloor, setEditingFloor] = useState(null);
  const isSaving = isCreating || isUpdating;
  const saveError = createError || updateError;

  useHideMobileHeader(showForm);

  const facilitiesTotal = useMemo(() => {
    const fromMaster = Object.values(selectedFacilities).reduce(
      (sum, p) => sum + (Number(p) || 0),
      0
    );
    const fromCustom = customFacilities.reduce((sum, f) => sum + (Number(f.price) || 0), 0);
    return fromMaster + fromCustom;
  }, [selectedFacilities, customFacilities]);

  const baseFullTime = Number(form.full_time_price) || 0;
  const suggestedHalfTime = Math.round((baseFullTime / 2) * 100) / 100;
  const totalSeats = Number(form.total_seats) || 0;

  function updateFullTimePrice(value) {
    setForm((f) => {
      const next = { ...f, full_time_price: value };
      if (!halfTimeTouched) {
        const suggested = Math.round(((Number(value) || 0) / 2) * 100) / 100;
        next.half_time_price = suggested ? String(suggested) : '';
      }
      return next;
    });
  }

  function updateHalfTimePrice(value) {
    setHalfTimeTouched(true);
    setForm((f) => ({ ...f, half_time_price: value }));
  }

  const baseHalfTime = Number(form.half_time_price) || 0;
  const perChairFullTime = baseFullTime + facilitiesTotal;
  const perChairHalfTime = baseHalfTime + facilitiesTotal;
  const perChairPerDay = Math.round(((baseFullTime / 30) + facilitiesTotal / 30) * 100) / 100;

  function toggleFacility(facilityId) {
    setSelectedFacilities((prev) => {
      const next = { ...prev };
      if (facilityId in next) {
        delete next[facilityId];
      } else {
        next[facilityId] = '0';
      }
      return next;
    });
  }

  function updateFacilityPrice(facilityId, price) {
    setSelectedFacilities((prev) => ({ ...prev, [facilityId]: price }));
  }

  function addCustomFacility() {
    setCustomFacilities((prev) => [...prev, emptyCustomFacility()]);
  }

  function updateCustomFacility(key, field, value) {
    setCustomFacilities((prev) =>
      prev.map((f) => (f.key === key ? { ...f, [field]: value } : f))
    );
  }

  function removeCustomFacility(key) {
    setCustomFacilities((prev) => prev.filter((f) => f.key !== key));
  }

  function resetForm() {
    setForm({ floor_name: '', total_seats: '', full_time_price: '', half_time_price: '' });
    setHalfTimeTouched(false);
    setFloorNameChoice('');
    setSelectedFacilities({});
    setCustomFacilities([]);
    setLayoutConfig(null);
    setStep(1);
    setStepError('');
    setShowForm(false);
    setEditingFloor(null);
  }

  function openEditForm(floor) {
    setEditingFloor(floor);
    setForm({
      floor_name: floor.floor_name,
      total_seats: String(floor.total_seats),
      full_time_price: String(floor.full_time_price),
      half_time_price: String(floor.half_time_price),
    });
    setHalfTimeTouched(true);
    setFloorNameChoice(FLOOR_NAME_OPTIONS.includes(floor.floor_name) ? floor.floor_name : 'Other');

    const masterSelections = {};
    const customs = [];
    for (const f of floor.facilities ?? []) {
      if (f.facility_id) masterSelections[f.facility_id] = String(f.price);
      else customs.push({ key: crypto.randomUUID(), custom_name: f.name, price: String(f.price) });
    }
    setSelectedFacilities(masterSelections);
    setCustomFacilities(customs);
    setLayoutConfig(floor.layout_config ?? null);
    setStep(1);
    setStepError('');
    setShowForm(true);
  }

  function goToLayoutStep() {
    if (!form.floor_name.trim()) {
      setStepError('Choose a floor name first.');
      return;
    }
    if (!totalSeats || totalSeats < 1) {
      setStepError('Enter the total number of seats.');
      return;
    }
    if (!baseFullTime) {
      setStepError('Enter the monthly price.');
      return;
    }
    setStepError('');
    setStep(2);
  }

  async function handleSubmit(status) {
    if (!library) return;

    const facilities = [
      ...Object.entries(selectedFacilities).map(([facility_id, price]) => ({
        facility_id,
        price: Number(price) || 0,
      })),
      ...customFacilities
        .filter((f) => f.custom_name.trim())
        .map((f) => ({ custom_name: f.custom_name.trim(), price: Number(f.price) || 0 })),
    ];

    try {
      if (editingFloor) {
        await updateFloor({
          libraryId: library.id,
          floorId: editingFloor.id,
          floor_name: form.floor_name,
          total_seats: totalSeats,
          full_time_price: Number(form.full_time_price),
          half_time_price: Number(form.half_time_price),
          facilities,
          layout_config: layoutConfig,
          status,
        }).unwrap();
      } else {
        await createFloor({
          libraryId: library.id,
          floor_name: form.floor_name,
          total_seats: totalSeats,
          full_time_price: Number(form.full_time_price),
          half_time_price: Number(form.half_time_price),
          facilities,
          layout_config: layoutConfig,
          status,
        }).unwrap();
      }
      resetForm();
    } catch {
      // error surfaced below
    }
  }

  if (libraryLoading) {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <SkeletonList count={2} />
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

  const floorLimitReached = floors.length >= MAX_FLOORS;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Floors</h1>
          <p className="text-sm text-gray-500">{floors.length} / {MAX_FLOORS} floors</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            disabled={floorLimitReached}
            className="rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 disabled:opacity-40"
          >
            + Add Floor
          </button>
        )}
      </div>

      {floorLimitReached && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Maximum of {MAX_FLOORS} floors reached for this library.
        </p>
      )}

      {showForm && (
        <div className="fixed inset-0 z-30 flex items-end md:items-center md:justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={resetForm} />
          <div className="relative w-full md:max-w-lg bg-white rounded-t-2xl md:rounded-2xl shadow-xl h-full md:h-auto md:max-h-[85vh] flex flex-col animate-[slideUp_0.25s_ease-out] md:animate-none">
            <div className="flex justify-center pt-2 pb-1 md:hidden shrink-0">
              <span className="w-10 h-1.5 rounded-full bg-gray-300" />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
            <span className={step === 1 ? 'text-indigo-600' : ''}>1. Details</span>
            <span>→</span>
            <span className={step === 2 ? 'text-indigo-600' : ''}>2. Seat Layout</span>
            <span>→</span>
            <span className={step === 3 ? 'text-indigo-600' : ''}>3. Review</span>
          </div>

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor name</label>
                  <select
                    value={floorNameChoice}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFloorNameChoice(value);
                      setForm((f) => ({ ...f, floor_name: value === 'Other' ? '' : value }));
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    required
                  >
                    <option value="" disabled>Select a floor</option>
                    {FLOOR_NAME_OPTIONS.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  {floorNameChoice === 'Other' && (
                    <input
                      value={form.floor_name}
                      onChange={(e) => setForm((f) => ({ ...f, floor_name: e.target.value }))}
                      placeholder="Enter floor name"
                      className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                    Total seats
                    <InfoTooltip text="You can change this later too. Changing it only affects new orders — existing bookings keep their seat. Reducing removes the highest-numbered seats." />
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.total_seats}
                    onChange={(e) => setForm((f) => ({ ...f, total_seats: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly price (₹)</label>
                  <RupeeInput
                    value={form.full_time_price}
                    onChange={updateFullTimePrice}
                    placeholder="Price per chair, per month"
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                    Half-time price (₹)
                    <InfoTooltip text="Auto-filled from the monthly price — editable, and stays as you set it once changed." />
                  </label>
                  <RupeeInput
                    value={form.half_time_price}
                    onChange={updateHalfTimePrice}
                    placeholder={suggestedHalfTime ? String(suggestedHalfTime) : 'Auto-filled'}
                    required
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Premium facilities (optional)</p>
                <div className="space-y-2">
                  {masterFacilities.map((facility) => {
                    const checked = facility.id in selectedFacilities;
                    return (
                      <div key={facility.id} className="flex items-center gap-3">
                        <label className="flex items-center gap-2 flex-1 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleFacility(facility.id)}
                            className="rounded border-gray-300"
                          />
                          {facility.name}
                        </label>
                        {checked && (
                          <RupeeInput
                            value={selectedFacilities[facility.id]}
                            onChange={(v) => updateFacilityPrice(facility.id, v)}
                            placeholder="Price / chair"
                            className="w-36"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 space-y-2">
                  {customFacilities.map((f) => (
                    <div key={f.key} className="flex items-center gap-2">
                      <input
                        placeholder="Facility name"
                        value={f.custom_name}
                        onChange={(e) => updateCustomFacility(f.key, 'custom_name', e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <RupeeInput
                        value={f.price}
                        onChange={(v) => updateCustomFacility(f.key, 'price', v)}
                        placeholder="Price / chair"
                        className="w-36"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomFacility(f.key)}
                        className="text-gray-400 hover:text-red-600 text-sm px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addCustomFacility}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    + Add other facility
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Live per-chair price</p>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Base (full-time)</span>
                  <span>₹{baseFullTime.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>+ Facilities</span>
                  <span>₹{facilitiesTotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-gray-900 pt-1 border-t border-gray-200">
                  <span>Full-time / chair</span>
                  <span>₹{perChairFullTime.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-gray-900">
                  <span>Half-time / chair</span>
                  <span>₹{perChairHalfTime.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-gray-900">
                  <span>Per day / chair <span className="font-normal text-gray-400">(monthly ÷ 30)</span></span>
                  <span>₹{perChairPerDay.toFixed(0)}</span>
                </div>
              </div>

              {stepError && <p className="text-sm text-red-600">{stepError}</p>}
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">{form.floor_name}</span> · {totalSeats} seats
                </p>
              </div>

              <SeatLayoutBuilder
                totalSeats={totalSeats}
                value={layoutConfig}
                onChange={setLayoutConfig}
              />
            </>
          )}

          {step === 3 && (
            <>
              {editingFloor?.status === 'PUBLISHED' && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <strong>Heads up:</strong> this floor is live on your public page. Changes apply immediately —
                  existing customer bookings keep their original price, but new visitors will see the updated
                  pricing and layout right away.
                </p>
              )}

              <div className="rounded-xl border border-gray-200 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{form.floor_name}</h3>
                  <span className="text-xs text-gray-500">{totalSeats} seats</span>
                </div>
                <p className="text-xs text-gray-500">
                  Layout: {layoutConfig?.type === 'SPLIT' ? 'Split (Facing Aisle)' : layoutConfig?.type === 'VERTICAL' ? 'Vertical Rows' : 'Horizontal Rows'}
                  {' '}· {layoutConfig?.rows ?? 0} × {layoutConfig?.columns ?? 0} grid
                </p>
                {(selectedFacilities && Object.keys(selectedFacilities).length > 0) || customFacilities.some((f) => f.custom_name.trim()) ? (
                  <div className="flex flex-wrap gap-1.5">
                    {masterFacilities
                      .filter((f) => f.id in selectedFacilities)
                      .map((f) => (
                        <span key={f.id} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                          {f.name} · ₹{Number(selectedFacilities[f.id] || 0).toFixed(0)}
                        </span>
                      ))}
                    {customFacilities.filter((f) => f.custom_name.trim()).map((f) => (
                      <span key={f.key} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                        {f.custom_name} · ₹{Number(f.price || 0).toFixed(0)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Final pricing</p>
                <div className="flex justify-between text-sm font-semibold text-gray-900">
                  <span>Full-time / chair</span>
                  <span>₹{perChairFullTime.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-gray-900">
                  <span>Half-time / chair</span>
                  <span>₹{perChairHalfTime.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-gray-900">
                  <span>Per day / chair</span>
                  <span>₹{perChairPerDay.toFixed(0)}</span>
                </div>
              </div>

              {saveError && (
                <p className="text-sm text-red-600">
                  {saveError.data?.error?.message || 'Could not save floor.'}
                </p>
              )}
            </>
          )}
            </div>
            <div className="shrink-0 border-t border-gray-200 p-4 flex gap-2" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              {step === 1 && (
                <>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium py-2.5 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={goToLayoutStep}
                    className="flex-1 rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700"
                  >
                    Next: Seat Layout
                  </button>
                </>
              )}
              {step === 2 && (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-lg border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2.5 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700"
                  >
                    Next: Review
                  </button>
                </>
              )}
              {step === 3 && (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-lg border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2.5 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit('DRAFT')}
                    disabled={isSaving}
                    className="flex-1 rounded-lg border border-indigo-300 text-indigo-700 text-sm font-medium py-2.5 hover:bg-indigo-50 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving…' : 'Save as Draft'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit('PUBLISHED')}
                    disabled={isSaving}
                    className="flex-1 rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving…' : 'Publish Floor'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {floorsLoading ? (
        <SkeletonList count={2} />
      ) : (
        <div className="space-y-3">
          {floors.map((floor) => (
            <div key={floor.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{floor.floor_name}</h3>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    floor.status === 'PUBLISHED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {floor.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{floor.total_seats} seats</span>
                  <button
                    onClick={() => openEditForm(floor)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteFloor(floor)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {deleteHint === floor.id && floor.status !== 'DRAFT' && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                  Published floors can't be deleted. Change the status to Draft (edit the floor → Save as Draft) first.
                </p>
              )}
              {floor.facilities?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {floor.facilities.map((f) => (
                    <span key={f.id} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                      {f.name} · ₹{Number(f.price).toFixed(0)}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Full-time / chair</p>
                  <p className="font-semibold text-gray-900">₹{floor.pricing.per_chair_full_time_price.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Half-time / chair</p>
                  <p className="font-semibold text-gray-900">₹{floor.pricing.per_chair_half_time_price.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Per day / chair</p>
                  <p className="font-semibold text-gray-900">₹{floor.pricing.per_chair_per_day_price.toFixed(0)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
