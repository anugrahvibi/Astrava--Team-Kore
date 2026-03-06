import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { NdrfDashboard } from './dashboards/NdrfDashboard';
import { DamOperatorDashboard } from './dashboards/DamOperatorDashboard';
import { DistrictAdminDashboard } from './dashboards/DistrictAdminDashboard';
import { PublicPortal } from './dashboards/PublicPortal';
import { LayoutDashboard, RadioTower, ShieldAlert, Users } from 'lucide-react';

function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold tracking-tight text-gray-100 flex items-center gap-2">
          <span>CascadeNet</span>
          <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-mono">v2.0</span>
        </h1>
      </div>
      <div className="flex gap-1 text-sm font-medium">
        <Link to="/" className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors rounded">
          <ShieldAlert size={16} /> NDRF Command
        </Link>
        <Link to="/dam" className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors rounded">
          <RadioTower size={16} /> Dam Operator
        </Link>
        <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors rounded">
          <LayoutDashboard size={16} /> District Admin
        </Link>
        <Link to="/public" className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors rounded">
          <Users size={16} /> Public Portal
        </Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="h-screen w-screen bg-gray-950 text-gray-100 flex flex-col font-sans overflow-hidden">
        <Navigation />
        <main className="flex-1 mt-16 relative">
          <Routes>
            <Route path="/" element={<NdrfDashboard />} />
            <Route path="/dam" element={<DamOperatorDashboard />} />
            <Route path="/admin" element={<DistrictAdminDashboard />} />
            <Route path="/public" element={<PublicPortal />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
