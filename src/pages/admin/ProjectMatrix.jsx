import React, { useState, useEffect } from 'react';
import { supabase } from "../../supabaseClient";
import { 
  Briefcase, Plus, Search, Filter, Activity, 
  Trash2, Terminal, Zap, CheckCircle, Clock, Layers
} from 'lucide-react';

export default function ProjectMatrix() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newProj, setNewProj] = useState({
    project_name: '', client_name: '', status: 'In Progress', deadline: '', service_type: 'Web Dev'
  });

  useEffect(() => {
    fetchMatrixData();
    const sub = supabase.channel('project-matrix-sync')
      .on('postgres_changes', { event: '*', table: 'projects' }, () => fetchMatrixData())
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const fetchMatrixData = async () => {
    const { data: projs } = await supabase.from('projects').select('*');
    const { data: tks } = await supabase.from('tasks').select('*');
    setProjects(projs || []);
    setTasks(tks || []);
    setLoading(false);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('projects').insert([newProj]);
    if (!error) {
      setIsModalOpen(false);
      fetchMatrixData();
    }
  };

  const purgeProject = async (id) => {
    if (window.confirm("PURGE NODE CLUSTER?")) {
      await supabase.from('projects').delete().eq('id', id);
    }
  };

  // PROGRESS LOGIC
  const getProgress = (projName) => {
    const projTasks = tasks.filter(t => t.project_name === projName);
    if (projTasks.length === 0) return 0;
    return Math.round((projTasks.filter(t => t.status === 'Completed').length / projTasks.length) * 100);
  };

  // CRITICAL: THE "WHITE SCREEN" FIX IS IN THIS FILTER LOGIC
  const filtered = projects.filter(p => {
    const nameMatch = (p.project_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = statusFilter === 'all' || p.status === statusFilter;
    return nameMatch && statusMatch;
  });

  if (loading) return <div className="flex h-[40vh] items-center justify-center"><Zap size={40} className="animate-pulse text-[#2b945f]" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-black italic uppercase">
      
      {/* 1. COMPACT COMMAND HEADER */}
      <div className="bg-[#0c3740] p-10 rounded-[40px] shadow-xl relative overflow-hidden flex flex-wrap justify-between items-end border-b-8 border-[#2b945f]">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 text-[#2b945f]">
            <Layers size={14} />
            <span className="text-[8px] tracking-[0.5em]">SYSTEM RELEASE HUB</span>
          </div>
          <h1 className="text-3xl tracking-tighter text-white">Execution Matrix</h1>
          <p className="text-white/20 text-[8px] tracking-[0.4em] mt-3">Active Pipeline Grid Interface</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="relative z-10 bg-[#2b945f] text-white px-8 py-4 rounded-2xl text-[10px] shadow-2xl hover:brightness-110 active:translate-y-2 transition-all border-b-4 border-black"
        >
          <Plus size={16} className="inline mr-2" /> Establish Matrix Node
        </button>
      </div>

      {/* 2. DENSITY SCANNER */}
      <div className="flex gap-4">
        <div className="flex-1 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-50 flex items-center gap-4">
          <Search size={16} className="text-slate-300" />
          <input 
            className="w-full bg-transparent text-[10px] outline-none" 
            placeholder="SCAN CLUSTER NODES..."
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="bg-[#0c3740] text-white text-[8px] px-6 py-2 rounded-2xl outline-none"
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">ALL STATUS</option>
          <option value="In Progress">ACTIVE</option>
          <option value="Review">REVIEW</option>
          <option value="Completed">STABLE</option>
        </select>
      </div>

      {/* 3. COMPACT MATRIX STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MatrixStat label="Nodes" value={projects.length} color="text-black" />
        <MatrixStat label="Exec" value={projects.filter(p => p.status === 'In Progress').length} color="text-indigo-600" />
        <MatrixStat label="Risk" value={projects.filter(p => p.status === 'Review').length} color="text-amber-500" />
        <MatrixStat label="Stable" value={projects.filter(p => p.status === 'Completed').length} color="text-[#2b945f]" />
      </div>

      {/* 4. MATRIX CARDS: DENSITY LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
        {filtered.map((proj) => {
          const progress = getProgress(proj.project_name);
          return (
            <div key={proj.id} className="bg-white p-8 rounded-[35px] border-2 border-slate-50 hover:border-[#2b945f] shadow-sm relative overflow-hidden transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl tracking-tighter text-black">{proj.project_name}</h3>
                  <p className="text-[8px] text-[#2b945f] mt-1 tracking-widest">{proj.client_name || 'MASTER_ID'}</p>
                </div>
                <div className="bg-slate-50 text-slate-400 text-[7px] px-3 py-1 rounded-lg border">{proj.status}</div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-[8px] mb-2 opacity-50">
                   <span>Synergy Index</span>
                   <span>{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-50 rounded-full border border-slate-50">
                   <div className="bg-[#2b945f] h-full rounded-full transition-all duration-1000 shadow-xl" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                 <div className="flex gap-4 text-slate-300 items-center">
                    <Clock size={12}/> <span className="text-[8px]">{proj.deadline || 'NO_TIME_LIMIT'}</span>
                 </div>
                 <div className="flex gap-3">
                    <button className="p-2 text-[#2b945f] bg-[#2b945f]/5 rounded-lg border border-[#2b945f]/10"><Terminal size={14}/></button>
                    <button onClick={() => purgeProject(proj.id)} className="p-2 text-red-100 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={16}/></button>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD MATRIX NODE MODAL: 100% SCALE UI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0c3740]/90 backdrop-blur-xl z-[9999] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-[500px] rounded-[45px] overflow-hidden border-[8px] border-white shadow-2xl animate-in zoom-in-95">
              <div className="bg-black p-8 text-white">
                  <h2 className="text-xl">Node Allocation Layer</h2>
                  <p className="text-[9px] text-[#2b945f] mt-1 font-bold">Protocol Matrix Establishment</p>
              </div>
              <form onSubmit={handleCreateProject} className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[8px] text-slate-300">CLUSTER_ID</label>
                        <input className="w-full bg-slate-50 p-4 rounded-xl border-none text-[11px] outline-none ring-2 ring-transparent focus:ring-[#2b945f]/30 transition-all" onChange={e => setNewProj({...newProj, project_name: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[8px] text-slate-300">TARGET_CLIENT</label>
                        <input className="w-full bg-slate-50 p-4 rounded-xl border-none text-[11px] outline-none" onChange={e => setNewProj({...newProj, client_name: e.target.value})} />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[8px] text-slate-300">OP_STATUS</label>
                        <select className="w-full bg-slate-50 p-4 rounded-xl text-[11px]" onChange={e => setNewProj({...newProj, status: e.target.value})}>
                           <option>In Progress</option><option>Review</option><option>Completed</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[8px] text-slate-300">SYNC_LIMIT</label>
                        <input type="date" className="w-full bg-slate-50 p-4 rounded-xl text-[11px]" onChange={e => setNewProj({...newProj, deadline: e.target.value})} />
                     </div>
                  </div>
                  <button type="submit" className="w-full bg-[#0c3740] text-white py-6 rounded-[30px] shadow-2xl border-b-8 border-[#2b945f] hover:brightness-110 active:translate-y-2 transition-all">Execute Establishing sequence</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-center text-[7px] text-slate-200 mt-4 underline decoration-slate-200/20">ABORT COMMAND</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

function MatrixStat({ label, value, color }) {
  return (
    <div className="bg-white p-6 rounded-[35px] border border-slate-50 shadow-sm text-center">
      <p className="text-[8px] text-slate-300 mb-1">{label}</p>
      <h4 className={`text-3xl ${color} leading-none mb-1`}>{value}</h4>
      <div className="h-0.5 w-6 bg-slate-50 mx-auto mt-2"></div>
    </div>
  );
}