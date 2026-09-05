import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useLoginMutation } from '../../app/api';
import { setCredentials } from './authSlice';
import BrandLogo from '../../components/BrandLogo';
import AuthTabs from './AuthTabs';

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export default function LoginPage() {
  const [role, setRole] = useState('LIBRARY_OWNER');
  const [email, setEmail] = useState(isLocalhost ? 'admin@labflow.local' : '');
  const [password, setPassword] = useState(isLocalhost ? 'Admin@123' : '');
  const [login, { isLoading, error }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setCredentials(result.data));
      const role = result.data.user.role;
      navigate(role === 'SUPER_ADMIN' ? '/admin' : role === 'CUSTOMER' ? '/customer/home' : '/dashboard');
    } catch {
      // error is surfaced via `error` state below
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <BrandLogo className="h-8 w-auto" />
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>

          <AuthTabs value={role} onChange={setRole} />

          {isLocalhost && role === 'LIBRARY_OWNER' && (
            <div className="mb-4 text-xs rounded-lg bg-amber-50 text-amber-700 border border-amber-200 px-3 py-2">
              Dev mode — admin credentials prefilled.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">
                {error.data?.error?.message || 'Login failed.'}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Signing in…' : role === 'LIBRARY_OWNER' ? 'Login as Library Owner' : 'Login as Library User'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-indigo-600 hover:underline">
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
