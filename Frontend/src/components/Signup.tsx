import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ChevronRight, Lock, UserPlus } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-[#0f1117] overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-purple-600/5 blur-[160px] rounded-full animate-pulse-slow" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-8">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-blue-600/10 rounded-3xl mx-auto flex items-center justify-center border border-blue-500/20 shadow-2xl shadow-blue-500/10 active:scale-95 transition-transform duration-500 group">
             <UserPlus size={40} className="text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white brand-font tracking-tighter uppercase">
              Cascade<span className="text-blue-500">Net</span>
            </h1>
            <p className="text-gray-500 text-xs font-black tracking-[0.2em] uppercase mt-2">Resource Registration Portal</p>
          </div>
        </div>

        <form onSubmit={handleSignup} className="glass-card p-10 rounded-[2.5rem] shadow-2xl space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Department / Role</label>
              <select
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
              >
                {roles.map(r => (
                  <option key={r} value={r} className="bg-[#1e293b] text-white">{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Email</label>
              <input
                type="email"
                placeholder="name@agency.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secure Passphrase</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.15em] transition-all duration-300 shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            Create Account <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="text-center pt-2">
            <Link to="/" className="text-xs font-bold text-gray-500 hover:text-blue-400 transition-colors uppercase tracking-widest">
              Already Registered? Sign In
            </Link>
          </div>
        </form>

        <div className="flex items-center justify-center gap-4 text-gray-800">
           <div className="h-px w-8 bg-gray-800" />
           <div className="flex items-center gap-1.5 opacity-50">
             <Lock size={12} />
             <span className="text-[9px] font-black uppercase tracking-tighter text-gray-500">SECURE REGISTRATION CHANNEL</span>
           </div>
           <div className="h-px w-8 bg-gray-800" />
        </div>
      </div>
    </div>
  );
}
