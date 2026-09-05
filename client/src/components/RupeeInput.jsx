export default function RupeeInput({ value, onChange, placeholder, className = '', required = false, min = 0 }) {
  return (
    <div className={`flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 ${className}`}>
      <span className="flex items-center px-3 bg-gray-50 border-r border-gray-300 text-sm text-gray-600 select-none">
        ₹
      </span>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 text-sm focus:outline-none"
      />
    </div>
  );
}
