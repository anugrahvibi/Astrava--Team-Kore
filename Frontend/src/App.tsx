import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { NdrfDashboard } from './dashboards/NdrfDashboard';
import { DamOperatorDashboard } from './dashboards/DamOperatorDashboard';
import { DistrictAdminDashboard } from './dashboards/DistrictAdminDashboard';
import { PublicPortal } from './dashboards/PublicPortal';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';
import type { Role } from './AuthContext';

function Navigation() {
  const location = useLocation();
  const { role, logout } = useAuth();
  const isAuthPage = location.pathname === '/' || location.pathname === '/signup';

  if (isAuthPage) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 border-b bg-white border-gray-200 flex items-center justify-between px-6 z-50 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <span>CascadeNet</span>
        </h1>
      </div>
      <div className="flex gap-1 text-sm font-medium items-center">
        <span className="text-gray-500 mr-4 font-semibold uppercase tracking-wider text-[10px] bg-gray-100 px-3 py-1 rounded-full">{role}</span>
        <button onClick={logout} className="flex items-center gap-2 border-l border-gray-200 ml-2 pl-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors rounded-xl">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </nav>
  );
}

import React from 'react';

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode, allowedRole: Role }) {
  const { role } = useAuth();
  if (role !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

import { HighwayDepartmentDashboard } from './dashboards/HighwayDepartmentDashboard';

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
  return (
    <div className="h-screen w-screen bg-gray-50 text-gray-900 flex flex-col overflow-hidden" style={{ fontFamily: 'Verdana, sans-serif' }}>
      <Navigation />
      <main className="flex-1 mt-0 relative flex flex-col">
        <Routes>
          <Route path="/" element={<AuthRedirect><Login /></AuthRedirect>} />
          <Route path="/signup" element={<AuthRedirect><Signup /></AuthRedirect>} />
          <Route path="/ndrf" element={<ProtectedRoute allowedRole="NDRF"><div className="flex-1 mt-16"><NdrfDashboard /></div></ProtectedRoute>} />
          <Route path="/dam" element={<ProtectedRoute allowedRole="Dam Controller"><div className="flex-1 mt-16"><DamOperatorDashboard /></div></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRole="District Collector"><div className="flex-1 mt-16"><DistrictAdminDashboard /></div></ProtectedRoute>} />
          <Route path="/highway" element={<ProtectedRoute allowedRole="Highway Department"><div className="flex-1 mt-16"><HighwayDepartmentDashboard /></div></ProtectedRoute>} />
          <Route path="/public" element={<ProtectedRoute allowedRole="Public"><div className="flex-1 mt-16"><PublicPortal /></div></ProtectedRoute>} />
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
