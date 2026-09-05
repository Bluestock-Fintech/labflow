import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Home, Building2, Armchair, ClipboardList, Users, User, Settings, Images, Menu, X, LogOut } from 'lucide-react';
import { logout } from '../features/auth/authSlice';
import { OwnerLayoutChromeContext } from './OwnerLayoutChrome';
import BrandLogo from '../components/BrandLogo';

const PRIMARY_NAV = [
  { to: '/dashboard', label: 'Home', icon: Home, end: true },
  { to: '/dashboard/floors', label: 'Floors', icon: Building2 },
  { to: '/dashboard/seat-map', label: 'Seat Map', icon: Armchair },
  { to: '/dashboard/orders', label: 'Orders', icon: ClipboardList },
  { to: '/dashboard/customers', label: 'Customers', icon: Users },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
];

const MORE_NAV = [
  { to: '/dashboard/facilities', label: 'Common Facilities', icon: Settings },
  { to: '/dashboard/photos', label: 'Photos', icon: Images },
];

function NavIcon({ icon: Icon, label, className }) {
  return (
    <span className={className}>
      <Icon className="w-5 h-5" strokeWidth={1.75} />
      <span>{label}</span>
    </span>
  );
}

export default function OwnerLayout() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hideMobileHeader, setHideMobileHeader] = useState(false);

  function handleLogout() {
    dispatch(logout());
    navigate('/login');
  }

  return (
    <OwnerLayoutChromeContext.Provider value={setHideMobileHeader}>
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 bg-white border-r border-gray-200">
        <div className="px-4 py-4 flex items-center gap-2 border-b border-gray-200">
          <BrandLogo className="h-7 w-auto" />
        </div>
        <nav className="flex-1 px-2 py-3 space-y-1">
          {PRIMARY_NAV.map((item) => (
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

          <p className="px-3 pt-4 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            More
          </p>
          {MORE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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
        <div className="px-4 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">Signed in as</p>
          <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
          <button onClick={handleLogout} className="mt-2 text-xs text-red-600 hover:underline">
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {!hideMobileHeader && (
          <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
            <BrandLogo className="h-7 w-auto" />
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="text-gray-500 p-1 -mr-1"
            >
              <Menu className="w-6 h-6" strokeWidth={1.75} />
            </button>
          </header>
        )}

        {hideMobileHeader && (
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="md:hidden fixed top-3 right-3 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 text-gray-500 flex items-center justify-center"
          >
            <Menu className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </button>
        )}

        <main className="flex-1 pb-20 md:pb-0">
          <Outlet />
        </main>

        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex justify-around py-1.5 z-10">
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (
                isActive ? 'text-indigo-600' : 'text-gray-400'
              )}
            >
              <NavIcon icon={item.icon} label={item.label} className="flex flex-col items-center gap-0.5 text-[11px] font-medium px-3 py-1" />
            </NavLink>
          ))}
        </nav>
      </div>

      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-20">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white shadow-xl flex flex-col animate-[slideIn_0.2s_ease-out]">
            <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-gray-400 px-2">
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            <nav className="flex-1 px-2 py-3 space-y-1">
              {MORE_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="px-4 py-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium py-2.5 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </OwnerLayoutChromeContext.Provider>
  );
}
