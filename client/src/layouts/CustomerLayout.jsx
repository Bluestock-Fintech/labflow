import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Home, BookOpen, ClipboardList, Bell, User, LogOut } from 'lucide-react';
import { logout } from '../features/auth/authSlice';
import BrandLogo from '../components/BrandLogo';

const NAV_ITEMS = [
  { to: '/customer/home', label: 'Home', icon: Home, end: true },
  { to: '/customer/enrolled', label: 'Enrolled', icon: BookOpen },
  { to: '/customer/orders', label: 'Orders', icon: ClipboardList },
  { to: '/customer/notifications', label: 'Notification', icon: Bell },
  { to: '/customer/profile', label: 'Profile', icon: User },
];

export default function CustomerLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function handleLogout() {
    dispatch(logout());
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
        <div className="px-4 py-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium py-2 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.75} />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <BrandLogo className="h-7 w-auto" />
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-gray-500">
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
            Log out
          </button>
        </header>

        <main className="flex-1 pb-20 md:pb-0">
          <Outlet />
        </main>

        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex justify-around py-1.5 z-10">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'text-indigo-600' : 'text-gray-400')}
            >
              <span className="flex flex-col items-center gap-0.5 text-[11px] font-medium px-2.5 py-1">
                <item.icon className="w-5 h-5" strokeWidth={1.75} />
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
