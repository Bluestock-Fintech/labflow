import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useRegisterMutation, useLoginMutation, useCreateLibraryMutation } from '../../app/api';
import { setCredentials } from './authSlice';
import IndianMobileInput from '../../components/IndianMobileInput';
import BrandLogo from '../../components/BrandLogo';
import AuthTabs from './AuthTabs';

export default function RegisterPage() {
  const [role, setRole] = useState('LIBRARY_OWNER');
  const [form, setForm] = useState({ libraryName: '', name: '', email: '', mobile: '', password: '' });
  const [register, { isLoading: isRegistering, error: registerError }] = useRegisterMutation();
  const [login] = useLoginMutation();
  const [createLibrary, { isLoading: isCreatingLibrary, error: libraryError }] = useCreateLibraryMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isOwner = role === 'LIBRARY_OWNER';
  const isLoading = isRegistering || isCreatingLibrary;
  const error = registerError || libraryError;

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await register({
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        password: form.password,
        role,
      }).unwrap();

      const { user, token } = (await login({ email: form.email, password: form.password }).unwrap()).data;
      dispatch(setCredentials({ user, token }));

      if (isOwner) {
        await createLibrary({ name: form.libraryName, mobile: form.mobile, email: form.email }).unwrap();
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch {
      // error surfaced below
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <BrandLogo className="h-8 w-auto" />
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">
            {isOwner ? 'Register your Library' : 'Create your account'}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {isOwner ? 'Create your library owner account' : 'Find and book seats at libraries near you'}
          </p>

          <AuthTabs value={role} onChange={setRole} />

          <form onSubmit={handleSubmit} className="space-y-4">
            {isOwner && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Library name</label>
                <input
                  value={form.libraryName}
                  onChange={update('libraryName')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isOwner ? 'Owner name' : 'Your name'}
              </label>
              <input
                value={form.name}
                onChange={update('name')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
              <IndianMobileInput
                value={form.mobile}
                onChange={(mobile) => setForm((f) => ({ ...f, mobile }))}
              />
            </div>
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
                {error.data?.error?.message || 'Registration failed.'}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating account…' : isOwner ? 'Register as Library' : 'Create account'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 hover:underline">
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
