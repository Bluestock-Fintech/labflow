import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Building2, LogIn, UserPlus, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import BrandLogo from './BrandLogo';

const APP_VERSION = '1.01';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/libraries', label: 'View Libraries', icon: Building2 },
  { to: '/login', label: 'Login', icon: LogIn },
  { to: '/register', label: 'Register as Library', icon: UserPlus },
];

const COLLAPSE_KEY = 'labflow_sidebar_collapsed';

export default function PublicSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });

  function toggle(next) {
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
    } catch {
      // ignore write failures
    }
  }

  if (collapsed) {
    return (
      <div className="hidden md:flex md:flex-col md:w-12 md:shrink-0 bg-white border-r border-gray-200 items-center pt-4">
        <button
          onClick={() => toggle(false)}
          aria-label="Open sidebar"
          className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100"
        >
          <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.75} />
        </button>
      </div>
    );
  }

  return (
    <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 bg-white border-r border-gray-200">
      <div className="px-4 py-4 flex items-center justify-between gap-2 border-b border-gray-200">
        <BrandLogo className="h-7 w-auto" />
        <button
          onClick={() => toggle(true)}
          aria-label="Close sidebar"
          className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 shrink-0"
        >
          <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.75} />
        </button>
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
