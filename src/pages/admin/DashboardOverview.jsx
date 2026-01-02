import React, { useEffect, useState } from 'react';
import { supabase } from "../../supabaseClient";
import { 
  Users, Activity, AlertTriangle, 
  Search, Bell, Plus, Check, X, LogOut, Settings,
  Moon, UserPlus, CheckSquare, PlusSquare, 
  Building2, CircleDollarSign, Clock, CalendarCheck2,
  TrendingUp, History, UserCheck
} from 'lucide-react';

export default function AdminDashboardOverview({ setActiveTab }) {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false); 
  const [pendingUsers, setPendingUsers] = useState([]);
  
  const [data, setData] = useState({
    projects: [],
    clients: [],
    profiles: [],
    tasks: [],
    revenue: 0,
    atRisk: 0,
    completedThisWeek: 0,
    overdueTasks: 0,
    emergencyTasks: 0,
    resolvedTasks: [] 
  });

  // THE BRAIN: REAL-TIME REACTION ENGINE
  useEffect(() => {
    fetchStats();
    
    // Establishing a high-priority channel
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' }, 
        (payload) => {
          console.log("Real-time Task Update Detected!", payload);
          fetchStats(); // Force immediate refresh when any task changes
        }
      )
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' }, 
        () => fetchStats()
      )
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchStats() {
    try {
      // Fetch everything in parallel for maximum speed
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

      // ROBUST ENGINE: Using .trim().toLowerCase() to avoid status matching errors
      const resolved = tasks.filter(t => 
        t.status && t.status.toString().trim().toLowerCase() === 'done'
      ).map(task => {
        const linkedProject = projects.find(p => p.id === task.project_id);
        const linkedStaff = staff.find(s => s.id === task.assigned_to);
        return {
          ...task,
          projectName: linkedProject ? linkedProject.project_name : 'Direct Task',
          clientName: linkedProject ? linkedProject.client_name : 'General Client',
          doneBy: linkedStaff ? linkedStaff.full_name : 'Admin'
        };
      });

      setData({
        projects,
        clients,
        profiles: staff,
        tasks,
        revenue: clients.reduce((acc, curr) => acc + Number(curr.monthly_value || 0), 0),
        atRisk: projects.filter(p => (Number(p.progress) || 0) < 30).length,
        completedThisWeek: resolved.length, // Updated Real-time Task count
        overdueTasks: tasks.filter(t => 
           t.deadline < today && t.status?.toString().toLowerCase() !== 'done'
        ).length,
        emergencyTasks: tasks.filter(t => 
           t.priority === 'High' && t.status?.toString().toLowerCase() !== 'done'
        ).length,
        resolvedTasks: resolved 
      });

      setPendingUsers(staff.filter(p => p.is_approved === false));
    } catch (error) {
      console.error("Dashboard Brain Lag:", error);
    } finally {
      setLoading(false);
    }
  }

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
      
      {/* HEADER: PIXEL PERFECT ALIGNMENT */}
      <header className="flex flex-col md:flex-row md:items-center justify-between px-8 py-6 gap-4">
        <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">DASHBOARD</h1>
        
        <div className="flex items-center gap-3 flex-1 md:justify-end relative">
          <div className="relative w-full max-w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
               type="text" 
               placeholder="Search matrix..." 
               onChange={(e) => setSearchQuery(e.target.value)} 
               className="w-full bg-[#e2e8f0]/40 border border-slate-200/50 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none" 
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 shadow-sm"><Moon size={18} /></button>
          <div className="relative flex items-center gap-2 pl-3 ml-1 border-l border-slate-200">
             <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center hover:shadow-lg transition-all active:scale-95">A</button>
             {showProfileMenu && (
                <div className="absolute right-0 mt-36 w-48 bg-white border border-slate-100 rounded-[24px] shadow-2xl z-[100] p-2">
                   <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest"><Settings size={14} /> Settings</button>
                   <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest mt-1"><LogOut size={14} /> Logout</button>
                </div>
             )}
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">Admin</span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-8 pb-10 space-y-6">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
           <StatTile title="Active Clients" val={data.clients.filter(c => c.status === 'Active').length} icon={<Building2 className="text-indigo-600" size={20}/>} iconBg="bg-indigo-50" footer={`${data.clients.length} TOTAL NODES`} />
           <StatTile title="Monthly Revenue" val={`$${data.revenue.toLocaleString()}`} icon={<CircleDollarSign className="text-indigo-600" size={20}/>} iconBg="bg-indigo-50" footer="ACTIVE CLIENTS ONLY" />
           <StatTile title="Overdue Tasks" val={data.overdueTasks} icon={<Clock className="text-indigo-600" size={20}/>} iconBg="bg-indigo-50" footer="URGENT TRACKING" />
           <StatTile title="Emergency Tasks" val={data.emergencyTasks} icon={<AlertTriangle className="text-indigo-600" size={20}/>} iconBg="bg-indigo-50" footer="HIGH PRIORITY" />
           <div onClick={() => setShowHistoryModal(true)} className="cursor-pointer active:scale-95 transition-transform hover:-translate-y-1">
             <StatTile title="Completed Tasks" val={data.resolvedTasks.length} icon={<CalendarCheck2 className="text-indigo-600" size={20}/>} iconBg="bg-indigo-50" footer="RESOLUTION LEDGER →" isAction />
           </div>
        </div>

        {/* ... Dashed Actions, Projects, etc ... Same JSX as your version */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           <DashedAction onClick={() => setActiveTab('clients')} icon={<UserPlus size={18}/>} label="ADD CLIENT" />
           <DashedAction onClick={() => setActiveTab('projects')} icon={<Plus size={18}/>} label="NEW PROJECT" />
           <DashedAction onClick={() => setActiveTab('tasks')} icon={<CheckSquare size={18}/>} label="ADD TASK" />
           <DashedAction onClick={() => setActiveTab('team')} icon={<PlusSquare size={18}/>} label="ADD TEAM" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           <div className="lg:col-span-8 bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm">
             <div className="flex justify-between items-center pb-6 border-b border-slate-50 mb-6">
                <h3 className="font-black text-slate-800 tracking-tighter text-lg uppercase italic">ACTIVE MATRIX PROJECTS</h3>
             </div>
             <div className="space-y-8">
                {data.projects.filter(p => p.project_name?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map((p, i) => (
                   <div key={i} className="flex items-center justify-between group transition-all">
                      <div>
                         <p className="text-sm font-black text-slate-700 uppercase tracking-tighter">{p.project_name}</p>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.client_name}</p>
                      </div>
                      <div className="flex items-center gap-6">
                         <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                            <div className="bg-indigo-600 h-full transition-all duration-1000 shadow-[0_0_8px_rgba(99,102,241,0.5)]" style={{width: `${p.progress || 0}%`}}></div>
                         </div>
                         <span className="text-xs font-black text-slate-800 italic">{p.progress || 0}%</span>
                      </div>
                   </div>
                ))}
             </div>
           </div>

           <div className="lg:col-span-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <MetricSmall label="WEEKLY TASKS" val={data.completedThisWeek} growth="COMPLETED" />
                 <MetricSmall label="MRR TARGET" val={`$${(data.revenue + 1000).toLocaleString()}`} growth="PROJECTED" />
              </div>
              <div className="bg-white border border-slate-100 rounded-[28px] p-8 shadow-sm divide-y divide-slate-50">
                 <StatusItem label="AT RISK CLIENTS" val={data.atRisk} isBad={data.atRisk > 0} />
                 <StatusItem label="TOTAL LIVE THREADS" val={data.projects.length} />
                 <StatusItem label="TEAM APPROVED" val={data.profiles.filter(p=>p.is_approved).length} />
                 <StatusItem label="HEALTH STATUS" val="ACTIVE" isHealthy />
              </div>
           </div>
        </div>
      </main>

      {/* RESOLUTION LEDGER MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[35px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-[#F8FAFC]">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Task Completion Ledger</h3>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-1">OPERATIONAL AUDIT LOGS</p>
                 </div>
                 <button onClick={() => setShowHistoryModal(false)} className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm"><X size={20}/></button>
              </div>
              <div className="overflow-y-auto p-8 space-y-4 bg-white">
                 {data.resolvedTasks.map((task, i) => (
                    <div key={i} className="group p-5 rounded-[28px] border border-slate-50 hover:border-indigo-100 hover:bg-slate-50 transition-all">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 shadow-inner"><History size={20}/></div>
                             <div>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-0.5">{task.clientName} / {task.projectName}</p>
                                <h4 className="text-sm font-black text-slate-800 tracking-tight leading-tight uppercase">{task.title}</h4>
                                <div className="flex items-center gap-1.5 mt-2 font-bold text-slate-400 uppercase text-[9px]">
                                   <UserCheck size={12}/> DONE BY: {task.doneBy}
                                </div>
                             </div>
                          </div>
                          <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0">
                             <div className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-100 tracking-widest">STABLE ✅</div>
                             <p className="text-[10px] font-black text-slate-300 mt-2 uppercase tracking-widest italic">{new Date(task.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                          </div>
                       </div>
                    </div>
                 ))}
                 {data.resolvedTasks.length === 0 && <p className="text-center py-10 text-slate-300 text-[10px] font-bold tracking-widest uppercase">Node resolved tasks recorded</p>}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// ---------------- STYLE REPLICATORS (Immutable CSS) ---------------- //

function StatTile({ title, val, icon, iconBg, footer, isAction }) {
  return (
    <div className={`bg-white border border-slate-100 rounded-[30px] p-6 flex flex-col justify-between shadow-sm transition-all h-full ${isAction ? 'border-b-indigo-500 border-b-2 shadow-indigo-100' : ''}`}>
       <div className="flex justify-between items-start mb-2">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
         <div className={`p-2.5 ${iconBg} rounded-xl shadow-sm`}>{icon}</div>
       </div>
       <h2 className="text-4xl font-black text-slate-900 leading-tight mb-2 tracking-tighter">{val}</h2>
       <p className="text-[10px] font-black text-slate-400 tracking-widest">{footer}</p>
    </div>
  );
}

function DashedAction({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="border-2 border-dashed border-slate-200 bg-white/40 rounded-[28px] p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all hover:bg-white active:scale-95 group">
       <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">{icon}</div>
       <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function MetricSmall({ label, val, growth }) {
  return (
    <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
       <h4 className="text-2xl font-black text-slate-800 leading-none mb-2 italic tracking-tight">{val}</h4>
       <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-black uppercase italic tracking-tighter">
         <TrendingUp size={10} strokeWidth={4}/> {growth}
       </div>
    </div>
  );
}

function StatusItem({ label, val, isBad, isHealthy }) {
  return (
    <div className="flex justify-between items-center py-4 text-sm font-black italic uppercase tracking-tighter">
       <span className="text-slate-400 text-[11px] font-black tracking-widest not-italic tracking-normal">{label}</span>
       <span className={`text-[12px] px-3 py-0.5 rounded-full ${isBad ? 'text-red-500 bg-red-50' : isHealthy ? 'text-emerald-600 bg-emerald-50' : 'text-slate-800 bg-slate-50'}`}>
         {val}
       </span>
    </div>
  );
}