import React from 'react';
import { 
  LayoutDashboard, Users, UserSquare2, 
  TerminalSquare, Box, Wallet, Settings, LogOut 
} from 'lucide-react';

const MENU_NODES = [
  { id: 'dashboard', label: 'Overview HUD', icon: LayoutDashboard },
  { id: 'team', label: 'Personnel Hub', icon: Users, hasAlert: true },
  { id: 'clients', label: 'Client Nodes', icon: UserSquare2 },
  { id: 'tasks', label: 'Task Stream', icon: TerminalSquare },
  { id: 'projects', label: 'Execution Matrix', icon: Box },
  { id: 'finance', label: 'Economic Vault', icon: Wallet },
  { id: 'settings', label: 'System Logic', icon: Settings },
];

export default function AdminSidebar({ activeTab, setActiveTab, pendingApprovals, onLogout }) {
  return (
    <aside className="w-[300px] h-screen bg-[#0c3740] flex flex-col p-8 border-r-4 border-[#2b945f] shadow-[10px_0_50px_rgba(0,0,0,0.4)] z-[100] shrink-0 font-black italic uppercase">
      
      {/* BRANDING NODE: NATIVE SCALE */}
      <div className="mb-10 animate-in slide-in-from-left duration-700">
        <h1 className="text-3xl tracking-tighter text-white">
          Code <span className="text-[#2b945f]">Nest</span>
        </h1>
        <div className="mt-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#2b945f] animate-pulse"></div>
            <p className="text-[8px] text-white/30 tracking-[0.4em]">
               TERMINAL 1.04 / HQ
            </p>
        </div>
      </div>

      {/* NAVIGATION MATRIX: HIGH DENSITY PADDING */}
      <nav className="flex-1 space-y-2.5">
        {MENU_NODES.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full group relative flex items-center gap-4 px-5 py-4 rounded-[22px] text-[10px] tracking-widest transition-all duration-300 border-2 ${
              activeTab === item.id 
              ? "bg-[#2b945f] text-white border-white shadow-xl scale-[1.02]" 
              : "text-white/40 border-transparent hover:bg-white/5 hover:text-white"
            }`}
          >
            <item.icon size={18} className={activeTab === item.id ? "animate-pulse" : ""} />
            <span className="flex-1 text-left">{item.label}</span>
            
            {/* ALERT PIN */}
            {item.hasAlert && pendingApprovals > 0 && (
              <span className="bg-red-600 text-white size-5 rounded-full flex items-center justify-center text-[8px] animate-bounce shadow-xl border-2 border-white">
                {pendingApprovals}
              </span>
            )}
            
            {activeTab === item.id && (
               <div className="absolute -left-10 w-2 h-8 bg-white rounded-r-full shadow-[0_0_15px_white]"></div>
            )}
          </button>
        ))}
      </nav>

      {/* TERMINAL TERMINATION */}
      <div className="pt-6 border-t border-white/10">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-6 py-4 rounded-[20px] text-[10px] tracking-widest text-red-400 hover:bg-red-600 hover:text-white transition-all border-2 border-transparent hover:border-white group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform"/>
          <span>Kill Link</span>
        </button>
      </div>
    </aside>
  );
}