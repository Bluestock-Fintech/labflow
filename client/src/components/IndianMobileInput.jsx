export default function IndianMobileInput({ value, onChange, required = true }) {
  function handleChange(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(digits);
  }

  return (
    <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
      <span className="flex items-center gap-1.5 px-3 bg-gray-50 border-r border-gray-300 text-sm text-gray-600 select-none">
        <span role="img" aria-label="India flag">🇮🇳</span>
        +91
      </span>
      <input
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        placeholder="10-digit mobile number"
        pattern="[0-9]{10}"
        maxLength={10}
        required={required}
        className="w-full px-3 py-2 text-sm focus:outline-none"
      />
    </div>
  );
}
