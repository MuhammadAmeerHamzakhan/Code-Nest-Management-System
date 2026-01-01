import React, { useState, useEffect } from 'react';
import { supabase } from "../../supabaseClient";
import { 
  Plus, Search, Filter, Trash2, 
  Clock, X, ChevronDown, Calendar,
  CheckCircle2, AlertCircle, Layout,
  MoreVertical, Building2, User as UserIcon
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

  // Form State - EXACTLY matching your screenshot
  const [newTask, setNewTask] = useState({
    title: '', 
    project_id: '', 
    description: '',
    assigned_to: '', 
    status: 'To Do', 
    priority: 'Medium', 
    task_type: 'One-time',
    deadline: ''
  });

  // BRAIN: Real-time Fetch
  useEffect(() => {
    fetchData();
    const channel = supabase.channel('tasks-hq-live')
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
      console.error(err);
    } finally {
      setLoading(false);
    }
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
        alert("Error: " + error.message);
      }
    } catch (err) {
      alert("Something went wrong!");
    }
  };

  const deleteTask = async (id) => {
    if (window.confirm("Purge this task?")) {
      await supabase.from('tasks').delete().eq('id', id);
      fetchData();
    }
  };

  // Logic: Real Search and Filter
  const filtered = tasks.filter(t => {
    const matchesSearch = t.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center w-full bg-[#F8FAFC]">
       <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#6366F1]"></div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 font-sans tracking-tight bg-[#F8FAFC]">
      
      {/* 1. HEADER ROW */}
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Tasks</h1>
           <p className="text-slate-500 text-sm mt-1 font-medium">Manage and track task progress</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#6366f1] hover:bg-[#585af2] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={20} strokeWidth={3} /> Add Task
        </button>
      </div>

      {/* 2. FILTER BOXES */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-wrap gap-8">
        <ColumnFilter label="Status" opts={['To Do', 'In Progress', 'Blocked', 'Done']} onChange={setStatusFilter} />
        <ColumnFilter label="Priority" opts={['High', 'Medium', 'Low']} />
        <ColumnFilter label="Assignee" opts={staff.map(s => s.full_name)} />
      </div>

      {/* 3. STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Tasks" value={tasks.length} color="text-slate-800" />
        <StatCard label="In Progress" value={tasks.filter(t=>t.status==='In Progress').length} color="text-blue-500" />
        <StatCard label="Blocked" value={tasks.filter(t=>t.status==='Blocked').length} color="text-red-500" />
        <StatCard label="Overdue" value={0} color="text-red-700" />
        <StatCard label="Completed" value={tasks.filter(t=>t.status==='Done').length} color="text-emerald-500" />
      </div>

      {/* 4. KANBAN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[550px]">
        {COLUMNS.map(col => (
           <div key={col.id} className="bg-slate-50/50 rounded-3xl border border-slate-200/40 flex flex-col p-2 shadow-inner">
             <div className="p-4 flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-600 text-[13px]">{col.label}</h3>
                <span className="bg-white text-[11px] font-bold text-slate-300 w-6 h-6 flex items-center justify-center rounded-full border border-slate-100">
                   {filtered.filter(t => t.status === col.id).length}
                </span>
             </div>
             
             <div className="space-y-4 px-2 overflow-y-auto max-h-[600px] pb-10">
               {filtered.filter(t => t.status === col.id).length === 0 ? (
                  <p className="text-[10px] font-bold uppercase text-slate-300 text-center py-20 tracking-tighter opacity-60">No tasks in {col.label.toLowerCase()}</p>
               ) : (
                 filtered.filter(t => t.status === col.id).map(task => (
                   <div key={task.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm group hover:shadow-md transition-shadow cursor-pointer relative">
                     <div className="flex justify-between items-center mb-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight ${task.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
                           {task.priority}
                        </span>
                        <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-red-500"><Trash2 size={14}/></button>
                     </div>
                     <p className="text-sm font-bold text-slate-800 leading-snug">{task.title}</p>
                     
                     <div className="mt-5 pt-3 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] text-[#6366f1] font-bold uppercase tracking-tighter">
                              {staff.find(s=>s.id === task.assigned_to)?.full_name?.charAt(0) || '?'}
                           </div>
                           <span className="text-[10px] text-slate-400 font-medium">
                              {staff.find(s=>s.id === task.assigned_to)?.full_name || 'Unassigned'}
                           </span>
                        </div>
                        {task.deadline && <span className="text-[9px] font-bold text-slate-300 uppercase italic tracking-tighter">{task.deadline}</span>}
                     </div>
                   </div>
                 ))
               )}
             </div>
           </div>
        ))}
      </div>

      {/* 5. CREATE MODAL - EXACTLY MATCHING YOUR SCREENSHOT IMAGE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[30px] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                 <h2 className="text-xl font-bold text-slate-800 tracking-tight">Create New Task</h2>
                 <X onClick={() => setIsModalOpen(false)} size={18} className="text-slate-400 cursor-pointer hover:text-slate-800 transition-colors" />
              </div>

              <form onSubmit={handleCreateTask} className="p-8 space-y-6">
                 
                 {/* Project Selection Dropdown */}
                 <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-500 ml-1">Project</label>
                    <div className="relative">
                       <select required className="w-full bg-white border border-slate-200 p-3.5 rounded-xl text-sm appearance-none outline-none focus:border-[#6366f1]" onChange={e => setNewTask({...newTask, project_id: e.target.value})}>
                          <option value="">Select a project</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                       </select>
                       <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-500 ml-1">Title</label>
                    <input required className="w-full border border-slate-200 p-3.5 rounded-xl text-sm outline-none focus:border-[#6366f1] placeholder:text-slate-300" onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="What needs to be done?" />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-500 ml-1">Description</label>
                    <textarea className="w-full border border-slate-200 p-3.5 rounded-xl text-sm min-h-[100px] outline-none focus:border-[#6366f1] transition-all resize-none" onChange={e => setNewTask({...newTask, description: e.target.value})} />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 relative">
                       <label className="text-[13px] font-bold text-slate-500 ml-1">Priority</label>
                       <select className="w-full bg-white border border-slate-200 p-3.5 rounded-xl text-sm appearance-none outline-none" onChange={e => setNewTask({...newTask, priority: e.target.value})} value={newTask.priority}>
                          <option>Low</option><option>Medium</option><option>High</option>
                       </select>
                       <ChevronDown size={14} className="absolute right-4 top-[47px] text-slate-400" />
                    </div>
                    <div className="space-y-2 relative">
                       <label className="text-[13px] font-bold text-slate-500 ml-1">Type</label>
                       <select className="w-full bg-white border border-slate-200 p-3.5 rounded-xl text-sm appearance-none outline-none" onChange={e => setNewTask({...newTask, task_type: e.target.value})}>
                          <option>One-time</option><option>Recurring</option>
                       </select>
                       <ChevronDown size={14} className="absolute right-4 top-[47px] text-slate-400" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6 pb-2">
                    <div className="space-y-2 relative">
                       <label className="text-[13px] font-bold text-slate-500 ml-1">Assignee</label>
                       <select required className="w-full bg-white border border-slate-200 p-3.5 rounded-xl text-sm appearance-none outline-none" onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}>
                          <option value="">Select an option</option>
                          {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                       </select>
                       <ChevronDown size={14} className="absolute right-4 top-[47px] text-slate-400" />
                    </div>
                    <div className="space-y-2 relative">
                       <label className="text-[13px] font-bold text-slate-500 ml-1">Due Date</label>
                       <div className="relative">
                          <input type="date" required className="w-full border border-slate-200 p-3.5 rounded-xl text-sm outline-none" onChange={e => setNewTask({...newTask, deadline: e.target.value})} />
                          <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                       </div>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-slate-50 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-2.5 bg-slate-50 text-slate-400 rounded-xl font-bold text-[13px] hover:bg-slate-100 transition-all">Cancel</button>
                    <button type="submit" className="px-8 py-2.5 bg-[#6366f1] text-white rounded-xl font-bold text-[13px] shadow-lg shadow-indigo-100 active:scale-95 transition-all">Create Task</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

// ---------------- STYLING COMPONENTS ---------------- //

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white p-7 rounded-[22px] border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-2 text-center transition-all hover:shadow-md">
       <h4 className={`text-4xl font-extrabold ${color}`}>{value}</h4>
       <p className="text-[12px] font-bold text-slate-400 tracking-widest uppercase">{label}</p>
    </div>
  );
}

function ColumnFilter({ label, opts, onChange }) {
   return (
    <div className="space-y-1">
       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</p>
       <div className="relative">
         <select className="appearance-none border border-slate-200 px-4 py-2 pr-12 rounded-xl text-sm font-semibold text-slate-700 outline-none min-w-[160px] cursor-pointer" onChange={(e) => onChange && onChange(e.target.value)}>
            <option value="all">All {label}s</option>
            {opts.map((o, i) => <option key={i} value={o}>{o}</option>)}
         </select>
         <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
       </div>
    </div>
   );
}