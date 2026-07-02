import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineLockClosed, HiOutlineUser, HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import { TbScan } from 'react-icons/tb';
import { login } from '../api/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await login(username, password);
      localStorage.setItem('attendease_token', res.data.access_token);
      localStorage.setItem('attendease_user', res.data.username);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-400/20">
            <TbScan className="text-white text-3xl" />
          </div>
          <h1 className="text-2xl font-display font-bold gradient-text mb-1">
            Admin Login
          </h1>
          <p className="text-sm text-gray-500">
            Sign in to access the admin dashboard
          </p>
        </div>

        {/* Login Form */}
        <div className="glass-card p-6 md:p-8 animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 animate-fade-in">
                {error}
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">
                Username
              </label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="input-field pl-10"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">
                Password
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="input-field pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <HiOutlineEyeSlash className="text-lg" />
                  ) : (
                    <HiOutlineEye className="text-lg" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <HiOutlineLockClosed className="text-lg" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Default credentials hint */}
          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-xs text-gray-600 text-center">
              Default: <span className="text-gray-500">admin</span> /{' '}
              <span className="text-gray-500">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
