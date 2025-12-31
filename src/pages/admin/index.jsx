import React, { useState, useEffect } from 'react';
import { supabase } from "../../supabaseClient";

// 1. IMPORT MODULAR NODES
import AdminSidebar from './AdminSidebar';
import DashboardOverview from './DashboardOverview';
import StaffRegistry from './StaffRegistry';
import ClientsCenter from './ClientsCenter';
import TaskSequencing from './TaskSequencing';
import ProjectMatrix from './ProjectMatrix';
import FinanceVault from './FinanceVault';
import HQSettings from './HQSettings';

// 2. IMPORT UI ICONS (NATIVE SCALED)
import { Bell, Search, LogOut, Cpu } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingCount, setPendingCount] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // LOGIC: REAL-TIME NOTIFICATION HUB
  useEffect(() => {
    const fetchPendingCount = async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false);
      setPendingCount(count || 0);
    };

    fetchPendingCount();

    // Subscribe to immediate registry handshake changes
    const channel = supabase.channel('hq-global-sync')
      .on('postgres_changes', { event: '*', table: 'profiles' }, () => fetchPendingCount())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); 
  };

  return (
    <div className="flex h-screen w-full bg-[#F9FBFC] font-black italic uppercase overflow-hidden">
      
      {/* 1. SIDEBAR NODE: NATIVE 300px WIDTH */}
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        pendingApprovals={pendingCount} 
        onLogout={handleLogout}
      />

      {/* 2. MAIN EXECUTION FRAME: SCALED FOR 100% ZOOM */}
      <main className="flex-1 flex flex-col min-w-0 h-screen relative bg-[#F9FBFC]">
        
        {/* COMPACT HEADER (H-16 is perfect for 100% Native Scale) */}
        <header className="h-16 bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-8 flex justify-between items-center z-40 shrink-0">
          <div className="flex items-center gap-8">
            <h1 className="text-lg tracking-tighter text-[#000000] border-l-4 border-[#2b945f] pl-4 leading-none uppercase">
              NODE_OPS / {activeTab.replace('-', ' ')}
            </h1>
            
            {/* Search Matrix */}
            <div className="flex items-center gap-3 bg-[#eff2f7] px-5 py-2 rounded-xl border border-slate-100 w-[350px]">
               <Search size={14} className="text-slate-400" />
               <input 
                type="text" 
                placeholder="QUERY_CORE_DATABASE..." 
                className="bg-transparent border-none text-[9px] font-black tracking-widest text-[#0c3740] outline-none w-full uppercase placeholder:text-slate-300 italic"
               />
            </div>
          </div>

          <div className="flex items-center gap-6">
              {/* SYSTEM NOTIFICATIONS */}
              <div className="flex items-center gap-5 pr-5 border-r border-slate-100">
                  <div className="relative p-1.5 cursor-pointer group" onClick={() => setActiveTab('team')}>
                    <Bell size={20} className={pendingCount > 0 ? "text-red-600 animate-bounce" : "text-slate-300"} />
                    {pendingCount > 0 && (
                      <span className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-white animate-pulse">
                        {pendingCount}
                      </span>
                    )}
                  </div>
                  <Cpu size={20} className="text-[#2b945f]" />
              </div>

              {/* PROFILE CONTROL: SIR RABNAWAZ SIGNATURE */}
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-black leading-none">Sir Rabnawaz</p>
                    <p className="text-[8px] text-[#2b945f] mt-1 font-bold">HQ_PRINCIPAL</p>
                  </div>
                  <div className="size-10 bg-[#0c3740] text-[#2b945f] rounded-xl flex items-center justify-center font-black text-lg border-b-2 border-[#2b945f]">
                    R
                  </div>
              </div>

              {isProfileOpen && (
                 <div className="absolute top-20 right-8 w-64 bg-white border-4 border-[#0c3740] rounded-[30px] shadow-2xl z-[100] p-6 animate-in fade-in">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-[10px] text-red-600 hover:bg-red-50 rounded-xl font-black italic border-t pt-4">Kill Linkage</button>
                 </div>
              )}
          </div>
        </header>

        {/* 3. DYNAMIC CONTENT INJECTION (NO ZOOM HACK - NATIVE RENDERING) */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#F9FBFC] relative">
          <div className="max-w-[1550px] mx-auto pb-20">
             
             {/* CRITICAL UPDATE: Passing setActiveTab down to prevent white screens */}
             {activeTab === 'dashboard' && <DashboardOverview setActiveTab={setActiveTab} />}
             {activeTab === 'team' && <StaffRegistry setActiveTab={setActiveTab} />}
             
             {/* Other nodes... */}
             {activeTab === 'clients' && <ClientsCenter />}
             {activeTab === 'tasks' && <TaskSequencing />}
             {activeTab === 'projects' && <ProjectMatrix />}
             {activeTab === 'finance' && <FinanceVault />}
             {activeTab === 'settings' && <HQSettings />}
          </div>
        </div>
      </main>
    </div>
  );
}