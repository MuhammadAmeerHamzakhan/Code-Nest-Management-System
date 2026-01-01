import React, { useState, useEffect } from 'react';
import { supabase } from "../../supabaseClient";
import { 
  Plus, Search, Trash2, X, ChevronDown, 
  Calendar, Clock, User, Briefcase, 
  Layers, AlertTriangle, CheckCircle2, Type
} from 'lucide-react';

const COLUMNS = [
  { id: 'To Do', label: 'To Do' },
  { id: 'In Progress', label: 'In Progress' },
  { id: 'Blocked', label: 'Blocked' },
  { id: 'Done', label: 'Done' },
];

export default function TasksCenter() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Enhanced Form State
  const [newTask, setNewTask] = useState({
    title: '', 
    project_id: '', 
    description: '',
    assigned_to: '', 
    status: 'To Do', // Can now be chosen on creation
    priority: 'Medium', 
    task_type: 'One-time',
    deadline: ''
  });

  // BRAIN: Real-time Fetch & Drag Sync
  useEffect(() => {
    fetchData();
    const channel = supabase.channel('tasks-kanban-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchData())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchData = async () => {
    try {
      const { data: tks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      const { data: prj } = await supabase.from('projects').select('id, project_name');
      const { data: stf } = await supabase.from('profiles').select('id, full_name');
      
      setTasks(tks || []);
      setProjects(prj || []);
      setStaff(stf || []);
    } catch (err) {
      console.error("Task Matrix Fetch Error:", err);
    } finally {
      setTimeout(() => setLoading(false), 400); // Smooth hydration
    }
  };

  // --- DRAG & DROP LOGIC ---
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
  };

  const handleOnDrop = async (e, targetStatus) => {
    const taskId = e.dataTransfer.getData("taskId");
    
    // Optimistic UI Update
    setTasks(prev => prev.map(t => t.id == taskId ? { ...t, status: targetStatus } : t));

    // Database Handshake
    const { error } = await supabase
      .from('tasks')
      .update({ status: targetStatus })
      .eq('id', taskId);

    if (error) {
      console.error("Drop sync error:", error.message);
      fetchData(); // Rollback if error occurs
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Required for drop to work
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('tasks').insert([newTask]);
      if (!error) {
        setIsModalOpen(false);
        setNewTask({ title: '', project_id: '', description: '', assigned_to: '', status: 'To Do', priority: 'Medium', task_type: 'One-time', deadline: '' });
        fetchData();
      } else {
        alert("Creation Fail: " + error.message);
      }
    } catch (err) {
      alert("Matrix link severed. Try again.");
    }
  };

  const deleteTask = async (id) => {
    if (window.confirm("Purge this task from the matrix?")) {
      await supabase.from('tasks').delete().eq('id', id);
      fetchData();
    }
  };

  const filtered = tasks.filter(t => {
    const matchesSearch = t.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return (
    <div className="flex h-screen items-center justify-center w-full bg-[#F8FAFC]">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#6366F1]"></div>
    </div>
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#F8FAFC] font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Tasks</h1>
           <p className="text-slate-500 text-sm mt-1 font-medium">Coordinate deliverables across the Project Matrix</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#6366F1] hover:bg-[#585af2] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 active:scale-95 transition-all"
        >
          <Plus size={18} strokeWidth={3} /> Add Task
        </button>
      </div>

      {/* FILTER PANEL */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" size={18} />
          <input 
            className="w-full bg-white border border-slate-100 py-3 pl-11 pr-4 rounded-xl text-sm outline-none focus:border-indigo-400 shadow-sm"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <FilterDropdown label="Assignee" opts={staff.map(s => s.full_name)} />
          <FilterDropdown label="Priority" opts={['High', 'Medium', 'Low']} />
        </div>
      </div>

      {/* STAT STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
        <StatTile label="Matrix Load" value={tasks.length} color="text-slate-800" />
        <StatTile label="Active Sprint" value={tasks.filter(t=>t.status==='In Progress').length} color="text-blue-500" />
        <StatTile label="Blocked" value={tasks.filter(t=>t.status==='Blocked').length} color="text-red-500" />
        <StatTile label="Overdue" value={tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'Done').length} color="text-red-800" />
        <StatTile label="Archive" value={tasks.filter(t=>t.status==='Done').length} color="text-emerald-500" />
      </div>

      {/* KANBAN KINETIC BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {COLUMNS.map(col => (
           <div 
             key={col.id} 
             onDrop={(e) => handleOnDrop(e, col.id)} 
             onDragOver={handleDragOver}
             className="bg-slate-100/40 rounded-[32px] border border-slate-200/50 p-2 min-h-[600px] flex flex-col transition-colors hover:bg-slate-100/60"
           >
             <div className="p-4 flex justify-between items-center mb-4 px-6">
                <h3 className="font-extrabold text-slate-500 text-xs uppercase tracking-widest">{col.label}</h3>
                <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-black text-slate-400 border border-slate-100">
                   {filtered.filter(t => t.status === col.id).length}
                </span>
             </div>
             
             <div className="space-y-4 px-2 overflow-y-auto pb-10">
               {filtered.filter(t => t.status === col.id).length === 0 ? (
                  <div className="py-20 flex flex-col items-center opacity-30 text-center">
                    <Layers size={28} className="text-slate-300 mb-2"/>
                    <p className="text-[10px] font-bold uppercase tracking-widest">Zone Empty</p>
                  </div>
               ) : (
                 filtered.filter(t => t.status === col.id).map(task => (
                   <div 
                     key={task.id} 
                     draggable 
                     onDragStart={(e) => handleDragStart(e, task.id)}
                     onDragEnd={handleDragEnd}
                     className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-lg transition-all cursor-grab active:cursor-grabbing group border-b-[3px] border-b-slate-100/50"
                   >
                     {/* CARD TOP */}
                     <div className="flex justify-between items-start mb-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest 
                          ${task.priority === 'High' ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
                           {task.priority}
                        </span>
                        <div className="flex gap-2">
                           <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-red-500 transition-all active:scale-90"><Trash2 size={14}/></button>
                        </div>
                     </div>

                     {/* TASK CONTENT */}
                     <p className="text-sm font-extrabold text-slate-800 leading-snug mb-2">{task.title}</p>
                     <p className="text-[11px] font-medium text-slate-400 line-clamp-1 mb-4">{task.description || "No detail provided"}</p>
                     
                     <div className="text-[10px] font-black text-indigo-400 mb-6 uppercase tracking-widest">
                       {projects.find(p => p.id == task.project_id)?.project_name || "Internal Operational"}
                     </div>

                     {/* CARD FOOTER */}
                     <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="w-7 h-7 rounded-xl bg-[#6366F1] flex items-center justify-center text-[10px] text-white font-bold uppercase">
                              {staff.find(s=>s.id === task.assigned_to)?.full_name?.charAt(0) || 'A'}
                           </div>
                           <span className="text-[11px] font-bold text-slate-700 tracking-tight">
                              {staff.find(s=>s.id === task.assigned_to)?.full_name || 'System'}
                           </span>
                        </div>
                        {task.deadline && (
                          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter 
                             ${new Date(task.deadline) < new Date() && task.status !== 'Done' ? 'text-red-500' : 'text-slate-400'}`}>
                             {new Date(task.deadline) < new Date() && task.status !== 'Done' ? 'Overdue' : ''} {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                     </div>
                   </div>
                 ))
               )}
             </div>
           </div>
        ))}
      </div>

      {/* CREATE TASK MODAL (SCREENSHOT ACCURATE) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-white">
              <header className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                 <h2 className="text-xl font-bold text-slate-800 tracking-tight">Create New Task</h2>
                 <X onClick={() => setIsModalOpen(false)} size={18} className="text-slate-300 cursor-pointer hover:text-slate-800" />
              </header>

              <form onSubmit={handleCreateTask} className="p-10 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                 
                 <div className="space-y-2">
                    <label className="text-[12px] font-bold text-slate-500 ml-1">Assign to Project</label>
                    <div className="relative">
                       <select required className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm appearance-none outline-none focus:border-[#6366F1] transition-all" value={newTask.project_id} onChange={e => setNewTask({...newTask, project_id: e.target.value})}>
                          <option value="">Search internal matrix projects...</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                       </select>
                       <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[12px] font-bold text-slate-500 ml-1">Task Identification</label>
                    <input required className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm outline-none focus:border-[#6366F1] focus:bg-white transition-all shadow-inner" placeholder="E.g., Configure Real-time Listeners" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[12px] font-bold text-slate-500 ml-1">Internal Deliverable Description</label>
                    <textarea rows="3" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-sm outline-none focus:border-[#6366F1] focus:bg-white resize-none shadow-inner" placeholder="Specify technical steps or expectations..." value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 relative">
                       <label className="text-[12px] font-bold text-slate-500 ml-1">Execution Priority</label>
                       <select className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm appearance-none outline-none" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                          <option>Low</option><option>Medium</option><option>High</option>
                       </select>
                       <ChevronDown size={14} className="absolute right-5 top-[50px] text-slate-400" />
                    </div>
                    <div className="space-y-2 relative">
                       <label className="text-[12px] font-bold text-slate-500 ml-1">Deployment Phase (Category)</label>
                       <select className="w-full bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-sm appearance-none outline-none font-bold text-indigo-600 shadow-sm" value={newTask.status} onChange={e => setNewTask({...newTask, status: e.target.value})}>
                          {COLUMNS.map(col => <option key={col.id} value={col.id}>{col.label}</option>)}
                       </select>
                       <ChevronDown size={14} className="absolute right-5 top-[50px] text-indigo-300" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 relative">
                       <label className="text-[12px] font-bold text-slate-500 ml-1">Assigned Unit</label>
                       <select required className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm appearance-none outline-none focus:border-[#6366f1]" value={newTask.assigned_to} onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}>
                          <option value="">Select team member...</option>
                          {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                       </select>
                       <ChevronDown size={14} className="absolute right-5 top-[50px] text-slate-400" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[12px] font-bold text-slate-500 ml-1">Cycle Deadline</label>
                       <div className="relative group">
                          <input type="date" required onClick={(e) => e.target.showPicker()} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm outline-none focus:border-[#6366f1] appearance-none" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} />
                          <Calendar size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                       </div>
                    </div>
                 </div>

                 <footer className="pt-10 border-t border-slate-50 flex justify-end gap-3 mt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-3 rounded-2xl bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-[2px] transition-colors hover:bg-slate-100">Cancel</button>
                    <button type="submit" className="px-10 py-3 rounded-2xl bg-[#6366F1] text-white font-black text-[10px] uppercase tracking-[2px] shadow-2xl shadow-indigo-200 active:scale-95 transition-all">Create Task</button>
                 </footer>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

// ---------------- STYLING COMPONENTS ---------------- //

function StatTile({ label, value, color }) {
  return (
    <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-2 text-center transition-all hover:shadow-xl hover:-translate-y-1">
       <h4 className={`text-4xl font-black ${color} tracking-tighter leading-none`}>{value}</h4>
       <p className="text-[10px] font-bold text-slate-400 tracking-[2px] uppercase">{label}</p>
    </div>
  );
}

function FilterDropdown({ label, opts }) {
   return (
    <div className="relative">
       <select className="appearance-none bg-white border border-slate-100 px-6 py-3.5 pr-12 rounded-xl text-xs font-black text-slate-600 outline-none min-w-[160px] cursor-pointer shadow-sm hover:border-indigo-400 transition-colors">
          <option value="all">ALL {label.toUpperCase()}S</option>
          {opts.map((o, i) => <option key={i} value={o}>{o}</option>)}
       </select>
       <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
    </div>
   );
}