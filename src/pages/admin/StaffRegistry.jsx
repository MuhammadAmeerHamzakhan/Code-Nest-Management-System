import React, { useState, useEffect } from 'react';
import { supabase } from "../../supabaseClient";
import { 
  Plus, Search, X, ChevronDown, 
  UserCircle2, Mail, Trash2, Edit3, 
  ShieldCheck, ShieldAlert, Type, ListFilter,
  CheckCircle2, Clock, AlertCircle, Layout
} from 'lucide-react';

export default function TeamSection() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'Developer',
    is_active: true
  });

  const standardRoles = ['Developer', 'Project Manager', 'Designer', 'QA Engineer', 'Sales', 'Marketing'];

  // --- BRAIN: REAL-TIME SYNC ENGINE ---
  useEffect(() => {
    fetchMembers();
    const channel = supabase.channel('team-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchMembers())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error) setMembers(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await supabase.from('profiles').update(formData).eq('id', editingId);
      } else {
        const { error } = await supabase.from('profiles').insert([formData]);
        if (error) throw error;
      }
      closeModal();
      fetchMembers();
    } catch (err) { 
      alert("Matrix Error: " + err.message); 
    }
  };

  const handleEdit = (member) => {
    setEditingId(member.id);
    setFormData({
      full_name: member.full_name,
      email: member.email,
      role: member.role,
      is_active: member.is_active
    });
    setIsCustomRole(!standardRoles.includes(member.role));
    setIsModalOpen(true);
  };

  const deleteMember = async (id) => {
    if (window.confirm("Permanently remove this team member?")) {
      await supabase.from('profiles').delete().eq('id', id);
      fetchMembers();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setIsCustomRole(false);
    setFormData({ full_name: '', email: '', role: 'Developer', is_active: true });
  };

  const filtered = members.filter(m => {
    const matchesSearch = m.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh] w-full">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#6366F1]"></div>
    </div>
  );

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-[#F8FAFC] animate-in fade-in duration-500 font-sans">
      
      {/* 1. HEADER SECTION */}
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Team</h1>
           <p className="text-slate-500 text-sm mt-1 font-medium">Manage team members and their roles</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#6366F1] hover:bg-[#585af2] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 active:scale-95 transition-all"
        >
          <Plus size={18} strokeWidth={3} /> Add Member
        </button>
      </div>

      {/* 2. SEARCH & FILTER ROW */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
         <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              className="w-full bg-white border border-slate-100 py-3.5 pl-11 pr-4 rounded-xl text-sm focus:border-indigo-400 outline-none transition-all shadow-sm"
              placeholder="Search team members..."
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         <div className="relative">
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-100 py-3.5 px-6 pr-12 rounded-xl text-sm font-semibold text-slate-700 outline-none cursor-pointer min-w-[180px]"
            >
               <option value="all">All Roles</option>
               {standardRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
         </div>
      </div>

      {/* 3. STATS STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard label="Total Members" value={members.length} />
        <StatCard label="Active" value={members.filter(m=>m.is_active).length} color="text-slate-800" />
        <StatCard label="Developers" value={members.filter(m=>m.role==='Developer').length} color="text-slate-800" />
        <StatCard label="Project Managers" value={members.filter(m=>m.role==='Project Manager').length} color="text-slate-800" />
      </div>

      {/* 4. TEAM CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.length === 0 ? (
          <div className="col-span-full py-20 bg-white rounded-[32px] border border-slate-100 flex flex-col items-center">
             <Layout size={40} className="text-slate-100 mb-2"/>
             <p className="text-slate-400 font-bold">No results match your criteria.</p>
          </div>
        ) : (
          filtered.map(member => (
            <div key={member.id} className="bg-white border border-slate-100 rounded-[28px] p-8 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col">
               
               {/* TOP: PROFILE HEADER */}
               <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#6366F1] flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-indigo-100">
                        {member.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-[18px] font-black text-slate-800 leading-tight tracking-tight">{member.full_name}</h3>
                      <p className="text-xs font-semibold text-slate-400 mt-1">{member.email}</p>
                      <span className="mt-2 inline-block px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg tracking-wider">
                         {member.role}
                      </span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase 
                    ${member.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
               </div>

               {/* MID: TASK STATS */}
               <div className="grid grid-cols-4 gap-4 py-8 mb-4 border-b border-t border-slate-50 text-center">
                  <InternalStat value="0" label="Total" color="text-slate-800" />
                  <InternalStat value="0" label="In Progress" color="text-blue-500" />
                  <InternalStat value="0" label="Completed" color="text-emerald-500" />
                  <InternalStat value="0" label="Overdue" color="text-red-500" />
               </div>

               {/* BOTTOM: ACTIONS BAR */}
               <div className="pt-2 flex justify-between items-center text-[13px] font-bold">
                  <button className="text-slate-400 hover:text-indigo-600 transition-colors">Deactivate</button>
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleEdit(member)} className="text-slate-600 hover:text-indigo-600 transition-colors">Edit</button>
                    <button 
                      onClick={() => deleteMember(member.id)} 
                      className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-red-100 active:scale-95 transition-all"
                    >
                      Remove
                    </button>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>

      {/* 5. MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <header className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-white">
                 <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Credentials' : 'Add Team Member'}</h2>
                 <X onClick={closeModal} size={18} className="text-slate-400 cursor-pointer hover:text-slate-800" />
              </header>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Member Name</label>
                    <input required className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm outline-none focus:border-indigo-400 focus:bg-white" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="Muhammad Ameer Hamza" />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input type="email" required className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm outline-none focus:border-indigo-400 focus:bg-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="ameer@codenest.com" />
                 </div>

                 <div className="space-y-1.5 relative">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Job Role</label>
                      <button type="button" onClick={() => setIsCustomRole(!isCustomRole)} className="text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-1">
                         {isCustomRole ? <ShieldCheck size={12}/> : <Type size={12}/>} Switch Input
                      </button>
                    </div>
                    <div className="relative group">
                      {isCustomRole ? (
                        <input required className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm outline-none focus:border-indigo-400 focus:bg-white transition-all" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="Enter custom role title..." />
                      ) : (
                        <>
                        <select 
                          className="w-full appearance-none bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm outline-none focus:border-indigo-400 focus:bg-white" 
                          value={formData.role} 
                          onChange={e => setFormData({...formData, role: e.target.value})}
                        >
                           {standardRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </>
                      )}
                    </div>
                 </div>

                 <div className="flex items-center gap-3 py-1 cursor-pointer ml-1">
                    <input 
                      type="checkbox" id="active-toggle"
                      className="w-5 h-5 rounded border-slate-200 text-indigo-600 focus:ring-indigo-200 cursor-pointer transition-all"
                      checked={formData.is_active} 
                      onChange={e => setFormData({...formData, is_active: e.target.checked})}
                    />
                    <label htmlFor="active-toggle" className="text-sm font-bold text-slate-600 cursor-pointer">Member currently active</label>
                 </div>

                 <footer className="pt-6 border-t border-slate-50 flex justify-end gap-3">
                    <button type="button" onClick={closeModal} className="px-10 py-3 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs hover:bg-slate-200 transition-colors">Cancel</button>
                    <button type="submit" className="px-10 py-3 rounded-xl bg-[#6366F1] text-white font-bold text-xs shadow-xl shadow-indigo-100 active:scale-95">
                       {editingId ? 'Push Update' : 'Register Member'}
                    </button>
                 </footer>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

// ---------------- STYLING SUB-COMPONENTS ---------------- //

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white p-7 rounded-[22px] border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center space-y-1.5 transition-all hover:shadow-md">
      <h4 className={`text-4xl font-extrabold ${color || 'text-slate-800'} tracking-tighter`}>{value}</h4>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function InternalStat({ value, label, color }) {
    return (
        <div className="flex flex-col items-center gap-0.5">
           <span className={`text-xl font-bold ${color}`}>{value}</span>
           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{label}</span>
        </div>
    );
}