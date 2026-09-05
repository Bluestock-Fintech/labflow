import { NavLink } from 'react-router-dom';
import { Home, Building2, LogIn, UserPlus } from 'lucide-react';
import BrandLogo from './BrandLogo';

const APP_VERSION = '1.01';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/libraries', label: 'View Libraries', icon: Building2 },
  { to: '/login', label: 'Login', icon: LogIn },
  { to: '/register', label: 'Register as Library', icon: UserPlus },
];

export default function PublicSidebar() {
  return (
    <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 bg-white border-r border-gray-200">
      <div className="px-4 py-4 flex items-center gap-2 border-b border-gray-200">
        <BrandLogo className="h-7 w-auto" />
      </div>
      <nav className="flex-1 px-2 py-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-gray-200">
        <p className="text-[11px] text-gray-400">Version {APP_VERSION}</p>
      </div>
    </aside>
  );
}
