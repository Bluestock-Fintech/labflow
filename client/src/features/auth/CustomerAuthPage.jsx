import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useLoginMutation, useRegisterMutation } from '../../app/api';
import { setCredentials } from './authSlice';
import BrandLogo from '../../components/BrandLogo';
import IndianMobileInput from '../../components/IndianMobileInput';

export default function CustomerAuthPage() {
  const [searchParams] = useSearchParams();
  const slug = searchParams.get('slug');
  const seatNumber = searchParams.get('seatNumber');
  const floorName = searchParams.get('floorName');

  const [mode, setMode] = useState('register'); // 'register' | 'login'
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' });

  const [register, { isLoading: isRegistering, error: registerError }] = useRegisterMutation();
  const [login, { isLoading: isLoggingIn, error: loginError }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isLoading = isRegistering || isLoggingIn;
  const error = mode === 'register' ? registerError : loginError;

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function backToLibrary() {
    navigate(slug ? `/l/${slug}` : '/customer/home');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (mode === 'register') {
        await register({
          name: form.name,
          email: form.email,
          mobile: form.mobile,
          password: form.password,
          role: 'CUSTOMER',
        }).unwrap();
      }

      const { user, token } = (
        await login({ email: form.email, password: form.password }).unwrap()
      ).data;
      dispatch(setCredentials({ user, token }));

      backToLibrary();
    } catch {
      // error surfaced below
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <BrandLogo className="h-8 w-auto mb-3" />

        {seatNumber && (
          <div className="mb-4 text-xs rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-2">
            Booking seat <span className="font-semibold">{seatNumber}</span>
            {floorName ? ` on ${floorName}` : ''} — sign in to continue.
          </div>
        )}

        <div className="flex rounded-lg bg-gray-100 p-1 mb-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 rounded-md py-1.5 transition-colors ${
              mode === 'register' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            }`}
          >
            New here
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded-md py-1.5 transition-colors ${
              mode === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            }`}
          >
            I have an account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                value={form.name}
                onChange={update('name')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={update('email')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
              <IndianMobileInput
                value={form.mobile}
                onChange={(mobile) => setForm((f) => ({ ...f, mobile }))}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={update('password')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              minLength={8}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error.data?.error?.message || (mode === 'register' ? 'Registration failed.' : 'Login failed.')}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? 'Please wait…' : mode === 'register' ? 'Create account & continue' : 'Sign in & continue'}
          </button>

          {slug && (
            <p className="text-center text-sm text-gray-500">
              <Link to={`/l/${slug}`} className="text-indigo-600 hover:underline">
                Back to library page
              </Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
