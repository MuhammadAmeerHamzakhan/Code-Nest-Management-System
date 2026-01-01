import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Plus, Search, Globe, Mail, 
  Trash2, X, Building2, Edit3, 
  ChevronDown, Calendar, Check
} from 'lucide-react';

export default function ClientsCenter() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // FORM STATE - Matched to your Modal Screenshot
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    business_name: '', contact_name: '', email: '', 
    website_url: '', monthly_value: 0, status: 'Active', 
    services: [], start_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const availableServices = [
    'Web Development', 'Mobile App', 'UI/UX Design', 
    'SEO', 'Maintenance', 'Consulting'
  ];

  // BRAIN: FETCH & REALTIME SYNC
  useEffect(() => {
    fetchClients();
    
    // Subscribe to realtime changes so it updates automatically "Boom!"
    const channel = supabase
      .channel('public:clients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        fetchClients();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchClients() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error.message);
    } finally {
      setLoading(false);
    }
  }

  // LOGIC: HANDLE SERVICES TOGGLE
  const toggleService = (service) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await supabase.from('clients').update(formData).eq('id', editingId);
      } else {
        const { error } = await supabase.from('clients').insert([formData]);
        if (error) throw error;
      }
      closeModal();
      fetchClients();
    } catch (error) {
      alert("Database Error: " + error.message);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      business_name: '', contact_name: '', email: '', 
      website_url: '', monthly_value: 0, status: 'Active', 
      services: [], start_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const deleteClient = async (id) => {
    if (window.confirm("Delete this client permanently?")) {
      await supabase.from('clients').delete().eq('id', id);
      fetchClients();
    }
  };

  const filtered = clients.filter(c => {
    const matchesSearch = c.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.contact_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh] w-full">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#6366F1]"></div>
    </div>
  );

  return (
    <div className="flex-1 p-8 bg-[#F8FAFC] min-h-screen font-sans animate-in fade-in duration-500">
      
      {/* HEADER ROW */}
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Clients</h1>
           <p className="text-slate-500 text-sm mt-1 font-medium">Manage your client relationships</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#6366F1] hover:bg-[#585af2] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={20} strokeWidth={3} /> Add Client
        </button>
      </div>

      {/* FILTER ROW (Exact alignment from screenshot) */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 py-3 pl-11 pr-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-[#6366F1] transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="relative">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-200 py-3 pl-4 pr-12 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="At Risk">At Risk</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
      </div>

      {/* STATS PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Clients" value={clients.length} color="text-slate-800" />
        <StatCard label="Active" value={clients.filter(c => c.status === 'Active').length} color="text-emerald-600" />
        <StatCard label="On Hold" value={clients.filter(c => c.status === 'On Hold').length} color="text-amber-500" />
        <StatCard label="At Risk" value={clients.filter(c => c.status === 'At Risk').length} color="text-red-600" />
      </div>

      {/* DATA CONTENT AREA */}
      <div className="bg-white border border-slate-200 rounded-3xl min-h-[450px] overflow-hidden flex flex-col shadow-sm">
        {filtered.length === 0 ? (
          /* EMPTY STATE (Exactly like your screenshot) */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 border border-slate-100">
               <Building2 size={36} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No clients found</h3>
            <p className="text-sm text-slate-500 mt-1 mb-8">Add your first client to get started</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#6366F1] hover:bg-[#585af2] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md"
            >
              Add Client
            </button>
          </div>
        ) : (
          /* LIST TABLE */
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                   <tr className="border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Info</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Value ($)</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Services</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filtered.map(c => (
                     <tr key={c.id} className="hover:bg-slate-50/40 group">
                        <td className="px-6 py-5">
                           <p className="font-bold text-slate-800">{c.business_name}</p>
                           <p className="text-xs text-indigo-500 truncate max-w-[150px]">{c.website_url}</p>
                        </td>
                        <td className="px-6 py-5">
                           <p className="text-sm font-semibold text-slate-700">{c.contact_name}</p>
                           <p className="text-xs text-slate-400">{c.email}</p>
                        </td>
                        <td className="px-6 py-5 font-bold text-slate-700">${Number(c.monthly_value).toLocaleString()}</td>
                        <td className="px-6 py-5">
                           <div className="flex gap-1 flex-wrap">
                              {(c.services || []).slice(0, 2).map((s, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-[#6366F1] rounded text-[10px] font-bold uppercase">{s}</span>
                              ))}
                              {(c.services?.length > 2) && <span className="text-[10px] text-slate-400 font-bold">+{c.services.length - 2}</span>}
                           </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingId(c.id); setFormData(c); setIsModalOpen(true); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600"><Edit3 size={16}/></button>
                              <button onClick={() => deleteClient(c.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                           </div>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </div>

      {/* MODAL - DESIGNED EXACTLY AS SCREENSHOT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden font-sans">
            <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="font-bold text-slate-800">{editingId ? 'Edit Client' : 'Add New Client'}</h2>
              <X onClick={closeModal} size={18} className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors" />
            </header>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Name</label>
                   <input required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-[#6366F1]" value={formData.business_name} onChange={(e) => setFormData({...formData, business_name: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Name</label>
                   <input required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 outline-none focus:border-[#6366F1]" value={formData.contact_name} onChange={(e) => setFormData({...formData, contact_name: e.target.value})} />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
                   <input required type="email" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 outline-none focus:border-[#6366F1]" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Website URL</label>
                   <input type="text" placeholder="https://..." className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 outline-none focus:border-[#6366F1]" value={formData.website_url} onChange={(e) => setFormData({...formData, website_url: e.target.value})} />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Value ($)</label>
                   <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 outline-none focus:border-[#6366F1]" value={formData.monthly_value} onChange={(e) => setFormData({...formData, monthly_value: e.target.value})} />
                 </div>
                 <div className="space-y-2 relative">
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</label>
                   <select className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 appearance-none font-semibold outline-none" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                     <option>Active</option>
                     <option>On Hold</option>
                     <option>At Risk</option>
                   </select>
                   <ChevronDown size={14} className="absolute right-3 top-[43px] text-slate-400" />
                 </div>
               </div>

               {/* SERVICES SECTION FROM YOUR SCREENSHOT */}
               <div className="space-y-3">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Services</label>
                 <div className="flex flex-wrap gap-2">
                   {availableServices.map(s => (
                     <button 
                       key={s} type="button" 
                       onClick={() => toggleService(s)}
                       className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        formData.services.includes(s) 
                          ? 'bg-indigo-50 border-[#6366F1] text-[#6366F1] shadow-sm shadow-indigo-100' 
                          : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-300'
                       }`}
                     >
                       {s}
                     </button>
                   ))}
                 </div>
               </div>

               <div className="space-y-2 relative">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</label>
                  <div className="relative">
                    <input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 outline-none focus:border-[#6366F1] appearance-none" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                    <Calendar className="absolute right-4 top-3 text-slate-400" size={16}/>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</label>
                  <textarea rows="3" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 outline-none focus:border-[#6366F1]" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
               </div>

               <footer className="pt-4 border-t border-slate-50 flex justify-end gap-3">
                 <button onClick={closeModal} type="button" className="px-6 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                 <button type="submit" className="px-6 py-2 rounded-lg bg-[#6366F1] text-white text-xs font-bold hover:bg-[#585af2] transition-colors shadow-lg">Add Client</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// SHARED STAT CARD COMPONENT
function StatCard({ label, value, color }) {
  return (
    <div className="bg-white p-7 rounded-[22px] border border-slate-100 shadow-sm flex flex-col items-center justify-center transition-all hover:shadow-md">
       <h2 className={`text-4xl font-extrabold mb-1 ${color}`}>{value}</h2>
       <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}