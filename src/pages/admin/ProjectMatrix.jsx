import React, { useState, useEffect } from 'react';
import { supabase } from "../../supabaseClient";
import { 
  Plus, Search, Trash2, X, ChevronDown, 
  Calendar, ClipboardList, Type, CalendarDays,
  Layout, Briefcase, BarChart3, Clock
} from 'lucide-react';

export default function ProjectMatrix() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isCustomDeadline, setIsCustomDeadline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');

  // PROJECT FORM STATE
  const [formData, setFormData] = useState({
    project_name: '', 
    client_name: '', 
    status: 'In Progress', 
    deadline: '', 
    service_type: '',
    start_date: new Date().toISOString().split('T')[0]
  });

  const serviceOptions = ['Web Development', 'Mobile App', 'UI/UX Design', 'SEO', 'Consulting', 'Maintenance'];

  // BRAIN: FETCH & REALTIME SYNC
  useEffect(() => {
    fetchMatrixData();

    const channel = supabase
      .channel('projects-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchMatrixData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchMatrixData = async () => {
    try {
      const { data: projs } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      const { data: cls } = await supabase.from('clients').select('business_name');
      setProjects(projs || []);
      setClients(cls || []);
    } catch (err) {
      console.error("Data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // UPDATE MODE
        await supabase.from('projects').update(formData).eq('id', editingId);
      } else {
        // INSERT MODE
        const { error } = await supabase.from('projects').insert([formData]);
        if (error) throw error;
      }
      closeModal();
      fetchMatrixData();
    } catch (err) {
      alert("Matrix Error: " + err.message);
    }
  };

  const handleEdit = (project) => {
    setEditingId(project.id);
    setFormData(project);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setIsCustomDeadline(false);
    setFormData({
      project_name: '', client_name: '', status: 'In Progress', 
      deadline: '', service_type: '', start_date: new Date().toISOString().split('T')[0]
    });
  };

  const purgeProject = async (id) => {
    if (window.confirm("Delete this project from Matrix permanently?")) {
      await supabase.from('projects').delete().eq('id', id);
      fetchMatrixData();
    }
  };

  const filtered = projects.filter(p => {
    const nameMatch = (p.project_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = statusFilter === 'all' || p.status === statusFilter;
    const clientMatch = clientFilter === 'all' || p.client_name === clientFilter;
    return nameMatch && statusMatch && clientMatch;
  });

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center w-full">
       <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#6366F1]"></div>
    </div>
  );

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-[#F8FAFC] animate-in fade-in duration-500 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">Projects</h1>
           <p className="text-slate-500 font-medium text-sm mt-1">Manage client projects and deliverables</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#6366F1] hover:bg-[#585af2] text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 active:scale-95 transition-all"
        >
          <Plus size={20} strokeWidth={3} /> New Project
        </button>
      </div>

      {/* FILTERING ROW */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
         <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              className="w-full bg-white border border-slate-200 py-3 pl-11 pr-4 rounded-xl text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-sm"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         <div className="flex gap-4">
            <FilterBox value={clientFilter} onChange={setClientFilter} options={clients.map(c=>c.business_name)} defaultLabel="All Clients" />
            <FilterBox value={statusFilter} onChange={setStatusFilter} options={['Planning', 'In Progress', 'In Review', 'Completed']} defaultLabel="All Status" />
         </div>
      </div>

      {/* STATS STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <MatrixStat label="Total Projects" value={projects.length} />
        <MatrixStat label="In Progress" value={projects.filter(p=>p.status==='In Progress').length} />
        <MatrixStat label="In Review" value={projects.filter(p=>p.status==='In Review').length} />
        <MatrixStat label="Completed" value={projects.filter(p=>p.status==='Completed').length} />
      </div>

      {/* PROJECT GRID (Transformation Area) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.length === 0 ? (
          <div className="col-span-full py-20 bg-white border border-dashed border-slate-200 rounded-[35px] flex flex-col items-center justify-center">
             <Layout className="text-slate-200 mb-4" size={50} />
             <p className="text-slate-400 font-bold">Matrix is empty. No projects matching your filters.</p>
          </div>
        ) : (
          filtered.map(project => (
            <div key={project.id} className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
               
               {/* PROJECT HEADER & STATUS BADGE */}
               <div className="flex justify-between items-start mb-4">
                 <div className="space-y-0.5">
                   <h3 className="text-[18px] font-black text-slate-800">{project.project_name}</h3>
                   <p className="text-[12px] font-semibold text-slate-500">{project.client_name}</p>
                 </div>
                 <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border 
                   ${project.status === 'Completed' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 
                     project.status === 'In Progress' ? 'bg-indigo-50 text-indigo-500 border-indigo-100' : 
                     project.status === 'In Review' ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                   {project.status}
                 </div>
               </div>

               {/* SERVICE PILL */}
               <div className="mb-8">
                  <span className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-lg border border-slate-100/50">
                    {project.service_type || "Standard Node"}
                  </span>
               </div>

               {/* PROGRESS SECTION */}
               <div className="mb-6 space-y-2.5">
                  <div className="flex justify-between items-end">
                    <p className="text-[12px] font-bold text-slate-400">Progress</p>
                    <p className="text-[14px] font-black text-slate-700">{project.status === 'Completed' ? '100%' : '0%'}</p>
                  </div>
                  <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                     <div className={`h-full rounded-full transition-all duration-700 
                       ${project.status === 'Completed' ? 'w-full bg-emerald-500' : 'w-0 bg-indigo-500'}`}></div>
                  </div>
               </div>

               {/* TASKS & DEADLINE DATA */}
               <div className="flex justify-between items-center pt-2 mb-8">
                  <div className="flex items-center gap-1.5 text-slate-400">
                     <p className="text-sm font-bold tracking-tight">0 tasks</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <p className="text-[12px] font-bold text-slate-400">Due:</p>
                     <p className="text-[12px] font-bold text-slate-600 uppercase tracking-tighter italic">
                       {project.deadline?.includes('-') ? new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : project.deadline || "ASAP"}
                     </p>
                  </div>
               </div>

               {/* FOOTER: TIMELINE & ACTIONS */}
               <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                 <div className="flex gap-1.5 items-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Started:</p>
                    <p className="text-[10px] font-bold text-slate-400">{new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <button onClick={() => handleEdit(project)} className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider">Edit</button>
                    <button onClick={() => purgeProject(project.id)} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-red-100 transition-all active:scale-95">Delete</button>
                 </div>
               </div>

            </div>
          ))
        )}
      </div>

      {/* MODAL (With Fixed Logic & FlexiDate Picker) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Project' : 'New Project Node'}</h2>
              <X onClick={closeModal} size={18} className="cursor-pointer text-slate-400 hover:text-slate-800" />
            </header>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[85vh] overflow-y-auto">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Assign Client</label>
                <div className="relative">
                  <select 
                    required className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm appearance-none outline-none focus:border-[#6366F1]"
                    value={formData.client_name}
                    onChange={e => setFormData({...formData, client_name: e.target.value})}
                  >
                    <option value="">Select an associated business</option>
                    {clients.map((c, i) => <option key={i} value={c.business_name}>{c.business_name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Project Identifier</label>
                   <input required type="text" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm outline-none focus:border-[#6366F1]" placeholder="e.g. Design Refresh" value={formData.project_name} onChange={e => setFormData({...formData, project_name: e.target.value})} />
                 </div>
                 <div className="space-y-2 relative">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Primary Service</label>
                   <select className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm appearance-none outline-none focus:border-[#6366F1]" value={formData.service_type} onChange={e => setFormData({...formData, service_type: e.target.value})}>
                     <option value="">Select Service Type</option>
                     {serviceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                   </select>
                   <ChevronDown className="absolute right-4 top-[48px] text-slate-400 pointer-events-none" size={16} />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 relative">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Internal Status</label>
                   <select className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm appearance-none outline-none focus:border-[#6366F1]" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                     <option>Planning</option><option>In Progress</option><option>In Review</option><option>Completed</option>
                   </select>
                   <ChevronDown className="absolute right-4 top-[48px] text-slate-400" size={16} />
                </div>

                {/* FLEXIMODE DEADLINE FIELD */}
                <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Deadline Date</label>
                    <div className="relative flex items-center group">
                      <input 
                        type={isCustomDeadline ? "text" : "date"} 
                        placeholder={isCustomDeadline ? "e.g., TBD, ASAP..." : ""}
                        onClick={(e) => !isCustomDeadline && e.target.showPicker()} 
                        className={`w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm outline-none focus:border-[#6366F1] transition-all`} 
                        value={formData.deadline} 
                        onChange={(e) => setFormData({...formData, deadline: e.target.value})} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setIsCustomDeadline(!isCustomDeadline)}
                        className="absolute right-3 bg-white p-2 rounded-lg border border-slate-100 text-slate-400 hover:text-[#6366F1] shadow-sm active:scale-95 transition-all"
                      >
                        {isCustomDeadline ? <CalendarDays size={14}/> : <Type size={14}/>}
                      </button>
                    </div>
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Official Start Date</label>
                 <div className="relative">
                   <input type="date" onClick={(e) => e.target.showPicker()} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm outline-none" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                   <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"/>
                 </div>
              </div>

              <footer className="pt-6 border-t border-slate-50 flex justify-end gap-3">
                 <button onClick={closeModal} type="button" className="px-10 py-2.5 rounded-xl bg-slate-50 text-slate-500 font-bold text-[11px] uppercase tracking-widest transition-colors hover:bg-slate-100">Cancel</button>
                 <button type="submit" className="px-10 py-2.5 rounded-xl bg-[#6366F1] text-white font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                    {editingId ? 'Push Update' : 'Initialize Project'}
                 </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- UI UTILITIES ---------------- //

function MatrixStat({ label, value }) {
  return (
    <div className="bg-white p-9 rounded-[28px] border border-slate-100 shadow-sm text-center group hover:shadow-md transition-all">
      <h4 className="text-4xl font-black text-slate-800 tracking-tighter leading-none mb-2">{value}</h4>
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function FilterBox({ value, onChange, options, defaultLabel }) {
  return (
    <div className="relative">
       <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none bg-white border border-slate-200 py-3 pl-4 pr-12 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 shadow-sm cursor-pointer min-w-[160px]">
          <option value="all">{defaultLabel}</option>
          {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
       </select>
       <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
    </div>
  );
}