import React, { useState, useEffect } from 'react';
import { supabase } from "../../supabaseClient";
import { 
  Plus, Search, X, ChevronDown, 
  UserCircle2, Mail, Trash2, Edit3, 
  CheckCircle2, AlertCircle, ShieldCheck
} from 'lucide-react';

export default function TeamSection() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal Form State (Exactly matching Screenshot #2)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'Developer',
    is_active: true
  });

  // REAL-TIME SYNC ENGINE
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

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('profiles').insert([formData]);
      if (!error) {
        setIsModalOpen(false);
        setFormData({ full_name: '', email: '', role: 'Developer', is_active: true });
        fetchMembers();
      } else {
        alert(error.message);
      }
    } catch (err) { alert("Failed to connect to database."); }
  };

  const deleteMember = async (id) => {
    if (window.confirm("Permanently remove this team member?")) {
      await supabase.from('profiles').delete().eq('id', id);
      fetchMembers();
    }
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
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500 font-sans tracking-tight bg-[#F8FAFC] min-h-screen">
      
      {/* 1. HEADER SECTION */}
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Team</h1>
           <p className="text-slate-500 text-sm mt-1 font-medium">Manage team members and their roles</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#6366f1] hover:bg-[#585af2] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={20} strokeWidth={3} /> Add Member
        </button>
      </div>

      {/* 2. FILTER & SEARCH (Pixel Perfect to Screenshot #1) */}
      <div className="flex gap-4 mb-4">
         <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" size={18} />
            <input 
              className="w-full bg-white border border-slate-200 py-3 pl-11 pr-4 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-[#6366f1] transition-all"
              placeholder="Search team members..."
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         <div className="relative">
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 py-3 px-6 pr-12 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 min-w-[180px]"
            >
               <option value="all">All Roles</option>
               <option>Developer</option>
               <option>Project Manager</option>
               <option>Designer</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
         </div>
      </div>

      {/* 3. CENTERED STATS BOXES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Members" value={members.length} />
        <StatCard label="Active" value={members.filter(m=>m.is_active).length} color="text-emerald-500" />
        <StatCard label="Developers" value={members.filter(m=>m.role==='Developer').length} color="text-indigo-500" />
        <StatCard label="Project Managers" value={members.filter(m=>m.role==='Project Manager').length} color="text-[#A855F7]" />
      </div>

      {/* 4. CONTENT LIST AREA */}
      <div className="bg-white border border-slate-200 rounded-[35px] min-h-[450px] overflow-hidden flex flex-col shadow-sm">
        {filtered.length === 0 ? (
          /* EMPTY STATE ILLUSTRATION (Matches screenshot) */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95">
             <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
                <UserCircle2 size={40} className="text-slate-300" />
             </div>
             <h3 className="text-lg font-bold text-slate-800">No team members found</h3>
             <p className="text-sm text-slate-500 mt-2 mb-8 tracking-tight">Add your first team member to get started</p>
             <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-[#6366f1] hover:bg-[#585af2] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md"
             >
                Add Member
             </button>
          </div>
        ) : (
          /* TABLE VIEW FOR LIVE DATA */
          <div className="overflow-x-auto p-4">
             <table className="w-full text-left">
               <thead className="bg-slate-50/50">
                 <tr className="border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Team Member</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {filtered.map(m => (
                   <tr key={m.id} className="hover:bg-slate-50/50 group transition-all">
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-500 text-sm">
                               {m.full_name?.charAt(0)}
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-800 text-sm">{m.full_name}</p>
                              {m.is_active && <ShieldCheck size={14} className="text-emerald-500" />}
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                            <Mail size={14} className="opacity-40"/> {m.email}
                         </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                         <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                           m.role === 'Developer' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                           m.role === 'Project Manager' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-slate-50 text-slate-400'
                         }`}>
                           {m.role}
                         </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                         <button onClick={() => deleteMember(m.id)} className="p-2 text-slate-200 hover:text-red-500 transition-opacity opacity-0 group-hover:opacity-100">
                            <Trash2 size={16}/>
                         </button>
                      </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}
      </div>

      {/* ADD MEMBER MODAL - PIXEL PERFECT TO SCREENSHOT #2 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[28px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <header className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
                 <h2 className="text-xl font-bold text-slate-800">Add Team Member</h2>
                 <X onClick={() => setIsModalOpen(false)} size={18} className="text-slate-400 cursor-pointer hover:text-slate-800" />
              </header>

              <form onSubmit={handleAddMember} className="p-8 space-y-5 font-sans">
                 {/* Name Input */}
                 <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-500 ml-1">Name</label>
                    <input required className="w-full bg-white border border-slate-200 p-3.5 rounded-xl text-sm outline-none focus:border-[#6366f1] focus:bg-white" onChange={e => setFormData({...formData, full_name: e.target.value})} />
                 </div>

                 {/* Email Input */}
                 <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-500 ml-1">Email</label>
                    <input type="email" required className="w-full bg-white border border-slate-200 p-3.5 rounded-xl text-sm outline-none focus:border-[#6366f1] focus:bg-white" onChange={e => setFormData({...formData, email: e.target.value})} />
                 </div>

                 {/* Role Dropdown */}
                 <div className="space-y-1.5 relative">
                    <label className="text-sm font-semibold text-slate-500 ml-1">Role</label>
                    <div className="relative">
                      <select 
                        className="w-full appearance-none bg-white border border-slate-200 p-3.5 rounded-xl text-sm outline-none focus:border-[#6366f1]" 
                        value={formData.role} 
                        onChange={e => setFormData({...formData, role: e.target.value})}
                      >
                         <option>Developer</option>
                         <option>Project Manager</option>
                         <option>Designer</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                 </div>

                 {/* Active Checkbox (Matches pink/indigo check in screenshot) */}
                 <div className="flex items-center gap-3 py-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      id="active"
                      className="w-5 h-5 rounded border-slate-200 text-[#6366f1] focus:ring-[#6366f1]/20 cursor-pointer"
                      checked={formData.is_active} 
                      onChange={e => setFormData({...formData, is_active: e.target.checked})}
                    />
                    <label htmlFor="active" className="text-sm font-medium text-slate-600 select-none cursor-pointer">Active member</label>
                 </div>

                 <footer className="pt-6 border-t border-slate-50 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-2.5 rounded-xl bg-slate-50 text-slate-500 font-bold text-sm hover:bg-slate-100 transition-colors">Cancel</button>
                    <button type="submit" className="px-8 py-2.5 rounded-xl bg-[#6366f1] text-white font-bold text-sm shadow-xl shadow-indigo-100 hover:brightness-110 active:scale-95 transition-all">Add Member</button>
                 </footer>
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
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm text-center flex flex-col justify-center space-y-1 hover:shadow-md transition-shadow">
      <h4 className={`text-3xl font-black ${color || 'text-slate-800'} leading-none`}>{value}</h4>
      <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}