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

      {/* 2. MAIN EXECUTION FRAME */}
      <main className="flex-1 flex flex-col min-w-0 h-screen relative bg-[#F9FBFC]">
        
        {/* HEADER SECTION REMOVED FOR UNIFIED DASHBOARD LOOK */}

        {/* 3. DYNAMIC CONTENT INJECTION */}
        <div className="flex-1 overflow-y-auto bg-[#F9FBFC] relative">
          
          {/* Edge-to-edge rendering for primary nodes with internal navbars */}
          {activeTab === 'dashboard' && <DashboardOverview setActiveTab={setActiveTab} />}
          {activeTab === 'team' && <StaffRegistry setActiveTab={setActiveTab} />}

          {/* Padding-restricted rendering for standard nodes */}
          <div className={activeTab !== 'dashboard' && activeTab !== 'team' ? "p-8 max-w-[1550px] mx-auto pb-20" : ""}>
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