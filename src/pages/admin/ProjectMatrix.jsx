import React, { useState, useEffect } from 'react';
import { supabase } from "../../supabaseClient";
import { 
  Plus, Search, Trash2, X, ChevronDown, 
  Calendar, Type, RefreshCw, Layers
} from 'lucide-react';

export default function ProjectMatrix() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isTempClientMode, setIsTempClientMode] = useState(false); 
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');

  const [formData, setFormData] = useState({
    project_name: '', 
    client_name: '', 
    status: 'Planning', 
    deadline: '', 
    service_type: '',
    project_type: 'One-Time', 
    start_date: new Date().toISOString().split('T')[0]
  });

  const serviceOptions = ['Web Development', 'Mobile App', 'UI/UX Design', 'SEO', 'Consulting', 'Maintenance'];

  useEffect(() => {
    fetchMatrixData();
    const channel = supabase.channel('projects-realtime-engine')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchMatrixData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchMatrixData = async () => {
    try {
      const { data: projs, error: pErr } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      const { data: cls, error: cErr } = await supabase.from('clients').select('business_name');
      
      if (pErr || cErr) throw (pErr || cErr);

      setProjects(projs || []);
      setClients(cls || []);
    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      // Simulate high-end hydration delay for the skeleton loader
      setTimeout(() => setLoading(false), 500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const targetClientName = formData.client_name;

      // 🚀 LOGIC: SMART TEMPORARY CLIENT CREATION
      if (isTempClientMode && targetClientName) {
        // Check if name already exists to prevent duplicate error or SQL conflict
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .eq('business_name', targetClientName)
          .maybeSingle();

        // If client is brand new, register them officially so they show in Clients Center
        if (!existing) {
          const { error: regError } = await supabase
            .from('clients')
            .insert([{ 
               business_name: targetClientName, 
               contact_name: "System Created (Temp)", 
               status: 'Active',
               email: 'pending@temp.com',
               monthly_value: 0
            }]);
          if (regError) throw regError;
        }
      }

      // 💾 PROJECT PERSISTENCE
      if (editingId) {
        const { error } = await supabase.from('projects').update(formData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('projects').insert([formData]);
        if (error) throw error;
      }
      
      closeModal();
      fetchMatrixData();
    } catch (err) {
      alert("System Matrix Alert: " + err.message);
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
    setIsTempClientMode(false);
    setFormData({
      project_name: '', client_name: '', status: 'Planning', 
      deadline: '', service_type: '', project_type: 'One-Time',
      start_date: new Date().toISOString().split('T')[0]
    });
  };

  const deleteProject = async (id) => {
    if (window.confirm("Delete this project and clear its history?")) {
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

  // --- PREMIUM SKELETON STATE ---
  if (loading) return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-[#F8FAFC] animate-pulse">
       <div className="flex justify-between items-center mb-10">
          <div className="h-10 w-48 bg-slate-100 rounded-lg"></div>
          <div className="h-10 w-32 bg-indigo-50 rounded-lg"></div>
       </div>
       <div className="grid grid-cols-4 gap-6 mb-12">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-3xl"></div>)}
       </div>
       <div className="grid grid-cols-2 gap-8">
          {[1,2].map(i => <div key={i} className="h-80 bg-white rounded-[32px]"></div>)}
       </div>
    </div>
  );

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-[#F8FAFC] font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Projects</h1>
           <p className="text-slate-500 text-sm mt-1 font-medium">Manage client projects and deliverables</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#6366F1] hover:bg-[#585af2] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 active:scale-95 transition-all"
        >
          <Plus size={20} strokeWidth={3} /> New Project
        </button>
      </div>

      {/* FILTERING ROW */}
      <div className="flex gap-4 mb-10">
         <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              className="w-full bg-white border border-slate-200 py-3 pl-11 pr-4 rounded-xl text-sm outline-none focus:border-indigo-400 shadow-sm"
              placeholder="Search active projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         <FilterBox value={clientFilter} onChange={setClientFilter} options={clients.map(c=>c.business_name)} defaultLabel="All Clients" />
         <FilterBox value={statusFilter} onChange={setStatusFilter} options={['Planning', 'In Progress', 'In Review', 'Completed']} defaultLabel="All Status" />
      </div>

      {/* STATS STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <MatrixStat label="Total Projects" value={projects.length} />
        <MatrixStat label="Active Track" value={projects.filter(p=>p.status==='In Progress').length} />
        <MatrixStat label="Maintenance" value={projects.filter(p=>p.project_type==='Recurring').length} />
        <MatrixStat label="Completed" value={projects.filter(p=>p.status==='Completed').length} />
      </div>

      {/* PROJECT CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.map(project => (
          <div key={project.id} className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all group">
             
             <div className="flex justify-between items-start mb-6">
               <div>
                 <h3 className="text-[20px] font-black text-slate-800 tracking-tighter leading-none">{project.project_name}</h3>
                 <div className="flex gap-2 items-center mt-2">
                    <p className="text-xs font-bold text-[#6366F1] uppercase">{project.client_name}</p>
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${project.project_type === 'Recurring' ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                        {project.project_type}
                    </span>
                 </div>
               </div>
               <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${project.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : project.status === 'In Progress' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                 {project.status}
               </span>
             </div>

             <p className="text-[13px] font-bold text-slate-500 mb-8 tracking-tight">{project.service_type || 'Custom Service Unit'}</p>

             <div className="mb-10 space-y-1.5">
                <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-tight">
                  <span>Cycle Progress</span>
                  <span className="text-slate-900">{project.status === 'Completed' ? '100%' : '0%'}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                   <div className={`h-full bg-indigo-500 transition-all duration-1000 ease-out ${project.status === 'Completed' ? 'w-full shadow-lg shadow-indigo-100' : 'w-0'}`}></div>
                </div>
             </div>

             <div className="flex justify-between items-center text-[12px] font-bold text-slate-400 border-b border-slate-50 pb-8 mb-8">
                <div className="flex items-center gap-2">0 tasks listed</div>
                <div className="flex gap-1.5">DUE: <span className="text-slate-800">{project.deadline || 'OPEN'}</span></div>
             </div>

             <div className="flex justify-between items-center pt-2">
               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Started: {project.start_date}</span>
               <div className="flex gap-5">
                 <button onClick={() => handleEdit(project)} className="text-[13px] font-extrabold text-slate-400 hover:text-indigo-600 transition-colors uppercase">Edit</button>
                 <button onClick={() => deleteProject(project.id)} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xl shadow-red-50 transition-all active:scale-95">Delete</button>
               </div>
             </div>

          </div>
        ))}
      </div>

      {/* ADD/EDIT PROJECT MODAL - (SCREENSHOT PERFECT DESIGN) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[28px] shadow-2xl animate-in zoom-in-95 duration-200">
            <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">{editingId ? 'Edit Project' : 'Create New Project'}</h2>
              <X onClick={closeModal} size={18} className="cursor-pointer text-slate-300 hover:text-slate-800 transition-colors" />
            </header>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              
              <div className="space-y-2">
                <div className="flex justify-between px-1">
                    <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Client Selection</label>
                    <button type="button" onClick={() => setIsTempClientMode(!isTempClientMode)} className="text-[10px] font-black text-indigo-600 flex items-center gap-1 uppercase tracking-tight hover:brightness-90 transition-all">
                       {isTempClientMode ? <RefreshCw size={10}/> : <Plus size={10}/>} {isTempClientMode ? "Use Registry" : "Temporary Client?"}
                    </button>
                </div>
                <div className="relative group">
                  {isTempClientMode ? (
                    <input required placeholder="Enter temporary business name..." className="w-full border border-slate-200 p-3.5 rounded-xl text-sm focus:border-indigo-400 focus:bg-slate-50 outline-none transition-all shadow-sm" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} />
                  ) : (
                    <>
                    <select required className="w-full bg-white border border-slate-200 p-3.5 rounded-xl text-sm appearance-none outline-none focus:border-indigo-400 shadow-sm font-semibold text-slate-700" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})}>
                      <option value="">Select a client</option>
                      {clients.map((c, i) => <option key={i} value={c.business_name}>{c.business_name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1.5 px-1">
                   <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Project Name</label>
                   <input required type="text" className="w-full border border-slate-200 p-3.5 rounded-xl text-sm focus:border-indigo-400 outline-none shadow-sm font-medium" value={formData.project_name} onChange={e => setFormData({...formData, project_name: e.target.value})} />
                 </div>
                 <div className="space-y-1.5 px-1">
                   <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Service Unit</label>
                   <div className="relative">
                      <select className="w-full border border-slate-200 p-3.5 rounded-xl text-sm appearance-none focus:border-indigo-400 outline-none shadow-sm font-medium" value={formData.service_type} onChange={e => setFormData({...formData, service_type: e.target.value})}>
                        <option value="">Select Category</option>
                        {serviceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                   </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1.5 px-1">
                    <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Project Cycle</label>
                    <select className="w-full border border-slate-200 p-3.5 rounded-xl text-sm appearance-none focus:border-[#6366F1] font-bold text-[#6366F1]" value={formData.project_type} onChange={e => setFormData({...formData, project_type: e.target.value})}>
                        <option value="One-Time">One-Time Project</option>
                        <option value="Recurring">Recurring Maintenance</option>
                    </select>
                 </div>
                 <div className="space-y-1.5 px-1">
                    <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Status</label>
                    <div className="relative">
                        <select className="w-full border border-slate-200 p-3.5 rounded-xl text-sm appearance-none focus:border-indigo-400 shadow-sm" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option>Planning</option><option>In Progress</option><option>In Review</option><option>Completed</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    </div>
                 </div>
              </div>

              <div className="space-y-1.5 px-1">
                 <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Deployment Deadline</label>
                 <div className="relative">
                    <input type="date" className="w-full border border-slate-200 p-3.5 rounded-xl text-sm cursor-pointer focus:border-[#6366F1] outline-none shadow-sm" onClick={e => e.target.showPicker()} value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} />
                    <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"/>
                 </div>
              </div>

              <div className="space-y-1.5 px-1">
                 <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">System Start Date</label>
                 <div className="relative">
                   <input type="date" className="w-full border border-slate-200 p-3.5 rounded-xl text-sm cursor-pointer focus:border-[#6366F1] outline-none shadow-sm" onClick={e => e.target.showPicker()} value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                   <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"/>
                 </div>
              </div>

              <footer className="pt-6 border-t border-slate-100 flex justify-end gap-3 mt-4">
                 <button onClick={closeModal} type="button" className="px-6 py-2.5 rounded-xl bg-slate-50 text-slate-500 font-extrabold text-xs tracking-tighter hover:bg-slate-100">Cancel</button>
                 <button type="submit" className="px-10 py-2.5 rounded-xl bg-[#6366F1] text-white font-black text-xs shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">
                    {editingId ? 'Save Changes' : 'Create Project'}
                 </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- UI UTILS ---------------- //

function MatrixStat({ label, value }) {
  return (
    <div className="bg-white p-7 rounded-[22px] border border-slate-100 shadow-sm flex flex-col items-center justify-center transition-all hover:shadow-md">
      <h4 className="text-4xl font-extrabold text-slate-800 tracking-tight leading-none mb-1.5">{value}</h4>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-center">{label}</p>
    </div>
  );
}

function FilterBox({ value, onChange, options, defaultLabel }) {
  return (
    <div className="relative group">
       <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none bg-white border border-slate-200 py-3.5 px-5 pr-10 rounded-xl text-[11px] font-black text-slate-700 outline-none cursor-pointer tracking-tight">
          <option value="all">{defaultLabel}</option>
          {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
       </select>
       <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors group-hover:text-indigo-600" size={14} />
    </div>
  );
}