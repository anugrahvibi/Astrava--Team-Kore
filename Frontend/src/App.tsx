import React, { useEffect, useMemo, useState } from 'react';
// CascadeNet: Advanced Intelligence & Response Control System
import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Bell, LogOut, X } from 'lucide-react';

// Dashboards
import { NdrfDashboard } from './dashboards/NdrfDashboard';
import { DamOperatorDashboard } from './dashboards/DamOperatorDashboard';
import { DistrictAdminDashboard } from './dashboards/DistrictAdminDashboard';
import { PublicPortal } from './dashboards/PublicPortal';
import { HighwayDepartmentDashboard } from './dashboards/HighwayDepartmentDashboard';

// Components
import { Login } from './components/Login';
import { Signup } from './components/Signup';

// Context
import { AuthProvider, useAuth } from './AuthContext';
import type { Role } from './AuthContext';
import { fetchActiveAlerts } from './utils/dataFetcher';
import type { Alert } from './utils/dataFetcher';

const roleToAlertDepartment: Record<Exclude<Role, null>, string> = {
  'Dam Controller': 'dam_controller',
  'NDRF': 'ndrf_rescue',
  'District Collector': 'district_admin',
  'Highway Department': 'highway_department',
  'Public': 'Public',
};

const roleToRoute: Record<Exclude<Role, null>, string> = {
  'Dam Controller': '/dam',
  'NDRF': '/ndrf',
  'District Collector': '/admin',
  'Highway Department': '/highway',
  'Public': '/public',
};

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, logout } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isAuthPage = location.pathname === '/' || location.pathname === '/signup' || location.pathname === '/login';
  const departmentKey = role ? roleToAlertDepartment[role] : null;

  if (isAuthPage) return null;

  useEffect(() => {
    if (!departmentKey) return;
    let isMounted = true;

    const syncNotifications = async () => {
      const items = await fetchActiveAlerts(departmentKey);
      if (!isMounted) return;
      const sorted = [...items].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      setNotifications(sorted);
      setUnreadCount(isNotificationsOpen ? 0 : sorted.length);
    };

    syncNotifications();
    const interval = setInterval(syncNotifications, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [departmentKey, isNotificationsOpen]);

  useEffect(() => {
    if (isNotificationsOpen) {
      setUnreadCount(0);
    }
  }, [isNotificationsOpen]);

  const visibleNotifications = useMemo(() => notifications.slice(0, 8), [notifications]);

  const onNotificationClick = () => {
    if (!role) return;
    setIsNotificationsOpen(false);
    const destination = roleToRoute[role];
    if (destination && location.pathname !== destination) {
      navigate(destination);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getSeverityClasses = (level: string) => {
    if (level === 'RED') return 'border-l-red-500 bg-red-50/70';
    if (level === 'AMBER') return 'border-l-amber-500 bg-amber-50/70';
    return 'border-l-emerald-500 bg-emerald-50/60';
  };

  return (
    <>
      <nav style={{ backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', background: 'rgba(255,255,255,0.55)' }} className="fixed top-5 left-1/2 -translate-x-1/2 w-[92%] max-w-7xl h-[4.25rem] rounded-[1.8rem] flex items-center justify-between px-5 md:px-7 z-50 shadow-xl border border-white/70 transition-all duration-500">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/logo.svg" alt="CascadeNet logo" className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-gray-900 brand-font leading-none">
              Cascade<span className="text-blue-600 ending-serif">Net</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end text-right leading-tight">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Clearance Level</span>
            <span className="text-[11px] font-black text-gray-500 tracking-tight">{role}</span>
          </div>
          <button
            aria-label="Open notifications"
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="relative h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 bg-white/70 text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-all duration-200"
          >
            <Bell size={19} strokeWidth={2.1} className={unreadCount > 0 ? 'animate-pulse' : ''} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black leading-[18px] text-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button 
            onClick={logout} 
            className="h-10 min-w-[112px] flex items-center justify-center gap-2 bg-white/55 hover:bg-red-600 text-gray-700 hover:text-white px-4 rounded-full font-black text-[10px] uppercase tracking-[0.14em] transition-all duration-300 border border-gray-200 hover:border-red-600 active:scale-95"
          >
            <LogOut size={14} className="shrink-0" /> <span>Logout</span>
          </button>
        </div>
      </nav>

      {isNotificationsOpen && (
        <>
          <button
            aria-label="Close notifications"
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsNotificationsOpen(false)}
          />
          <aside className="fixed top-[5.75rem] right-5 md:right-7 w-[360px] max-w-[calc(100vw-1.5rem)] max-h-[76vh] z-[60] rounded-[1.75rem] border border-gray-200/90 bg-white shadow-2xl overflow-hidden origin-top-right animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300">
            <div className="h-14 px-5 border-b border-gray-100 flex items-center justify-between bg-white">
              <div>
                <div className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Notifications</div>
                <div className="text-[11px] font-semibold text-gray-400 mt-0.5">Latest role updates</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={clearNotifications}
                  className="h-8 px-3 rounded-full text-[10px] font-black text-blue-600 hover:text-blue-700 hover:bg-blue-50 uppercase tracking-wide transition-colors"
                >
                  Clear All
                </button>
                <button
                  aria-label="Close notification panel"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="h-8 w-8 rounded-full border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="max-h-[calc(76vh-3.5rem)] overflow-y-auto custom-scrollbar p-3.5 space-y-2.5">
              {visibleNotifications.length > 0 ? (
                visibleNotifications.map((item) => (
                  <button
                    key={item.id}
                    onClick={onNotificationClick}
                    className={`w-full text-left p-3.5 rounded-2xl border border-gray-100 border-l-[3px] ${getSeverityClasses(item.alert_level)} hover:border-blue-200 hover:shadow-sm transition-all`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 truncate">{item.zone_id}</span>
                      <span className="text-[10px] font-black uppercase tracking-wide text-gray-500 shrink-0">{item.alert_level}</span>
                    </div>
                    <p className="text-[12px] font-semibold leading-snug text-gray-800 line-clamp-3">{item.action_text}</p>
                    {item.deadline_hrs !== undefined && (
                      <div className="mt-2 text-[10px] font-bold text-gray-500">Action window: T-{item.deadline_hrs}h</div>
                    )}
                  </button>
                ))
              ) : (
                <div className="py-12 px-6 text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
                  <p className="text-xs font-semibold text-gray-400">No active notifications</p>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </>
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
    <div className="h-screen w-screen bg-[#f8fafc] text-gray-900 flex flex-col overflow-hidden relative font-sans no-scrollbar">
      {/* Ambient backgrounds — must be vivid so glassmorphism shows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-blue-400/30 blur-[120px] rounded-full" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[140px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[140px] rounded-full" />
        <div className="absolute top-[30%] right-[5%] w-[35%] h-[35%] bg-purple-500/15 blur-[120px] rounded-full" />
      </div>

      {role && <Navigation />}

      <main className="flex-1 w-full h-full relative z-10 overflow-hidden">
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
