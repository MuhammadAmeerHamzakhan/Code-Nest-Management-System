import React from 'react';
import { 
  LayoutDashboard, Users, Layers, 
  CheckSquare, UserPlus, TrendingUp, 
  Activity, Settings, LogOut, Building2
} from 'lucide-react';

// Updated MENU_NODES to match the clean professional style
const MENU_NODES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'projects', label: 'Projects', icon: Layers },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'team', label: 'Team', icon: UserPlus, hasAlert: true },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'ai', label: 'AI Assistant', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar({ activeTab, setActiveTab, pendingApprovals, onLogout }) {
  return (
    <aside className="w-64 h-screen bg-[#0f172a] flex flex-col border-r border-slate-800 z-[100] shrink-0 font-sans">
      
      {/* BRANDING NODE: Modern SaaS Logo Style */}
      <div className="p-6 mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#6366f1] p-1.5 rounded-lg text-white shadow-lg shadow-indigo-500/20">
            <Building2 size={20} />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-tight leading-none">Code Nest</h1>
            <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider">Management System</p>
          </div>
        </div>
      </div>

      {/* NAVIGATION: Clean & Rounded */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {MENU_NODES.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
              activeTab === item.id 
              ? "bg-[#6366f1] text-white shadow-lg shadow-indigo-600/30" 
              : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="flex-1 text-left">{item.label}</span>
            
            {/* NOTIFICATION BADGE (For Pending Approvals) */}
            {item.hasAlert && pendingApprovals > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === item.id 
                ? "bg-white text-[#6366f1]" 
                : "bg-indigo-500 text-white"
              }`}>
                {pendingApprovals}
              </span>
            )}

            {/* Selection indicator line */}
            {activeTab === item.id && (
                <div className="absolute right-2 w-1 h-4 bg-indigo-300/50 rounded-full"></div>
            )}
          </button>
        ))}
      </nav>

      {/* ACCOUNT & LOGOUT BLOCK */}
      <div className="p-4 mt-auto border-t border-slate-800/50">
        <div className="flex items-center gap-3 px-3 py-3 mb-4">
           <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-xs text-white font-bold shadow-lg">CN</div>
           <div className="overflow-hidden">
             <p className="text-xs font-semibold text-white truncate">Rabnawaz Admin</p>
             <p className="text-[10px] text-slate-500 font-medium truncate">rabnawaz@hq.com</p>
           </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent active:scale-95"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
      `}</style>
    </aside>
  );
}