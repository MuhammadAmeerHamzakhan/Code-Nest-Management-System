import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  LayoutDashboard, Users, Layers, 
  CheckSquare, UserPlus, TrendingUp, 
  Activity, Settings, LogOut, Building2,
  PlusCircle, Send, User, ClipboardList, X
} from 'lucide-react';

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
  // Todo Modal States
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [taskData, setTaskData] = useState({ title: '', assigned_to: '', priority: 'Normal' });
  const [sending, setSending] = useState(false);

  // Load Employees for the dropdown
  useEffect(() => {
    const getEmployees = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_approved', true)
        .neq('full_name', 'Rabnawaz'); // Don't assign to self
      if (data) setEmployees(data);
    };
    getEmployees();
  }, [showAssignModal]);

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!taskData.assigned_to || !taskData.title) return alert("System requires ID and Subject.");
    
    setSending(true);
    try {
      const { error } = await supabase.from('tasks').insert([
        {
          title: taskData.title.toUpperCase(),
          assigned_to: taskData.assigned_to,
          priority: taskData.priority,
          status: 'Todo',
          created_at: new Date()
        }
      ]);
      if (error) throw error;
      alert("MISSION DEPLOYED: Task sent to employee dashboard.");
      setShowAssignModal(false);
      setTaskData({ title: '', assigned_to: '', priority: 'Normal' });
    } catch (err) {
      alert("MISSION ERROR: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <aside className="w-64 h-screen bg-[#0f172a] flex flex-col border-r border-slate-800 z-[100] shrink-0 font-sans">
      
      {/* BRANDING NODE */}
      <div className="p-6 mb-2">
        <div className="flex items-center gap-3">
          <div className="bg-[#6366f1] p-1.5 rounded-lg text-white shadow-lg shadow-indigo-500/20">
            <Building2 size={20} />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-tight leading-none italic uppercase">Code Nest</h1>
            <p className="text-[10px] text-slate-500 font-black mt-1 uppercase tracking-widest">Management System</p>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
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
            {item.hasAlert && pendingApprovals > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === item.id ? "bg-white text-[#6366f1]" : "bg-indigo-500 text-white"}`}>
                {pendingApprovals}
              </span>
            )}
          </button>
        ))}

        {/* MISSION CONTROL BLOCK (THE NEW TODO SECTION) */}
        <div className="mt-8 pt-8 border-t border-slate-800/40">
           <div className="px-4 mb-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Task Terminal</h3>
           </div>
           <button 
             onClick={() => setShowAssignModal(true)}
             className="w-full mx-2 max-w-[calc(100%-1rem)] bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 text-left group hover:bg-slate-800 hover:border-indigo-500/50 transition-all active:scale-95"
           >
              <div className="flex items-center gap-3 text-slate-300 group-hover:text-white mb-2">
                 <PlusCircle size={18} className="text-indigo-400" />
                 <span className="text-xs font-black uppercase italic tracking-widest">Assign New Task</span>
              </div>
              <p className="text-[9px] text-slate-500 uppercase leading-relaxed font-bold">Initiate direct deployment to employee nodes</p>
           </button>
        </div>
      </nav>

      {/* ACCOUNT BLOCK */}
      <div className="p-4 mt-auto border-t border-slate-800/50 bg-[#0c1322]">
        <div className="flex items-center gap-3 px-3 py-3 mb-4 bg-slate-900/50 rounded-2xl">
           <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-[10px] text-white font-black italic shadow-lg shadow-indigo-500/10 border border-white/10">RH</div>
           <div className="overflow-hidden">
             <p className="text-[11px] font-black text-white uppercase tracking-tighter italic">Rabnawaz Admin</p>
             <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-60">Admin HQ Node</p>
           </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all italic border border-transparent"
        >
          <LogOut size={16} />
          <span>Shutdown Session</span>
        </button>
      </div>

      {/* ASSIGN TASK MODAL OVERLAY */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-6">
           <div className="bg-[#1e293b] w-full max-w-md rounded-[32px] border border-slate-700 shadow-2xl p-10 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-10">
                 <div>
                   <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Mission Deployment</h3>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Assign Task to Operative</p>
                 </div>
                 <button onClick={() => setShowAssignModal(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
              </div>

              <form onSubmit={handleAssignTask} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block italic">Target Operative</label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <select 
                        required
                        value={taskData.assigned_to}
                        onChange={e => setTaskData({...taskData, assigned_to: e.target.value})}
                        className="w-full bg-slate-900/50 h-14 rounded-2xl pl-12 pr-4 text-xs font-bold text-white border border-slate-800 focus:border-indigo-500/50 outline-none appearance-none cursor-pointer transition-all"
                      >
                         <option value="">SELECT EMPLOYEE</option>
                         {employees.map(emp => (
                           <option key={emp.id} value={emp.id} className="bg-slate-900">{emp.full_name}</option>
                         ))}
                      </select>
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block italic">Task Identifier</label>
                    <div className="relative">
                      <ClipboardList size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        required
                        type="text" 
                        placeholder="ENTER TASK TITLE"
                        value={taskData.title}
                        onChange={e => setTaskData({...taskData, title: e.target.value})}
                        className="w-full bg-slate-900/50 h-14 rounded-2xl pl-12 pr-4 text-xs font-bold text-white border border-slate-800 focus:border-indigo-500/50 outline-none placeholder:text-slate-600 tracking-widest transition-all"
                      />
                    </div>
                 </div>

                 <button 
                   disabled={sending}
                   type="submit" 
                   className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.3em] italic flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
                 >
                    {sending ? 'DEPLOYING...' : (
                      <><Send size={16} /> Deploy Task</>
                    )}
                 </button>
              </form>
           </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </aside>
  );
}