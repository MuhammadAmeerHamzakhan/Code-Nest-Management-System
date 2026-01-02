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
import Analytics from './Analytics'; // CRITICAL FIX: The previously missing node

// 2. UI ICONS
import { LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingCount, setPendingCount] = useState(0);

  // LOGIC: THE BRAIN - REAL-TIME NOTIFICATION HUB
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

  // LAYOUT ENGINE: Determines which nodes get edge-to-edge rendering vs constrained padding
  const isEdgeToEdge = activeTab === 'dashboard' || activeTab === 'team';

  return (
    <div className="flex h-screen w-full bg-[#F9FBFC] font-sans overflow-hidden">
      
      {/* 1. SIDEBAR NODE: THE MASTER NAVIGATION */}
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        pendingApprovals={pendingCount} 
        onLogout={handleLogout}
      />

      {/* 2. MAIN EXECUTION FRAME */}
      <main className="flex-1 flex flex-col min-w-0 h-screen relative bg-[#F9FBFC]">
        
        {/* 3. DYNAMIC CONTENT INJECTION ZONE */}
        <div className="flex-1 overflow-y-auto bg-[#F9FBFC] relative custom-scrollbar">
          
          {/* Dashboard and Team utilize custom full-viewport padding within their files */}
          {activeTab === 'dashboard' && <DashboardOverview setActiveTab={setActiveTab} />}
          {activeTab === 'team' && <StaffRegistry />}

          {/* Standard Padded Matrix Containers (Analytics fixed here) */}
          <div className={!isEdgeToEdge ? "p-8 max-w-[1600px] mx-auto pb-24" : ""}>
             {activeTab === 'clients' && <ClientsCenter />}
             {activeTab === 'projects' && <ProjectMatrix />}
             {activeTab === 'tasks' && <TaskSequencing />}
             {activeTab === 'finance' && <FinanceVault />}
             {activeTab === 'analytics' && <Analytics />}
             {activeTab === 'settings' && <HQSettings />}
          </div>
          
        </div>
      </main>

      {/* Global CSS for scroll performance */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6366f1;
        }
      `}</style>
    </div>
  );
}