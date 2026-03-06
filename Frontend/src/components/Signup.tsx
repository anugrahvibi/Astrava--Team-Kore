import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '../AuthContext';
import type { Role } from '../AuthContext';

export function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Public');

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.removeItem('registered_role');
    if (login(role as Role)) {
      if (role === 'NDRF') navigate('/ndrf');
      else if (role === 'Dam Controller') navigate('/dam');
      else if (role === 'District Collector') navigate('/admin');
      else if (role === 'Highway Department') navigate('/highway');
      else navigate('/public');
    }
  };

  const roles = ['Dam Controller', 'NDRF', 'District Collector', 'Highway Department', 'Public'];

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative bg-[#f8fafc] overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-blue-600/5 blur-[160px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
           <div className="w-20 h-20 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/20 border border-blue-100 active:scale-95 transition-transform duration-500 group">
             <img src="/logo.svg" alt="CascadeNet logo" className="w-12 h-12 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-5xl font-black text-gray-900 brand-font tracking-tighter leading-none">
              <span className="wave-underline">Cascade</span><span className="text-blue-600 ending-serif">Net</span>
            </h1>
            <p className="text-gray-400 text-[10px] font-black tracking-[0.3em] uppercase mt-3">Advanced Intelligence & Response</p>
          </div>
        </div>

        <form onSubmit={handleSignup} className="glass-card p-10 rounded-[3rem] shadow-xl border-white/60 bg-white/70 space-y-6 premium-shadow">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 tracking-normal ml-1">Departmental profile</label>
              <div className="relative">
                <select
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm text-gray-900 focus:outline-none focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer shadow-sm"
                >
                  {roles.map(r => (
                    <option key={r} value={r} className="bg-white text-gray-900">{r}</option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <ChevronRight size={16} className="rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 tracking-normal ml-1">Official identifier</label>
              <input
                type="email"
                placeholder="name@agency.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 tracking-normal ml-1">Secure keyphrase</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4.5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all duration-300 shadow-xl shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-3 group"
          >
            Create Clearance <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="text-center pt-2">
            <Link to="/" className="text-[10px] font-black text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-[0.15em]">
              Already Authenticated? Sign In
            </Link>
          </div>
        </form>

        <div className="flex items-center justify-center gap-4">
           <div className="h-px w-8 bg-gray-200" />
           <div className="flex items-center gap-2">
             <Lock size={12} className="text-gray-300" />
             <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Secure Enrollment Socket</span>
           </div>
           <div className="h-px w-8 bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
