import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { logout } from '../auth/authSlice';

export default function CustomerProfilePage() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function handleLogout() {
    dispatch(logout());
    navigate('/');
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Profile</p>
        <h1 className="text-lg font-semibold text-gray-900">{user?.name}</h1>
        <p className="text-sm text-gray-500">{user?.email}</p>
        <p className="text-sm text-gray-500">{user?.mobile}</p>
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium py-2.5 hover:bg-red-50"
      >
        <LogOut className="w-4 h-4" strokeWidth={1.75} />
        Log out
      </button>
    </div>
  );
}
