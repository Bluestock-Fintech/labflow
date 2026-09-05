import { useState } from 'react';
import { useCreateOrderMutation } from '../../app/api';
import IndianMobileInput from '../../components/IndianMobileInput';

export const DURATION_PRESETS = ['15 Days', '1 Month', '2 Months', '3 Months', 'Custom'];

export default function NewOrderForm({ library, floors, onClose, initial, bare = false }) {
  const [floorId, setFloorId] = useState(floors[0]?.id ?? '');
  const [seatId, setSeatId] = useState('');
  const [customerName, setCustomerName] = useState(initial?.customer_name ?? '');
  const [customerEmail, setCustomerEmail] = useState(initial?.customer_email ?? '');
  const [customerMobile, setCustomerMobile] = useState(initial?.customer_mobile ?? '');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [seatType, setSeatType] = useState('FULL_TIME');
  const [durationLabel, setDurationLabel] = useState('1 Month');
  const [customDays, setCustomDays] = useState('30');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [createOrder, { isLoading, error }] = useCreateOrderMutation();

  const floor = floors.find((f) => f.id === floorId);
  const availableSeats = (floor?.seats ?? []).filter((s) => s.status === 'AVAILABLE');
  const presets = seatType === 'HALF_TIME' ? floor?.pricing.half_presets : floor?.pricing.presets;
  const preset = presets?.find((p) => p.label === durationLabel);
  const durationDays = durationLabel === 'Custom' ? Number(customDays) || 0 : preset?.value * (preset?.kind === 'MONTHS' ? 30 : 1);
  const perDayRate = seatType === 'HALF_TIME' ? floor?.pricing.per_chair_half_per_day_price : floor?.pricing.per_chair_per_day_price;
  const amount = durationLabel === 'Custom'
    ? Math.round((perDayRate ?? 0) * durationDays * 100) / 100
    : preset?.total ?? 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!floorId || !seatId) return;
    try {
      await createOrder({
        libraryId: library.id,
        floor_id: floorId,
        seat_id: seatId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_mobile: customerMobile,
        start_date: startDate,
        duration_label: durationLabel,
        duration_days: durationDays,
        payment_method: paymentMethod,
        seat_type: seatType,
      }).unwrap();
      onClose();
    } catch {
      // error surfaced below
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={bare ? 'space-y-4' : 'bg-white rounded-2xl border border-gray-200 p-4 space-y-4'}
    >
      {!bare && (
        <h3 className="font-medium text-gray-900">{initial ? `Rejoin — ${initial.customer_name}` : 'New Order'}</h3>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
          <select
            value={floorId}
            onChange={(e) => { setFloorId(e.target.value); setSeatId(''); }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
            required
          >
            <option value="" disabled>Select floor</option>
            {floors.map((f) => (
              <option key={f.id} value={f.id}>{f.floor_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Seat</label>
          <select
            value={seatId}
            onChange={(e) => setSeatId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
            required
          >
            <option value="" disabled>
              {availableSeats.length ? 'Select seat' : 'No available seats'}
            </option>
            {availableSeats.map((s) => (
              <option key={s.id} value={s.id}>{s.seat_code}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer name</label>
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
        <IndianMobileInput value={customerMobile} onChange={setCustomerMobile} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          required
        />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Seat type</p>
        <div className="flex gap-2">
          {[
            { id: 'FULL_TIME', label: 'Full Day' },
            { id: 'HALF_TIME', label: 'Half Day' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSeatType(t.id)}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium ${
                seatType === t.id ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Order/start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
          <select
            value={durationLabel}
            onChange={(e) => setDurationLabel(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
          >
            {DURATION_PRESETS.map((label) => (
              <option key={label} value={label}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {durationLabel === 'Custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of days</label>
          <input
            type="number"
            min="1"
            value={customDays}
            onChange={(e) => setCustomDays(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Payment method</p>
        <div className="flex gap-2">
          {['CASH', 'ONLINE'].map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium ${
                paymentMethod === method ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-600'
              }`}
            >
              {method === 'CASH' ? 'Cash' : 'Online'}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 flex items-center justify-between">
        <span className="text-sm text-gray-600">Amount</span>
        <span className="text-lg font-semibold text-gray-900">₹{(amount || 0).toFixed(0)}</span>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error.data?.error?.message || 'Could not create order.'}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium py-2.5"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !seatId}
          className="flex-1 rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 disabled:opacity-50"
        >
          {isLoading ? 'Creating…' : 'Create Order'}
        </button>
      </div>
    </form>
  );
}
