import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Shield, Mail, Lock, Activity } from 'lucide-react';

const Login = ({ onToggleView }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-brand-bg px-4 py-12">
      <div class="max-w-md w-full bg-white border border-slate-100 shadow-xl rounded-3xl p-8 text-center animate-in fade-in duration-300">
        
        {/* Brand header */}
        <div class="flex flex-col items-center mb-8">
          <div class="p-3 bg-amber-500 rounded-2xl text-white shadow-md shadow-amber-200 mb-3 animate-bounce">
            <Activity class="h-8 w-8" />
          </div>
          <h2 class="font-extrabold text-3xl tracking-tight text-brand-navy">
            Resq<span class="text-amber-500">Net</span>
          </h2>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
            Real-Time AI Response Platform
          </p>
        </div>

        {error && (
          <div class="mb-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl p-3 text-xs font-bold text-left flex items-center gap-2">
            <Shield class="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} class="space-y-5">
          <div class="text-left">
            <label class="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">Email Address</label>
            <div class="relative">
              <Mail class="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-amber-400 focus:bg-white transition"
                placeholder="doctor@example.com"
              />
            </div>
          </div>

          <div class="text-left">
            <label class="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">Password</label>
            <div class="relative">
              <Lock class="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-amber-400 focus:bg-white transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            class="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div class="mt-6 text-center text-xs">
          <span class="text-slate-400 font-medium">New coordinator or responder? </span>
          <button
            onClick={onToggleView}
            class="text-amber-500 hover:text-amber-600 font-extrabold transition"
          >
            Create account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
