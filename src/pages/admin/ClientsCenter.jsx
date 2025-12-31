import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Plus, Search, UserCheck, Globe, Mail, 
  TrendingUp, Activity, Trash2, X, Filter,
  Fingerprint, Briefcase, Zap, DollarSign, Edit3
} from 'lucide-react';

export default function ClientsCenter() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // MODAL FORM STATE
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    business_name: '', website_url: '', contact_name: '', email: '',
    monthly_value: 0, status: 'Active', start_date: new Date().toISOString().split('T')[0]
  });

  // LOGIC NODE: HQ PORTFOLIO HANDSHAKE
  useEffect(() => {
    fetchClients();
    const sub = supabase.channel('clients-hq-sync')
      .on('postgres_changes', { event: '*', table: 'clients' }, () => fetchClients())
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await supabase.from('clients').update(formData).eq('id', editingId);
    } else {
      await supabase.from('clients').insert([formData]);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ business_name: '', website_url: '', contact_name: '', email: '', monthly_value: 0, status: 'Active', start_date: new Date().toISOString().split('T')[0] });
  };

  const purgeClient = async (id, name) => {
    if (window.confirm(`CRITICAL: PURGE ${name.toUpperCase()} PORTFOLIO NODE?`)) {
      await supabase.from('clients').delete().eq('id', id);
    }
  };

  const filtered = clients.filter(c => {
    const matchesSearch = c.business_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.contact_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="flex flex-col items-center gap-4">
         <Globe className="animate-spin text-[#2b945f]" size={40} />
         <p className="font-black italic uppercase text-[10px] text-slate-400">Syncing Global Matrix...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* COMMAND HEADER PANEL */}
      <div className="flex justify-between items-end bg-[#0c3740] p-12 rounded-[50px] shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
           <div className="flex items-center gap-3 mb-4">
              <UserCheck className="text-[#2b945f]" size={20} />
              <span className="text-[#2b945f] font-black italic uppercase text-[10px] tracking-[0.5em]">System Admin: Sir Rabnawaz</span>
           </div>
           <h1 className="text-5xl font-black italic uppercase text-white tracking-tighter">Clients Center</h1>
           <p className="text-white/30 font-black italic uppercase text-[10px] tracking-widest mt-4">Node Operations Center • Cluster Layer Mapping</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setIsModalOpen(true); }}
          className="relative z-10 bg-white text-black px-10 py-5 rounded-[28px] font-black italic uppercase text-xs border-b-8 border-[#2b945f] hover:bg-black hover:text-white transition-all shadow-2xl flex items-center gap-3"
        >
          <Plus size={20} /> Establish Node
        </button>
        <TrendingUp className="absolute -right-16 -top-16 text-white/5" size={320} />
      </div>

      {/* OPERATIONAL STATUS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <ClientStat label="Registry Total" value={clients.length} color="text-black" />
        <ClientStat label="Execution Status: Active" value={clients.filter(c=>c.status==='Active').length} color="text-[#2b945f]" />
        <ClientStat label="Execution Status: On Hold" value={clients.filter(c=>c.status==='On Hold').length} color="text-amber-500" />
        <ClientStat label="Protocol: High Risk" value={clients.filter(c=>c.status==='At Risk').length} color="text-red-600 animate-pulse" />
      </div>

      {/* SCANNING & IDENTITY FILTERS */}
      <div className="flex gap-6 items-center">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2b945f] transition-colors" size={20} />
            <input 
              className="w-full bg-white border-4 border-slate-50 p-6 pl-16 rounded-[35px] font-black italic uppercase text-[10px] tracking-widest shadow-sm outline-none focus:ring-4 ring-[#2b945f]/10"
              placeholder="SCAN BUSINESS IDENTITY..."
              value={searchQuery}
              onChange={(e)=>setSearchQuery(e.target.value)}
            />
         </div>
         <div className="bg-[#0c3740] p-1.5 rounded-3xl border-4 border-white shadow-lg">
            <select 
              className="bg-transparent text-white px-8 py-4 font-black italic uppercase text-[10px] outline-none"
              value={statusFilter}
              onChange={(e)=>setStatusFilter(e.target.value)}
            >
              <option value="all" className="bg-[#0c3740]">PROTOCOL: ALL_UNITS</option>
              <option value="Active" className="bg-[#0c3740]">STATUS: OPERATIONAL</option>
              <option value="On Hold" className="bg-[#0c3740]">STATUS: IDLE_STANDBY</option>
              <option value="At Risk" className="bg-[#0c3740]">STATUS: COMPROMISED</option>
            </select>
         </div>
      </div>

      {/* CLIENT MATRIX GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pb-20">
        {filtered.map((client) => (
          <div 
            key={client.id} 
            className={`bg-white rounded-[55px] p-12 border-4 group transition-all duration-500 hover:shadow-2xl relative overflow-hidden shadow-sm ${
              client.status === 'At Risk' ? 'border-red-600/30 bg-red-50/10' : 'border-slate-50 hover:border-[#2b945f]'
            }`}
          >
            <div className="flex justify-between items-start mb-12">
               <div className="flex gap-6 items-center">
                  <div className="w-16 h-16 bg-[#0c3740] rounded-[24px] flex items-center justify-center font-black italic text-2xl text-[#2b945f] border-4 border-white shadow-xl transition-transform group-hover:scale-110">
                     {client.business_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-black leading-none">{client.business_name}</h3>
                    <p className="text-[10px] font-black italic uppercase text-slate-400 mt-2 tracking-tighter">UUID: {client.id.substring(0,8).toUpperCase()}</p>
                  </div>
               </div>
               <span className={`px-5 py-2 rounded-2xl text-[9px] font-black italic uppercase tracking-[0.2em] border-2 ${
                 client.status === 'Active' ? 'bg-[#2b945f]/5 text-[#2b945f] border-[#2b945f]/20' : 
                 client.status === 'At Risk' ? 'bg-red-100 text-red-600 border-red-200 animate-pulse' :
                 'bg-amber-50 text-amber-500 border-amber-100'
               }`}>
                 {client.status.replace(' ', '_')}
               </span>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-12 border-y-2 border-slate-50 py-10 italic">
               <div className="space-y-4">
                  <IdentityLine icon={<Briefcase size={16}/>} label="Primary Op" value={client.contact_name} />
                  <IdentityLine icon={<Mail size={16}/>} label="Logic Bridge" value={client.email} />
               </div>
               <div className="space-y-4">
                  <IdentityLine icon={<Globe size={16}/>} label="Matrix URL" value={client.website_url || 'UNDEFINED'} />
                  <IdentityLine icon={<DollarSign size={16}/>} label="Net Local Yield" value={`PKR ${Number(client.monthly_value).toLocaleString()}`} />
               </div>
            </div>

            <div className="flex justify-between items-center">
               <span className="text-[10px] font-black italic uppercase text-slate-300">Cluster Start: {client.start_date}</span>
               <div className="flex gap-4">
                  <button 
                    onClick={() => {
                       setEditingId(client.id);
                       setFormData({ ...client });
                       setIsModalOpen(true);
                    }}
                    className="p-4 bg-[#F9FBFC] rounded-2xl hover:bg-black hover:text-white transition-all text-slate-400 hover:scale-110 shadow-sm border border-slate-100"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button onClick={()=>purgeClient(client.id, client.business_name)} className="p-4 text-red-600/30 hover:text-red-600 rounded-2xl transition-all">
                    <Trash2 size={24} />
                  </button>
               </div>
            </div>
            {client.status === 'At Risk' && <Fingerprint className="absolute -bottom-10 -right-10 text-red-600 opacity-5" size={200} />}
          </div>
        ))}
      </div>

      {/* ESTABLISH/EDIT MODAL: DESIGNED FOR TERMINAL INPUT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0c3740]/98 backdrop-blur-2xl z-[9999] flex items-center justify-center p-6 selection:bg-[#2b945f]">
           <div className="bg-white w-full max-w-[650px] rounded-[65px] border-[10px] border-white overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 font-black italic uppercase">
              <header className="bg-black p-12 flex justify-between items-center text-white border-b-8 border-[#2b945f]">
                 <div>
                    <h2 className="text-2xl font-black italic uppercase text-white tracking-widest">{editingId ? 'RECALIBRATE_NODE' : 'ESTABLISH_NEW_NODE'}</h2>
                    <p className="text-[10px] font-black italic uppercase text-[#2b945f] mt-1 opacity-60 underline decoration-indigo-400">HQ Database Uploader System</p>
                 </div>
                 <X className="cursor-pointer opacity-30 hover:opacity-100 hover:rotate-90 transition-all" size={40} onClick={()=>setIsModalOpen(false)} />
              </header>

              <form onSubmit={handleSubmit} className="p-12 space-y-6">
                 <div className="grid grid-cols-2 gap-8">
                    <Field label="Business String ID" placeholder="NAME OF BUSINESS..." val={formData.business_name} setVal={(v)=>setFormData({...formData, business_name: v})} />
                    <Field label="Lead Identity String" placeholder="PRIMARY CONTACT..." val={formData.contact_name} setVal={(v)=>setFormData({...formData, contact_name: v})} />
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <Field label="Uplink email" placeholder="ACCESS_BRIDGE@GMAIL.COM" type="email" val={formData.email} setVal={(v)=>setFormData({...formData, email: v})} />
                    <Field label="Cluster Node URL" placeholder="WWW.SITE.COM" val={formData.website_url} setVal={(v)=>setFormData({...formData, website_url: v})} />
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-[9px] text-slate-400 ml-4">Monthly Local Yield (PKR)</label>
                        <input type="number" required className="w-full bg-[#F9FBFC] p-6 rounded-3xl font-black italic border-none focus:ring-4 ring-[#2b945f]/10" value={formData.monthly_value} onChange={(e)=>setFormData({...formData, monthly_value: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[9px] text-slate-400 ml-4">Protocol Node Status</label>
                        <select className="w-full bg-[#F9FBFC] p-6 rounded-3xl font-black italic border-none appearance-none" value={formData.status} onChange={(e)=>setFormData({...formData, status: e.target.value})}>
                           <option>Active</option>
                           <option>On Hold</option>
                           <option>At Risk</option>
                        </select>
                    </div>
                 </div>
                 <button type="submit" className="w-full bg-[#2b945f] text-white py-8 rounded-[40px] text-xl font-black shadow-2xl active:translate-y-2 border-b-[10px] border-black transition-all mt-6 uppercase italic">
                   {editingId ? 'COMMIT_RECALIBRATION' : 'INITIALIZE_COLLECTION'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

// SHARED IDENTITY INTERFACE COMPONENTS
function ClientStat({ label, value, color }) {
  return (
    <div className="bg-white p-10 rounded-[45px] border-2 border-slate-50 shadow-sm text-center group hover:-translate-y-4 hover:border-[#2b945f] transition-all duration-700">
       <p className="text-[10px] font-black italic uppercase text-slate-400 mb-2 tracking-[0.4em]">{label}</p>
       <h4 className={`text-6xl font-black italic tracking-tighter uppercase leading-none ${color}`}>{value}</h4>
    </div>
  );
}

function IdentityLine({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="p-2 bg-slate-50 text-slate-400 rounded-lg transition-colors group-hover:bg-[#2b945f]/10 group-hover:text-[#2b945f]">
        {icon}
      </div>
      <div className="truncate">
        <p className="text-[9px] font-black italic uppercase opacity-20">{label}</p>
        <p className="text-[11px] font-black italic uppercase tracking-tight truncate max-w-[140px]">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, placeholder, val, setVal, type = "text" }) {
   return (
    <div className="space-y-3">
       <label className="text-[9px] font-black italic uppercase text-slate-400 ml-4 tracking-[0.2em]">{label}</label>
       <input required type={type} placeholder={placeholder} value={val} onChange={(e)=>setVal(e.target.value)} className="w-full bg-[#F9FBFC] p-6 rounded-[28px] font-black italic border-none placeholder:opacity-10 shadow-inner focus:ring-4 ring-[#2b945f]/10 transition-all uppercase"/>
    </div>
   );
}