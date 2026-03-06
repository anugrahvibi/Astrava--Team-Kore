import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { NdrfDashboard } from './dashboards/NdrfDashboard';
import { DamOperatorDashboard } from './dashboards/DamOperatorDashboard';
import { DistrictAdminDashboard } from './dashboards/DistrictAdminDashboard';
import { PublicPortal } from './dashboards/PublicPortal';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { LogOut, Shield } from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';
import type { Role } from './AuthContext';
import React from 'react';
import { HighwayDepartmentDashboard } from './dashboards/HighwayDepartmentDashboard';

function Navigation() {
  const location = useLocation();
  const { role, logout } = useAuth();
  const isAuthPage = location.pathname === '/' || location.pathname === '/signup' || location.pathname === '/login';

  if (isAuthPage) return null;

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl h-16 rounded-2xl glass-card flex items-center justify-between px-8 z-50 shadow-xl border border-white/40 active:scale-[0.99] transition-all duration-300">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Shield className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-black tracking-tight text-gray-900 uppercase brand-font">
            Cascade<span className="text-blue-600">Net</span>
          </h1>
        </div>
      </div>
      <div className="flex gap-4 items-center">
        <div className="hidden md:flex flex-col items-end mr-2 text-right">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Authenticated As</span>
          <span className="text-sm font-bold text-gray-700">{role} Access</span>
        </div>
        <button 
          onClick={logout} 
          className="flex items-center gap-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase transition-all duration-300 border border-red-200 active:scale-95"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode, allowedRole: Role }) {
  const { role } = useAuth();
  if (role !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  if (role === 'Dam Controller') return <Navigate to="/dam" replace />;
  if (role === 'NDRF') return <Navigate to="/ndrf" replace />;
  if (role === 'District Collector') return <Navigate to="/admin" replace />;
  if (role === 'Highway Department') return <Navigate to="/highway" replace />;
  if (role === 'Public') return <Navigate to="/public" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { role } = useAuth();
  
  return (
    <div className="h-screen w-screen bg-[#f8fafc] text-gray-900 flex flex-col overflow-hidden relative font-sans">
      {/* Dynamic ambient backgrounds */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      {role && <Navigation />}

      <main className={`flex-1 w-full h-full relative z-10 overflow-hidden ${role ? 'pt-24' : ''}`}>
        <Routes>
          <Route path="/" element={<AuthRedirect><Login /></AuthRedirect>} />
          <Route path="/signup" element={<AuthRedirect><Signup /></AuthRedirect>} />
          <Route path="/ndrf" element={<ProtectedRoute allowedRole="NDRF"><NdrfDashboard /></ProtectedRoute>} />
          <Route path="/dam" element={<ProtectedRoute allowedRole="Dam Controller"><DamOperatorDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRole="District Collector"><DistrictAdminDashboard /></ProtectedRoute>} />
          <Route path="/highway" element={<ProtectedRoute allowedRole="Highway Department"><HighwayDepartmentDashboard /></ProtectedRoute>} />
          <Route path="/public" element={<ProtectedRoute allowedRole="Public"><PublicPortal /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
