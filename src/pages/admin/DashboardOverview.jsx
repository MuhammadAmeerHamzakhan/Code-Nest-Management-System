import React, { useEffect, useState } from 'react';
import { supabase } from "../../supabaseClient";
import { 
  Users, Activity, AlertTriangle, 
  TrendingUp, Search, Bell, Plus,
  Check, X, LogOut, User, Settings,
  Moon, ChevronRight, UserPlus, 
  FolderPlus, CheckSquare, PlusSquare, 
  Building2, CircleDollarSign, Clock, LayoutDashboard
} from 'lucide-react';

export default function AdminDashboardOverview({ setActiveTab }) {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  
  // LOGIC HUB: UPDATED DATA STATE
  const [data, setData] = useState({
    projects: [],
    clients: [],
    profiles: [],
    revenue: 0,
    atRisk: 0,
    completedThisWeek: 0,
    overdueTasks: 0,
    emergencyTasks: 0
  });

  useEffect(() => {
    fetchStats();
    
    // MASTER SYNC: Listening to everything
    const channel = supabase
      .channel('realtime-dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchStats())
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchStats() {
    try {
      // Parallel fetch for speed
      const [projs, profs, cls, tks] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('clients').select('*'),
        supabase.from('tasks').select('*')
      ]);

      const projects = projs.data || [];
      const staff = profs.data || [];
      const clients = cls.data || [];
      const tasks = tks.data || [];

      const today = new Date().toISOString().split('T')[0];

      // Logic: Sum of all client monthly values
      const trueRevenue = clients.reduce((acc, curr) => acc + Number(curr.monthly_value || 0), 0);

      // Logic: Task counts based on status and deadline
      const overdue = tasks.filter(t => t.deadline < today && t.status !== 'Done').length;
      const emergency = tasks.filter(t => t.priority === 'High' && t.status !== 'Done').length;

      setData({
        projects: projects,
        clients: clients,
        profiles: staff,
        revenue: trueRevenue,
        atRisk: projects.filter(p => (Number(p.progress) || 0) < 30).length,
        completedThisWeek: projects.filter(p => p.status === 'Completed').length,
        overdueTasks: overdue,
        emergencyTasks: emergency
      });

      setPendingUsers(staff.filter(p => p.is_approved === false));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // --- Search Filtering ---
  const filteredProjects = data.projects.filter(p => 
    p.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); 
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#6366f1]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col w-full font-sans text-slate-900 overflow-x-hidden">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between px-8 py-6 gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        
        <div className="flex items-center gap-3 flex-1 md:justify-end">
          <div className="relative w-full max-w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search matrix..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#e2e8f0]/40 border border-slate-200/50 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-indigo-400 outline-none transition-all"
            />
          </div>

          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 shadow-sm"><Moon size={18} /></button>
          
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 shadow-sm relative"
            >
              <Bell size={18} />
              {pendingUsers.length > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white"></span>}
            </button>
          </div>

          <div className="flex items-center gap-2 pl-3 ml-1 border-l border-slate-200">
             <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-8 h-8 rounded-lg bg-[#6366f1] text-white font-bold text-xs flex items-center justify-center">A</button>
             <span className="text-xs font-bold text-slate-700 hidden sm:block">Admin</span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-8 pb-10 space-y-6">
        
        {/* UPDATED CARDS WITH REAL LOGIC */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           {/* Active Clients uses the Clients Table count */}
           <StatTile 
              title="Active Clients" 
              val={data.clients.filter(c => c.status === 'Active').length} 
              icon={<Building2 className="text-indigo-600" size={20}/>} 
              iconBg="bg-indigo-50" 
              footer={`${data.clients.length} total nodes in registry`} 
           />

           {/* Monthly Revenue sums specific PKR values and formats them */}
           <StatTile 
              title="Monthly Revenue" 
              val={`$${data.revenue.toLocaleString()}`} 
              icon={<CircleDollarSign className="text-indigo-600" size={20}/>} 
              iconBg="bg-indigo-50" 
              footer="Aggregate Portfolio Yield" 
           />

           {/* Overdue logic looks for past deadlines on unfinished tasks */}
           <StatTile 
              title="Overdue Tasks" 
              val={data.overdueTasks} 
              icon={<Clock className="text-indigo-600" size={20}/>} 
              iconBg="bg-indigo-50" 
              footer="Urgent resolution needed" 
           />

           {/* Emergency Tasks counts tasks set to HIGH Priority */}
           <StatTile 
              title="Emergency Tasks" 
              val={data.emergencyTasks} 
              icon={<AlertTriangle className="text-indigo-600" size={20}/>} 
              iconBg="bg-indigo-50" 
              footer="High priority threads" 
           />
        </div>

        {/* NAVIGATION SHORTCUTS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           <DashedAction onClick={() => setActiveTab('clients')} icon={<UserPlus size={18}/>} label="Add Client" />
           <DashedAction onClick={() => setActiveTab('projects')} icon={<Plus size={18} strokeWidth={3}/>} label="New Project" />
           <DashedAction onClick={() => setActiveTab('tasks')} icon={<CheckSquare size={18}/>} label="Add Task" />
           <DashedAction onClick={() => setActiveTab('team')} icon={<PlusSquare size={18}/>} label="Add Team" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm min-h-[400px]">
             <div className="flex justify-between items-center pb-6 border-b border-slate-50">
                <h3 className="font-bold text-slate-800">Active Matrix Projects</h3>
                <button onClick={()=>setActiveTab('projects')} className="text-xs font-bold text-indigo-600 hover:underline transition-all">View all →</button>
             </div>
             
             <div className="py-4 space-y-4">
                {filteredProjects.slice(0, 5).map((p, i) => (
                   <div key={i} className="flex items-center justify-between p-3 rounded-2xl border border-slate-50 hover:bg-slate-50 group">
                      <div>
                         <p className="text-sm font-bold text-slate-700 truncate">{p.project_name}</p>
                         <p className="text-[10px] font-bold text-indigo-500 uppercase mt-0.5 tracking-wider">{p.client_name}</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden border border-white">
                            <div className="bg-indigo-600 h-full" style={{width: `${p.progress || 10}%`}}></div>
                         </div>
                         <span className="text-xs font-black text-slate-800 w-10 text-right">{p.progress || 0}%</span>
                      </div>
                   </div>
                ))}
                {filteredProjects.length === 0 && <p className="text-center py-20 text-slate-300 font-bold uppercase text-[10px] tracking-widest">No matching node records found</p>}
             </div>
           </div>

           <div className="lg:col-span-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <MetricSmall label="STABLE LOAD" val={data.completedThisWeek} growth="Concluded Units" />
                 <MetricSmall label="TARGET MRR" val={`$${(data.revenue + 1500).toLocaleString()}`} growth="Projected Ceiling" />
              </div>

              <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm divide-y divide-slate-50">
                 <StatusItem label="Clients At Risk" val={data.atRisk} isBad={data.atRisk > 0} />
                 <StatusItem label="Total Live Threads" val={data.projects.length} />
                 <StatusItem label="System Stability" val="99.9%" />
                 <StatusItem label="Pending Signups" val={pendingUsers.length} isBad={pendingUsers.length > 0} />
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}

// ---------------- SHARED INTERFACE NODES ---------------- //

function StatTile({ title, val, icon, iconBg, footer }) {
  return (
    <div className="bg-white border border-slate-100 rounded-[28px] p-6 flex flex-col justify-between shadow-sm transition-all hover:shadow-lg hover:border-slate-200">
       <div className="flex justify-between items-start mb-2">
         <p className="text-xs font-bold text-slate-400">{title}</p>
         <div className={`p-2 ${iconBg} rounded-xl shadow-sm`}>{icon}</div>
       </div>
       <h2 className="text-4xl font-extrabold text-slate-900 leading-tight mb-2 tracking-tight">{val}</h2>
       <p className="text-[11px] font-medium text-slate-500">{footer}</p>
    </div>
  );
}

function DashedAction({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="border-2 border-dashed border-slate-200 rounded-[24px] p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all hover:bg-white hover:shadow-md">
       <div className="transition-transform group-hover:scale-110">{icon}</div>
       <span className="text-xs font-bold">{label}</span>
    </button>
  );
}

function MetricSmall({ label, val, growth }) {
  return (
    <div className="bg-white border border-slate-100 rounded-[24px] p-6 text-center">
       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
       <h4 className="text-2xl font-black text-slate-800 leading-none mb-3">{val}</h4>
       <div className="bg-emerald-50 text-emerald-600 text-[9px] font-bold py-0.5 rounded-full">{growth}</div>
    </div>
  );
}

function StatusItem({ label, val, isBad }) {
  return (
    <div className="flex justify-between items-center py-3 text-[13px] font-medium">
       <span className="text-slate-400">{label}</span>
       <span className={`font-black ${isBad ? 'text-red-500 underline decoration-2' : 'text-slate-800'}`}>{val}</span>
    </div>
  );
}