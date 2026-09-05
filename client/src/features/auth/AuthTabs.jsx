const TABS = [
  { value: 'LIBRARY_OWNER', label: 'Library Owner' },
  { value: 'CUSTOMER', label: 'Library User' },
];

export default function AuthTabs({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 rounded-lg bg-gray-100 p-1 mb-6">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`rounded-md py-2 text-sm font-medium transition-colors ${
            value === tab.value
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
