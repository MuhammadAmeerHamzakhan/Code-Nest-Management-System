import React, { useState, useEffect } from 'react';
import { supabase } from "../../supabaseClient";
import { 
  Plus, Search, Filter, Trash2, 
  Clock, ClipboardList, X, ChevronDown, Calendar
} from 'lucide-react';

export default function ProjectMatrix() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]); // Brain: Used to populate the "Client" dropdown
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');

  // New Project Form State
  const [newProj, setNewProj] = useState({
    project_name: '', 
    client_name: '', 
    status: 'Planning', 
    deadline: '', 
    service_type: '',
    start_date: new Date().toISOString().split('T')[0] // Default to Today
  });

  const serviceOptions = ['Web Development', 'Mobile App', 'UI/UX Design', 'SEO', 'Consulting', 'Maintenance'];

  // --- BRAIN: DATA SYNC & FETCH ---
  useEffect(() => {
    fetchMatrixData();

    // Setup Realtime: Every time a project is added, it pops up immediately
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

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      // 1. Handshake with Supabase
      const { data, error } = await supabase
        .from('projects')
        .insert([newProj]);

      if (error) {
        alert(`Creation Failed: ${error.message}`);
        console.error("SQL ERROR:", error);
      } else {
        // 2. Clear UI on Success
        setIsModalOpen(false);
        setNewProj({
          project_name: '', client_name: '', status: 'Planning', 
          deadline: '', service_type: '', start_date: new Date().toISOString().split('T')[0]
        });
        fetchMatrixData(); // Force Refresh
      }
    } catch (err) {
      alert("Unexpected Link Error. See Console.");
    }
  };

  const purgeProject = async (id) => {
    if (window.confirm("Permanently delete this project node?")) {
      await supabase.from('projects').delete().eq('id', id);
      fetchMatrixData();
    }
  };

  // Filter Logic for the List View
  const filtered = projects.filter(p => {
    const nameMatch = (p.project_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = statusFilter === 'all' || p.status === statusFilter;
    const clientMatch = clientFilter === 'all' || p.client_name === clientFilter;
    return nameMatch && statusMatch && clientMatch;
  });

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center w-full bg-[#F8FAFC]">
       <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#6366F1]"></div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500 font-sans tracking-tight bg-[#F8FAFC]">
      
      {/* 1. HEADER (As seen in Screenshot) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Projects</h1>
           <p className="text-slate-500 mt-1 font-medium text-sm">Manage client projects and deliverables</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#6366f1] hover:bg-[#585af2] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> New Project
        </button>
      </div>

      {/* 2. SEARCH & FILTER ROW (Aligned horizontally as requested) */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
         <div className="flex-1 relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#6366f1] transition-colors" size={18} />
            <input 
              className="w-full bg-white border border-slate-200 py-3 pl-11 pr-4 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-[#6366f1] transition-all shadow-sm"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         <div className="flex gap-4 w-full lg:w-fit">
            <FilterSelect label="All Clients" val={clientFilter} setVal={setClientFilter} opts={clients.map(c=>c.business_name)} />
            <FilterSelect label="All Status" val={statusFilter} setVal={setStatusFilter} opts={['Planning', 'In Progress', 'In Review', 'Completed']} />
         </div>
      </div>

      {/* 3. CENTERED STATS ROW (Identical values from screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MatrixStat label="Total Projects" value={projects.length} />
        <MatrixStat label="In Progress" value={projects.filter(p=>p.status==='In Progress').length} />
        <MatrixStat label="In Review" value={projects.filter(p=>p.status==='In Review').length} />
        <MatrixStat label="Completed" value={projects.filter(p=>p.status==='Completed').length} />
      </div>

      {/* 4. MAIN PROJECT VIEW AREA */}
      <div className="bg-white border border-slate-200 rounded-[35px] min-h-[450px] overflow-hidden flex flex-col shadow-sm">
        {filtered.length === 0 ? (
          /* EMPTY STATE (Perfectly Aligned like your screenshot) */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95 duration-500">
             <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 border border-slate-100">
                <ClipboardList size={36} className="text-slate-300" />
             </div>
             <h3 className="text-xl font-bold text-slate-800">No projects found</h3>
             <p className="text-sm text-slate-500 mt-2 mb-8">Create your first project to get started</p>
             <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-[#6366f1] hover:bg-[#585af2] text-white px-10 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
             >
                Create Project
             </button>
          </div>
        ) : (
          /* PROJECT DATA LIST */
          <div className="overflow-x-auto p-4">
             <table className="w-full text-left">
               <thead className="bg-slate-50/50">
                 <tr className="border-b border-slate-100 font-sans">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Project Context</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Execution Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Time Constraint</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Delete</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filtered.map(proj => (
                    <tr key={proj.id} className="hover:bg-slate-50/40 group">
                       <td className="px-6 py-5">
                          <p className="font-bold text-slate-800 text-[14px] leading-tight">{proj.project_name}</p>
                          <p className="text-[10px] text-[#6366f1] font-bold uppercase mt-1 tracking-widest">{proj.client_name}</p>
                       </td>
                       <td className="px-6 py-5 text-center">
                          <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                            proj.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            proj.status === 'In Progress' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-500'
                          }`}>
                             {proj.status}
                          </span>
                       </td>
                       <td className="px-6 py-5 font-bold text-[12px] text-slate-500">
                          <div className="flex items-center gap-2 italic tracking-tighter uppercase"><Clock size={14}/> {proj.deadline}</div>
                       </td>
                       <td className="px-6 py-5 text-right">
                          <button onClick={() => purgeProject(proj.id)} className="p-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                       </td>
                    </tr>
                  ))}
               </tbody>
             </table>
          </div>
        )}
      </div>

      {/* 5. ADD MODAL: EXACTLY AS YOUR SCREENSHOT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                  <h2 className="text-xl font-bold text-slate-800">Create New Project</h2>
                  <X onClick={() => setIsModalOpen(false)} size={18} className="cursor-pointer text-slate-400 hover:text-slate-800 transition-colors" />
              </header>

              <form onSubmit={handleCreateProject} className="p-8 space-y-6">
                  {/* SELECT A CLIENT SECTION */}
                  <div className="space-y-2">
                     <label className="text-sm font-semibold text-slate-500 ml-1">Client</label>
                     <div className="relative">
                        <select 
                           className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-sm appearance-none outline-none focus:border-[#6366f1] focus:bg-white"
                           required
                           onChange={e => setNewProj({...newProj, client_name: e.target.value})}
                        >
                           <option value="">Select a client</option>
                           {clients.map((c, i) => (
                              <option key={i} value={c.business_name}>{c.business_name}</option>
                           ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-500 ml-1">Project Name</label>
                        <input 
                           className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-sm outline-none focus:border-[#6366f1] focus:bg-white transition-all" 
                           required placeholder="E.g., Web App Revamp"
                           value={newProj.project_name}
                           onChange={e => setNewProj({...newProj, project_name: e.target.value})} 
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-500 ml-1">Service Type</label>
                        <div className="relative">
                           <select className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-sm appearance-none outline-none" onChange={e => setNewProj({...newProj, service_type: e.target.value})}>
                              <option value="">Select an option</option>
                              {serviceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                           </select>
                           <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2 relative">
                        <label className="text-sm font-semibold text-slate-500 ml-1">Status</label>
                        <select className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-sm appearance-none" value={newProj.status} onChange={e => setNewProj({...newProj, status: e.target.value})}>
                           <option>Planning</option><option>In Progress</option><option>In Review</option><option>Completed</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-[46px] text-slate-400" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-500 ml-1">Deadline</label>
                        <div className="relative">
                           <input type="date" className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-sm outline-none" required onChange={e => setNewProj({...newProj, deadline: e.target.value})} />
                           <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14}/>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-2 max-w-sm">
                     <label className="text-sm font-semibold text-slate-500 ml-1">Start Date</label>
                     <div className="relative">
                        <input type="date" className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-sm outline-none" value={newProj.start_date} onChange={e => setNewProj({...newProj, start_date: e.target.value})} />
                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14}/>
                     </div>
                  </div>

                  <footer className="pt-8 flex justify-end gap-3 border-t border-slate-50">
                     <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-2.5 rounded-xl bg-slate-50 text-slate-500 font-bold text-xs hover:bg-slate-100">Cancel</button>
                     <button type="submit" className="px-10 py-2.5 rounded-xl bg-[#6366f1] text-white font-bold text-xs shadow-lg shadow-indigo-100 hover:brightness-105 active:scale-95 transition-all">Create Project</button>
                  </footer>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

// ---------------- UI COMPONENTS ---------------- //

function MatrixStat({ label, value }) {
  return (
    <div className="bg-white p-10 rounded-[28px] border border-slate-100 shadow-sm text-center flex flex-col justify-center space-y-1.5 hover:shadow-md transition-shadow">
      <h4 className="text-3xl font-black text-slate-800 tracking-tight leading-none">{value}</h4>
      <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function FilterSelect({ label, val, setVal, opts }) {
  return (
    <div className="relative">
       <select value={val} onChange={(e) => setVal(e.target.value)} className="appearance-none bg-white border border-slate-200 py-3 pl-4 pr-12 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer shadow-sm min-w-[180px]">
          <option value="all">{label}</option>
          {opts.map((o, i) => <option key={i} value={o}>{o}</option>)}
       </select>
       <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
    </div>
  );
}