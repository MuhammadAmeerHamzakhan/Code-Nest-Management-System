import React, { useEffect, useState } from 'react';
import { supabase } from "../../supabaseClient";
import { 
  Users, Activity, AlertTriangle, 
  Search, Bell, Plus, Check, X, LogOut, Settings,
  Moon, UserPlus, CheckSquare, PlusSquare, 
  Building2, CircleDollarSign, Clock, CalendarCheck2,
  TrendingUp, History, UserCheck, UserX, ShieldCheck, ShieldAlert, KeyRound, Eye, EyeOff
} from 'lucide-react';

export default function AdminDashboardOverview({ setActiveTab }) {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false); 
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]); 
  
  // Security Modal States
  const [showPassModal, setShowPassModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [updatingPass, setUpdatingPass] = useState(false);

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

  useEffect(() => {
    fetchStats();
    
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchStats()) 
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchStats() {
    try {
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
        projects, clients, profiles: staff, tasks,
        revenue: clients.reduce((acc, curr) => acc + Number(curr.monthly_value || 0), 0),
        atRisk: projects.filter(p => (Number(p.progress) || 0) < 30).length,
        completedThisWeek: resolved.length,
        overdueTasks: tasks.filter(t => t.deadline < today && t.status?.toString().toLowerCase() !== 'done').length,
        emergencyTasks: tasks.filter(t => t.priority === 'High' && t.status?.toString().toLowerCase() !== 'done').length,
        resolvedTasks: resolved 
      });

      // Show users that are pending approval AND haven't been flat-out denied (is_active is null/true)
      setPendingUsers(staff.filter(p => p.is_approved === false && p.is_active !== false));

    } catch (error) {
      console.error("Dashboard Brain Lag:", error);
    } finally {
      setLoading(false);
    }
  }

  // RABNAWAZ DECISION LOGIC
  const handleUserDecision = async (userId, action) => {
    try {
      if (action === 'ALLOW') {
        await supabase.from('profiles').update({ is_approved: true, is_active: true }).eq('id', userId);
        alert("ACCESS GRANTED: User is now an authorized member.");
      } else {
        // We set is_active to false instead of deleting to show the "Not Allowed" popup later
        await supabase.from('profiles').update({ is_approved: false, is_active: false }).eq('id', userId);
        alert("ACCESS DENIED: Operation blocked and restricted.");
      }
      fetchStats();
    } catch (e) {
      alert("Error updating registry.");
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) return alert("Alpha Cipher must be 6+ characters.");
    setUpdatingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert("ROOT CIPHER UPDATED: Re-log may be required on next sync.");
      setShowPassModal(false);
      setNewPassword('');
    } catch (error) {
      alert("Cipher Error: " + error.message);
    } finally {
      setUpdatingPass(false);
    }
  };

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
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-center justify-between px-8 py-6 gap-4">
        <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">ADMIN OVERVIEW</h1>
        
        <div className="flex items-center gap-3 flex-1 md:justify-end relative">
          <div className="relative w-full max-w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
               type="text" 
               placeholder="Search matrix..." 
               onChange={(e) => setSearchQuery(e.target.value)} 
               className="w-full bg-[#e2e8f0]/40 border border-slate-200/50 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none font-bold" 
            />
          </div>

          <div className="relative group">
            <button 
                onClick={() => setShowNotificationModal(true)} 
                className={`p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm transition-all active:scale-95 ${pendingUsers.length > 0 ? 'text-indigo-600 border-indigo-200 ring-2 ring-indigo-50/50' : 'text-slate-600'}`}
            >
                <Bell size={18} />
                {pendingUsers.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-[#F8FAFC] animate-bounce">
                        {pendingUsers.length}
                    </span>
                )}
            </button>
          </div>

          <div className="relative flex items-center gap-2 pl-3 ml-1 border-l border-slate-200">
             <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center hover:shadow-lg transition-all active:scale-95 italic border-2 border-indigo-200 shadow-xl shadow-indigo-100/50">RH</button>
             {showProfileMenu && (
                <div className="absolute right-0 top-14 w-52 bg-white border border-slate-100 rounded-[24px] shadow-2xl z-[600] p-2 animate-in slide-in-from-top-2 border-b-indigo-500 border-b-2">
                   <div className="px-3 py-2 border-b border-slate-50 mb-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase italic tracking-widest">Rabnawaz (Owner)</p>
                   </div>
                   <button onClick={() => {setShowPassModal(true); setShowProfileMenu(false);}} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"><KeyRound size={14} className="text-indigo-600"/> Change Password</button>
                   <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest mt-1 italic transition-colors"><LogOut size={14} /> LogOut</button>
                </div>
             )}
             <div className="hidden sm:block">
               <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block italic">SIR RABNAWAZ</span>
               <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-[0.2em] block">ADMIN ACCESS</span>
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-8 pb-10 space-y-6">
        {/* STAT TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
           <StatTile title="Active Clients" val={data.clients.filter(c => c.status === 'Active').length} icon={<Building2 className="text-indigo-600" size={20}/>} iconBg="bg-indigo-50" footer={`${data.clients.length} TOTAL NODES`} />
           <StatTile title="Monthly Revenue" val={`$${data.revenue.toLocaleString()}`} icon={<CircleDollarSign className="text-indigo-600" size={20}/>} iconBg="bg-indigo-50" footer="ACTIVE CLIENTS ONLY" />
           <StatTile title="Overdue Tasks" val={data.overdueTasks} icon={<Clock className="text-indigo-600" size={20}/>} iconBg="bg-indigo-50" footer="URGENT TRACKING" />
           <StatTile title="Emergency Tasks" val={data.emergencyTasks} icon={<AlertTriangle className="text-indigo-600" size={20}/>} iconBg="bg-indigo-50" footer="HIGH PRIORITY" />
           <div onClick={() => setShowHistoryModal(true)} className="cursor-pointer active:scale-95 transition-transform hover:-translate-y-1">
             <StatTile title="Completed Tasks" val={data.resolvedTasks.length} icon={<CalendarCheck2 className="text-indigo-600" size={20}/>} iconBg="bg-indigo-50" footer="RESOLUTION LEDGER →" isAction />
           </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           <DashedAction onClick={() => setActiveTab('clients')} icon={<UserPlus size={18}/>} label="ADD CLIENT" />
           <DashedAction onClick={() => setActiveTab('projects')} icon={<Plus size={18}/>} label="NEW PROJECT" />
           <DashedAction onClick={() => setActiveTab('tasks')} icon={<CheckSquare size={18}/>} label="ADD TASK" />
           <DashedAction onClick={() => setActiveTab('team')} icon={<PlusSquare size={18}/>} label="ADD TEAM" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           {/* PROJECTS LISTING */}
           <div className="lg:col-span-8 bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm">
             <div className="flex justify-between items-center pb-6 border-b border-slate-50 mb-6">
                <h3 className="font-black text-slate-800 tracking-tighter text-lg uppercase italic leading-none">ACTIVE MATRIX PROJECTS</h3>
             </div>
             <div className="space-y-8">
                {data.projects.filter(p => p.project_name?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map((p, i) => (
                   <div key={i} className="flex items-center justify-between group transition-all">
                      <div>
                         <p className="text-sm font-black text-slate-800 uppercase tracking-tighter italic">{p.project_name}</p>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.client_name}</p>
                      </div>
                      <div className="flex items-center gap-6">
                         <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                            <div className="bg-indigo-600 h-full transition-all duration-1000 shadow-[0_0_8px_rgba(99,102,241,0.5)]" style={{width: `${p.progress || 0}%`}}></div>
                         </div>
                         <span className="text-xs font-black text-slate-800 italic uppercase">{p.progress || 0}%</span>
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

      {/* PASS TERMINAL MODAL */}
      {showPassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[1000] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl border-2 border-indigo-600 p-10 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-10">
                 <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Security Cipher</h3>
                   <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Reset Alpha Cipher Protocol</p>
                 </div>
                 <ShieldCheck className="text-emerald-500" size={28}/>
              </div>
              
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3 block italic">New Alpha Cipher</label>
                    <div className="relative group">
                       <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600" size={18}/>
                       <input 
                          type={showPass ? "text" : "password"} 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-slate-50 h-14 rounded-2xl pl-12 pr-12 text-sm font-bold tracking-[0.2em] outline-none border-2 border-transparent focus:border-indigo-100 transition-all"
                          placeholder="••••••••"
                       />
                       <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900">
                          {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                       </button>
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <button onClick={() => setShowPassModal(false)} className="flex-1 bg-slate-100 text-slate-900 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                    <button onClick={handleUpdatePassword} disabled={updatingPass} className="flex-[2] bg-indigo-600 text-white h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest italic shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95 transition-all">
                       {updatingPass ? "Reconfiguring..." : "Commit Change"}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* NOTIFICATION HUB MODAL */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[35px] shadow-2xl overflow-hidden flex flex-col border border-white animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-[#F8FAFC]">
               <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Gate Clearance</h3>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-1 italic">Authorized Sir Rabnawaz Review Hub</p>
               </div>
               <button onClick={() => setShowNotificationModal(false)} className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm"><X size={18}/></button>
             </div>
             <div className="overflow-y-auto p-6 space-y-3 bg-white max-h-[50vh]">
               {pendingUsers.map((user, i) => (
                 <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-[24px] border border-slate-100 group transition-all hover:bg-white hover:shadow-xl">
                   <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-black italic text-indigo-600 text-[10px] shadow-sm uppercase">{user.full_name?.charAt(0) || 'U'}</div>
                      <div>
                        <p className="text-[13px] font-black text-slate-800 uppercase italic tracking-tighter leading-none mb-1">{user.full_name || 'UNIDENTIFIED'}</p>
                        <p className="text-[10px] font-bold text-slate-400 lowercase italic opacity-80">{user.email}</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={() => handleUserDecision(user.id, 'ALLOW')} className="h-10 px-5 bg-indigo-600 text-white rounded-xl text-[9px] font-black flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-90 transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest italic">
                        <Check size={14} /> Allow
                     </button>
                     <button onClick={() => handleUserDecision(user.id, 'DENY')} className="w-10 h-10 bg-white text-slate-400 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 active:scale-90 transition-all shadow-sm">
                        <UserX size={18} />
                     </button>
                   </div>
                 </div>
               ))}
               {pendingUsers.length === 0 && (
                 <div className="py-16 text-center flex flex-col items-center opacity-30">
                    <UserCheck className="text-slate-900 mb-4" size={54} />
                    <p className="text-[10px] font-black uppercase text-slate-900 tracking-[0.4em] italic leading-relaxed">System Perimeter Clear <br /> No Access Requests Found</p>
                 </div>
               )}
             </div>
          </div>
        </div>
      )}

      {/* RESOLUTION LEDGER */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[35px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-[#F8FAFC]">
                 <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Resolution Ledger</h3>
                 <button onClick={() => setShowHistoryModal(false)} className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm"><X size={20}/></button>
              </div>
              <div className="overflow-y-auto p-8 space-y-4 bg-white">
                 {data.resolvedTasks.map((task, i) => (
                    <div key={i} className="group p-5 rounded-[28px] border border-slate-50 hover:border-indigo-100 hover:bg-slate-50 transition-all shadow-sm">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 shadow-inner"><History size={20}/></div>
                             <div>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-0.5 italic">{task.clientName} / {task.projectName}</p>
                                <h4 className="text-sm font-black text-slate-800 tracking-tight leading-tight uppercase italic leading-none">{task.title}</h4>
                                <div className="flex items-center gap-1.5 mt-2 font-bold text-slate-400 uppercase text-[9px]">
                                   <UserCheck size={12}/> DONE BY: {task.doneBy}
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// ---------------- STYLE REPLICATORS ---------------- //

function StatTile({ title, val, icon, iconBg, footer, isAction }) {
  return (
    <div className={`bg-white border border-slate-100 rounded-[30px] p-6 flex flex-col justify-between shadow-sm transition-all h-full ${isAction ? 'border-b-indigo-500 border-b-2 shadow-indigo-100 active:scale-95' : ''}`}>
       <div className="flex justify-between items-start mb-2">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{title}</p>
         <div className={`p-2.5 ${iconBg} rounded-xl shadow-sm`}>{icon}</div>
       </div>
       <h2 className="text-4xl font-black text-slate-900 leading-tight mb-2 tracking-tighter italic uppercase">{(val || 0)}</h2>
       <p className="text-[10px] font-black text-slate-400 tracking-widest italic uppercase">{footer}</p>
    </div>
  );
}

function DashedAction({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="border-2 border-dashed border-slate-200 bg-white/40 rounded-[28px] p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all hover:bg-white active:scale-95 group">
       <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">{icon}</div>
       <span className="text-[10px] font-black uppercase tracking-widest italic leading-none">{label}</span>
    </button>
  );
}

function MetricSmall({ label, val, growth }) {
  return (
    <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic leading-none">{label}</p>
       <h4 className="text-2xl font-black text-slate-800 leading-none mb-2 italic tracking-tight italic uppercase">{val}</h4>
       <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-black uppercase italic tracking-tighter">
         <TrendingUp size={10} strokeWidth={4}/> {growth}
       </div>
    </div>
  );
}

function StatusItem({ label, val, isBad, isHealthy }) {
  return (
    <div className="flex justify-between items-center py-4 text-sm font-black italic uppercase tracking-tighter border-b border-slate-50 last:border-none">
       <span className="text-slate-400 text-[11px] font-black tracking-widest not-italic leading-none italic">{label}</span>
       <span className={`text-[12px] px-3 py-0.5 rounded-full ${isBad ? 'text-red-500 bg-red-50' : isHealthy ? 'text-emerald-600 bg-emerald-50' : 'text-slate-800 bg-slate-50'}`}>
         {val}
       </span>
    </div>
  );
}