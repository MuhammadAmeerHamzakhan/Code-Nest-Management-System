import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Plus, Search, Globe, Mail, 
  Trash2, X, Building2, Edit3, 
  ChevronDown, Calendar, Check,
  CircleDollarSign, Type, CalendarDays
} from 'lucide-react';

export default function ClientsCenter() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // FORM STATE
  const [editingId, setEditingId] = useState(null);
  const [isCustomDate, setIsCustomDate] = useState(false); 
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
      const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error.message);
    } finally {
      setLoading(false);
    }
  }

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
    setIsCustomDate(false);
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
      
      {/* HEADER */}
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

      {/* FILTERS */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text" placeholder="Search clients..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 py-3 pl-11 pr-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-[#6366F1] transition-all"
          />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
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

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard label="Total Clients" value={clients.length} color="text-slate-800" />
        <StatCard label="Active" value={clients.filter(c => c.status === 'Active').length} color="text-emerald-600" />
        <StatCard label="On Hold" value={clients.filter(c => c.status === 'On Hold').length} color="text-amber-500" />
        <StatCard label="At Risk" value={clients.filter(c => c.status === 'At Risk').length} color="text-red-600" />
      </div>

      {/* CLIENT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-20 bg-white border border-slate-100 rounded-[32px]">
             <Building2 size={48} className="text-slate-200 mb-4" />
             <p className="text-slate-500 font-semibold">No clients match your criteria.</p>
          </div>
        ) : (
          filtered.map(client => (
            <div key={client.id} className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
               <div className="flex justify-between items-start mb-6">
                 <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-lg font-bold">
                       {client.business_name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-lg leading-tight">{client.business_name}</h3>
                      <p className="text-slate-500 font-medium text-sm">{client.contact_name}</p>
                    </div>
                 </div>
                 <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider 
                   ${client.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 
                     client.status === 'On Hold' ? 'bg-amber-50 text-amber-600' : 
                     'bg-red-50 text-red-600'}`}>
                   {client.status}
                 </div>
               </div>

               <div className="space-y-3 mb-6">
                 <div className="flex items-center gap-3 text-slate-500"><Mail size={16} /><span className="text-sm font-medium">{client.email}</span></div>
                 <div className="flex items-center gap-3 text-slate-500"><Globe size={16} /><span className="text-sm font-medium">{client.website_url || 'N/A'}</span></div>
                 <div className="flex items-center gap-3 text-slate-700">
                    <CircleDollarSign size={16} className="text-slate-400" />
                    <span className="text-sm font-extrabold">${Number(client.monthly_value).toLocaleString()}/month</span>
                 </div>
               </div>

               <div className="flex flex-wrap gap-2 mb-8">
                  {(client.services || []).map((service, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-bold rounded-lg uppercase tracking-wide">
                      {service}
                    </span>
                  ))}
               </div>

               <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-medium text-slate-400">Client since</p>
                    <p className="text-[11px] font-bold text-slate-500 uppercase">
                      {client.start_date?.includes('-') ? new Date(client.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : client.start_date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setEditingId(client.id); setFormData(client); setIsModalOpen(true); }} className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">Edit</button>
                    <button onClick={() => deleteClient(client.id)} className="bg-[#FF4D4D] hover:bg-[#ff3b3b] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95">Delete</button>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden font-sans">
            <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-800">{editingId ? 'Edit Client' : 'Add New Client'}</h2>
              <X onClick={closeModal} size={18} className="cursor-pointer text-slate-400 hover:text-slate-600" />
            </header>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[85vh] overflow-y-auto">
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Name</label>
                   <input required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 outline-none focus:border-[#6366F1]" value={formData.business_name} onChange={(e) => setFormData({...formData, business_name: e.target.value})} />
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
                   <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 outline-none focus:border-[#6366F1]" value={formData.website_url} onChange={(e) => setFormData({...formData, website_url: e.target.value})} />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Value ($)</label>
                   <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 outline-none focus:border-[#6366F1]" value={formData.monthly_value} onChange={(e) => setFormData({...formData, monthly_value: e.target.value})} />
                 </div>
                 <div className="space-y-2 relative">
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</label>
                   <select className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 appearance-none outline-none focus:border-[#6366F1]" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                     <option>Active</option><option>On Hold</option><option>At Risk</option>
                   </select>
                   <ChevronDown size={14} className="absolute right-3 top-[43px] text-slate-400 pointer-events-none" />
                 </div>
               </div>

               <div className="space-y-3">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Services</label>
                 <div className="flex flex-wrap gap-2">
                   {availableServices.map(s => (
                     <button key={s} type="button" onClick={() => toggleService(s)}
                       className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${formData.services.includes(s) ? 'bg-indigo-50 border-[#6366F1] text-[#6366F1] shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                     >{s}</button>
                   ))}
                 </div>
               </div>

               {/* RE-ARCHITECTED HYBRID DATE FIELD */}
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between">
                       Start Date <span className="text-[9px] text-indigo-500 tracking-widest">{isCustomDate ? 'TEXT MODE' : 'CALENDAR MODE'}</span>
                    </label>
                    <div className="relative flex items-center group">
                      <input 
                        type={isCustomDate ? "text" : "date"} 
                        placeholder={isCustomDate ? "e.g., TBD, Q3 2026..." : ""}
                        // MAGIC ACTION: clicking the input in date mode opens picker automatically
                        onClick={(e) => !isCustomDate && e.target.showPicker()} 
                        className={`w-full bg-slate-50 border border-slate-100 rounded-xl p-3 outline-none focus:border-[#6366F1] transition-all ${!isCustomDate ? 'cursor-pointer' : ''}`} 
                        value={formData.start_date} 
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setIsCustomDate(!isCustomDate)}
                        className="absolute right-3 bg-white p-2 rounded-lg border border-slate-100 text-slate-400 hover:text-[#6366F1] shadow-sm active:scale-95 transition-all"
                        title={isCustomDate ? "Switch to Calendar" : "Switch to Text"}
                      >
                        {isCustomDate ? <CalendarDays size={14}/> : <Type size={14}/>}
                      </button>
                    </div>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</label>
                  <textarea rows="3" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 outline-none focus:border-[#6366F1]" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
               </div>

               <footer className="pt-4 border-t border-slate-50 flex justify-end gap-3">
                 <button onClick={closeModal} type="button" className="px-6 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200">Cancel</button>
                 <button type="submit" className="px-6 py-2 rounded-lg bg-[#6366F1] text-white text-xs font-bold shadow-lg shadow-indigo-100 active:scale-95">{editingId ? 'Save Changes' : 'Add Client'}</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white p-7 rounded-[22px] border border-slate-100 shadow-sm flex flex-col items-center justify-center transition-all hover:shadow-md hover:-translate-y-1">
       <h2 className={`text-4xl font-extrabold mb-1 ${color}`}>{value}</h2>
       <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}