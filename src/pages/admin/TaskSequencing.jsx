import React, { useState, useEffect } from 'react';
import { supabase } from "../../supabaseClient";
import { 
  Plus, ClipboardList, CheckCircle2, Clock, 
  AlertOctagon, Zap, Filter, Search, Trash2, 
  User, Activity, MoreHorizontal, Layout, X
} from 'lucide-react';

const COLUMNS = [
  { id: 'Todo', title: 'PRE_SYNC_QUEUE', icon: <Clock size={16} /> },
  { id: 'In Progress', title: 'ACTIVE_EXECUTION', icon: <Activity size={16} /> },
  { id: 'Blocked', title: 'BLOCK_PROTOCOL', icon: <AlertOctagon size={16} /> },
  { id: 'Done', title: 'RELEASED_STABLE', icon: <CheckCircle2 size={16} /> },
];

export default function TaskSequencing() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newTask, setNewTask] = useState({
    title: '', project_id: '', assigned_to: '', status: 'Todo', priority: 'Medium', deadline: ''
  });

  // LOGIC NODE: HQ COMMAND UPLINK
  useEffect(() => {
    fetchSequenceData();
    const channel = supabase.channel('task-sequence-sync')
      .on('postgres_changes', { event: '*', table: 'tasks' }, () => fetchSequenceData())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchSequenceData = async () => {
    const { data: tks } = await supabase.from('tasks').select('*');
    const { data: prj } = await supabase.from('projects').select('*');
    const { data: stf } = await supabase.from('profiles').select('*');
    
    setTasks(tks || []);
    setProjects(prj || []);
    setStaff(stf || []);
    setLoading(false);
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
  };

  const purgeTaskNode = async (taskId) => {
    if (window.confirm("CRITICAL: PURGE TASK NODE FROM SEQUENCER?")) {
      await supabase.from('tasks').delete().eq('id', taskId);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('tasks').insert([newTask]);
    if (!error) setIsModalOpen(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Zap className="animate-pulse text-[#2b945f]" size={48} />
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* 1. HEADER CONTROL LAYER */}
      <div className="flex justify-between items-end bg-white p-12 rounded-[50px] border-4 border-slate-50 shadow-sm relative overflow-hidden">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <Layout className="text-[#5542f0]" size={20} />
             <span className="text-slate-400 font-black italic uppercase text-[10px] tracking-[0.5em]">Command Module 1.04</span>
          </div>
          <h1 className="text-5xl font-black italic uppercase text-black tracking-tighter leading-none">Task Sequencing</h1>
          <p className="text-[#2b945f] font-black italic uppercase text-[10px] mt-4 tracking-widest">Active Orchestration Flow</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white px-10 py-5 rounded-3xl font-black italic uppercase text-xs border-b-8 border-[#2b945f] active:scale-95 transition-all shadow-xl flex items-center gap-3"
        >
          <Plus size={20} /> Initiate Task node
        </button>
      </div>

      {/* 2. OPERATIONAL FILTERS */}
      <div className="flex gap-6">
         <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              className="w-full bg-white border-4 border-slate-50 p-6 pl-16 rounded-[30px] font-black italic uppercase text-[10px] shadow-sm outline-none focus:ring-4 ring-[#2b945f]/10"
              placeholder="SCAN TASK IDENTITY..."
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         <div className="grid grid-cols-3 gap-4 font-black italic uppercase text-[9px] text-center">
            <div className="bg-[#2b945f]/10 p-4 rounded-2xl border border-[#2b945f]/20">
              <p className="text-slate-400 mb-1">STABLE</p>
              <p className="text-xl text-[#2b945f]">{tasks.filter(t=>t.status === 'Done').length}</p>
            </div>
            <div className="bg-[#5542f0]/10 p-4 rounded-2xl border border-[#5542f0]/20">
              <p className="text-slate-400 mb-1">IN_AIR</p>
              <p className="text-xl text-[#5542f0]">{tasks.filter(t=>t.status === 'In Progress').length}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
              <p className="text-slate-400 mb-1">HALTED</p>
              <p className="text-xl text-red-600">{tasks.filter(t=>t.status === 'Blocked').length}</p>
            </div>
         </div>
      </div>

      {/* 3. KANBAN MATRIX BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[700px]">
        {COLUMNS.map((column) => (
          <div key={column.id} className="space-y-6">
            <div className="flex items-center justify-between px-6">
              <div className="flex items-center gap-3 opacity-30 group hover:opacity-100 transition-opacity">
                 {column.icon}
                 <h3 className="font-black italic uppercase text-[10px] tracking-[0.3em]">{column.title}</h3>
              </div>
              <span className="text-[10px] font-black italic bg-white border-2 border-slate-100 px-3 py-1 rounded-xl shadow-sm">
                {tasks.filter(t => t.status === column.id).length}
              </span>
            </div>

            <div className="bg-[#eff2f7]/50 rounded-[45px] p-4 min-h-[600px] border-4 border-dashed border-white shadow-inner space-y-4">
              {tasks.filter(t => t.status === column.id).map((task) => {
                const project = projects.find(p => p.id === task.project_id);
                const assigned = staff.find(s => s.id === task.assigned_to);

                return (
                  <div 
                    key={task.id} 
                    className="bg-white p-7 rounded-[40px] shadow-sm border-2 border-slate-50 hover:shadow-2xl hover:border-[#2b945f]/20 cursor-pointer group transition-all"
                  >
                    <div className="flex justify-between items-start mb-6">
                       <span className={`text-[8px] font-black italic uppercase px-3 py-1 rounded-full border ${
                         task.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-[#2b945f]/10 text-[#2b945f] border-[#2b945f]/20'
                       }`}>
                         {task.priority}_SLO
                       </span>
                       <button onClick={() => purgeTaskNode(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                         <Trash2 size={16} className="text-red-200 hover:text-red-600" />
                       </button>
                    </div>

                    <h4 className="text-xs font-black italic uppercase tracking-tight text-black mb-6 leading-relaxed">
                      {task.title}
                    </h4>

                    <div className="space-y-3 pt-6 border-t-2 border-slate-50 mt-auto">
                       <div className="flex justify-between items-center text-[8px] font-black italic uppercase opacity-40">
                          <p className="flex items-center gap-2"><User size={12}/> {assigned?.full_name?.split(' ')[0] || 'UNASSIGNED'}</p>
                          <p>{task.deadline}</p>
                       </div>
                       <p className="text-[8px] font-black italic uppercase text-[#5542f0]">{project?.project_name || 'ORPHAN_CORE'}</p>
                    </div>

                    {/* INTERACTIVE COLUMN SWITCHER */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                        {COLUMNS.filter(c => c.id !== task.status).map(col => (
                           <button 
                             key={col.id} 
                             onClick={() => updateTaskStatus(task.id, col.id)}
                             className="text-[7px] font-black bg-[#F9FBFC] hover:bg-black hover:text-white px-2 py-1 rounded-md border"
                           >
                             MOVE_{col.id.replace(' ', '_').toUpperCase()}
                           </button>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 4. MODAL: INITIATE TASK NODE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0c3740]/98 backdrop-blur-3xl z-[9999] flex items-center justify-center p-6 selection:bg-[#2b945f]">
          <div className="bg-white w-full max-w-[550px] rounded-[65px] overflow-hidden shadow-2xl border-[10px] border-white animate-in zoom-in-95 duration-500">
             <header className="bg-black p-12 flex justify-between items-center text-white border-b-8 border-[#2b945f]">
                <div>
                  <h2 className="text-xl font-black italic uppercase tracking-tighter">Sequence Injection</h2>
                  <p className="text-[10px] font-black italic uppercase text-[#2b945f] mt-1 opacity-50">Create New Execution Point</p>
                </div>
                <X className="cursor-pointer opacity-30 hover:opacity-100 hover:rotate-90 transition-all" size={30} onClick={() => setIsModalOpen(false)} />
             </header>

             <form onSubmit={handleCreateTask} className="p-12 space-y-6 font-black italic uppercase">
                <div className="space-y-2">
                   <label className="text-[9px] text-slate-400">LOGIC_TITLE_STRING</label>
                   <input required className="w-full bg-[#F9FBFC] p-6 rounded-3xl outline-none focus:ring-4 ring-[#2b945f]/10 border-none font-black text-xl italic placeholder:opacity-10" placeholder="NAME OF TASK..." onChange={e => setNewTask({...newTask, title: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[9px] text-slate-400">ASSIGN_CORE_PROJECT</label>
                      <select required className="w-full bg-[#F9FBFC] p-5 rounded-2xl outline-none text-[10px] border-none" onChange={e => setNewTask({...newTask, project_id: e.target.value})}>
                         <option value="">SELECT PROJECT...</option>
                         {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] text-slate-400">OPERATIVE_LINK</label>
                      <select required className="w-full bg-[#F9FBFC] p-5 rounded-2xl outline-none text-[10px] border-none" onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}>
                         <option value="">SELECT STAFF...</option>
                         {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[9px] text-slate-400">SLA_PRIORITY</label>
                      <select className="w-full bg-[#F9FBFC] p-5 rounded-2xl outline-none text-[10px]" onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                         <option>Medium</option>
                         <option>High</option>
                         <option>Low</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] text-slate-400">RELEASE_DEADLINE</label>
                      <input type="date" required className="w-full bg-[#F9FBFC] p-5 rounded-2xl outline-none text-[10px]" onChange={e => setNewTask({...newTask, deadline: e.target.value})} />
                   </div>
                </div>

                <button type="submit" className="w-full bg-[#2b945f] text-white py-8 rounded-[40px] font-black text-lg shadow-2xl active:translate-y-2 border-b-[10px] border-black transition-all mt-10">Confirm Injection Flow</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}