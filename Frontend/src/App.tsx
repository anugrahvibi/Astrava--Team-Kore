import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { NdrfDashboard } from './dashboards/NdrfDashboard';
import { DamOperatorDashboard } from './dashboards/DamOperatorDashboard';
import { DistrictAdminDashboard } from './dashboards/DistrictAdminDashboard';
import { PublicPortal } from './dashboards/PublicPortal';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { LayoutDashboard, RadioTower, ShieldAlert, Users, LogOut } from 'lucide-react';

function Navigation() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/' || location.pathname === '/signup';

  if (isAuthPage) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 border-b bg-white border-gray-200 flex items-center justify-between px-6 z-50 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <span>CascadeNet</span>
          <span className="text-xs px-2 py-0.5 rounded-xl bg-gray-100 text-gray-600 font-sans">v2.0</span>
        </h1>
      </div>
      <div className="flex gap-1 text-sm font-medium">
        <Link to="/ndrf" className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-xl">
          <ShieldAlert size={16} /> NDRF Command
        </Link>
        <Link to="/dam" className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-xl">
          <RadioTower size={16} /> Dam Operator
        </Link>
        <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-xl">
          <LayoutDashboard size={16} /> District Admin
        </Link>
        <Link to="/public" className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-xl">
          <Users size={16} /> Public Portal
        </Link>
        <Link to="/" className="flex items-center gap-2 border-l border-gray-200 ml-2 pl-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors rounded-xl">
          <LogOut size={16} /> Logout
        </Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="h-screen w-screen bg-gray-50 text-gray-900 flex flex-col overflow-hidden" style={{ fontFamily: 'Verdana, sans-serif' }}>
        <Navigation />
        <main className="flex-1 mt-0 relative flex flex-col">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/ndrf" element={<div className="flex-1 mt-16"><NdrfDashboard /></div>} />
            <Route path="/dam" element={<div className="flex-1 mt-16"><DamOperatorDashboard /></div>} />
            <Route path="/admin" element={<div className="flex-1 mt-16"><DistrictAdminDashboard /></div>} />
            <Route path="/public" element={<div className="flex-1 mt-16"><PublicPortal /></div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
