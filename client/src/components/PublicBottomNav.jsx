import { NavLink } from 'react-router-dom';
import { Home, Building2 } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/libraries', label: 'Library', icon: Building2 },
];

export default function PublicBottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex justify-around py-1.5 z-20">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => (isActive ? 'text-indigo-600' : 'text-gray-400')}
        >
          <span className="flex flex-col items-center gap-0.5 text-[11px] font-medium px-6 py-1">
            <item.icon className="w-5 h-5" strokeWidth={1.75} />
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
