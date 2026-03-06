import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ChevronRight, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Credentials required for clearance');
      return;
    }
    if (login()) {
      const userRole = localStorage.getItem('cascade_role');
      if (userRole === 'NDRF') navigate('/ndrf');
      else if (userRole === 'Dam Controller') navigate('/dam');
      else if (userRole === 'District Collector') navigate('/admin');
      else if (userRole === 'Highway Department') navigate('/highway');
      else navigate('/public');
    } else {
      setError('Authentication failed. Check access level.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-[#0f1117] overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-blue-600/5 blur-[160px] rounded-full animate-pulse-slow" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-8">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-blue-600/10 rounded-3xl mx-auto flex items-center justify-center border border-blue-500/20 shadow-2xl shadow-blue-500/10 active:scale-95 transition-transform duration-500 group">
             <Shield size={40} className="text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white brand-font tracking-tighter uppercase">
              Cascade<span className="text-blue-500">Net</span>
            </h1>
            <p className="text-gray-500 text-xs font-black tracking-[0.2em] uppercase mt-2">Intelligence & Response Portal</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="glass-card p-10 rounded-[2.5rem] shadow-2xl space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secure Identifier</label>
              <input
                type="email"
                placeholder="name@agency.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Access Token</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-xl text-xs font-bold border border-red-400/20 animate-in fade-in zoom-in duration-300">
               <AlertCircle size={16} /> {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.15em] transition-all duration-300 shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            Authenticate <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="text-center pt-2">
            <Link to="/signup" className="text-xs font-bold text-gray-500 hover:text-blue-400 transition-colors uppercase tracking-widest">
              Request New Credentials
            </Link>
          </div>
        </form>

        <div className="flex items-center justify-center gap-4 text-gray-800">
           <div className="h-px w-8 bg-gray-800" />
           <div className="flex items-center gap-1.5 opacity-50">
             <Lock size={12} />
             <span className="text-[9px] font-black uppercase tracking-tighter text-gray-500">E2E ENCRYPTED CHANNEL</span>
           </div>
           <div className="h-px w-8 bg-gray-800" />
        </div>
      </div>
    </div>
  );
}
