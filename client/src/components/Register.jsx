import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Shield, Mail, Lock, User, MapPin, Activity } from 'lucide-react';

const Register = ({ onToggleView }) => {
  const { register } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('volunteer');
  const [skills, setSkills] = useState([]);
  const [lng, setLng] = useState('72.8777'); // Default Mumbai Lng
  const [lat, setLat] = useState('19.0760'); // Default Mumbai Lat
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const availableSkills = ['paramedic', 'driver', 'rescue-diver', 'heavy-machinery', 'languages'];

  const handleSkillToggle = (skill) => {
    if (skills.includes(skill)) {
      setSkills(prev => prev.filter(s => s !== skill));
    } else {
      setSkills(prev => [...prev, skill]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const coordinates = [parseFloat(lng), parseFloat(lat)];
    const result = await register(name, email, password, role, skills, coordinates);
    setLoading(false);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-brand-bg px-4 py-12">
      <div class="max-w-md w-full bg-white border border-slate-100 shadow-xl rounded-3xl p-8 text-center animate-in fade-in duration-300">
        
        {/* Brand header */}
        <div class="flex flex-col items-center mb-6">
          <div class="p-3 bg-amber-500 rounded-2xl text-white shadow-md shadow-amber-200 mb-3 animate-bounce">
            <Activity class="h-8 w-8" />
          </div>
          <h2 class="font-extrabold text-3xl tracking-tight text-brand-navy">
            Create Account
          </h2>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
            Join the ResqNet Network
          </p>
        </div>

        {error && (
          <div class="mb-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl p-3 text-xs font-bold text-left flex items-center gap-2">
            <Shield class="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} class="space-y-4">
          <div class="text-left">
            <label class="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">Full Name</label>
            <div class="relative">
              <User class="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-amber-400 focus:bg-white transition"
                placeholder="John Doe"
              />
            </div>
          </div>

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
                placeholder="john@example.com"
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

          <div class="grid grid-cols-2 gap-3">
            <div class="text-left">
              <label class="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-amber-400 focus:bg-white transition"
              >
                <option value="volunteer">Volunteer</option>
                <option value="responder">Field Responder</option>
                <option value="victim">Victim / Citizen</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div class="text-left">
              <label class="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">Base Location</label>
              <div class="flex gap-1.5">
                <input
                  type="text"
                  required
                  placeholder="Lng"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  class="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-center text-xs text-slate-700 focus:outline-none focus:border-amber-400"
                />
                <input
                  type="text"
                  required
                  placeholder="Lat"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  class="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-center text-xs text-slate-700 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Select skills */}
          {role === 'volunteer' && (
            <div class="text-left">
              <label class="block text-[10px] uppercase font-extrabold text-slate-400 mb-1.5">Select Your Skills</label>
              <div class="flex flex-wrap gap-1.5">
                {availableSkills.map(skill => {
                  const selected = skills.includes(skill);
                  return (
                    <button
                      type="button"
                      key={skill}
                      onClick={() => handleSkillToggle(skill)}
                      class={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                        selected
                          ? 'bg-amber-100 border-amber-300 text-amber-700 font-extrabold'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {skill.replace('-', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            class="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div class="mt-4 text-center text-xs">
          <span class="text-slate-400 font-medium">Already have an account? </span>
          <button
            onClick={onToggleView}
            class="text-amber-500 hover:text-amber-600 font-extrabold transition"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
