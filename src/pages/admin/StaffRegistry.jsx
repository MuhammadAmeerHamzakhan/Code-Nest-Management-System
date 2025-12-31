import React, { useState, useEffect } from 'react';
import { supabase } from "../../supabaseClient";
import { 
  Search, UserPlus, ShieldCheck, Trash2, 
  Terminal, Database, Zap, Fingerprint, ShieldAlert
} from 'lucide-react';

export default function StaffRegistry() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // REAL-TIME SYNC ENGINE: LISTENING TO HQ DATABASE
  useEffect(() => {
    fetchRegistry();
    const channel = supabase.channel('staff-registry-sync')
      .on('postgres_changes', { event: '*', table: 'profiles' }, () => fetchRegistry())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchRegistry = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setMembers(data);
    setLoading(false);
  };

  // EXECUTIVE HANDSHAKE: REMOVE ACCESS BLOCKER
  const authorizeNode = async (id, name) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: true })
      .eq('id', id);

    if (error) {
      alert("COMMAND_FAILED: HANDSHAKE REJECTED.");
    }
  };

  const purgeNode = async (id) => {
    if (window.confirm("PERMANENTLY DELETE NODE IDENTITY?")) {
      await supabase.from('profiles').delete().eq('id', id);
    }
  };

  const filteredMembers = members.filter(m => 
    m.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = members.filter(m => !m.is_approved).length;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[40vh] space-y-3">
      <Fingerprint className="animate-pulse text-[#2b945f]" size={48} />
      <p className="font-black italic uppercase text-[10px] tracking-[0.4em] text-slate-300">Synchronizing Registry...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-black italic uppercase">
      
      {/* 1. COMMAND HEADER: 100% SCALE OPTIMIZED */}
      <div className="bg-[#0c3740] p-10 rounded-[40px] shadow-xl relative overflow-hidden flex flex-wrap justify-between items-center border-b-8 border-[#2b945f]">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 text-[#2b945f]">
            <Terminal size={14} />
            <span className="text-[8px] tracking-[0.4em]">EXECUTIVE GATEKEEPER / SIR RABNAWAZ</span>
          </div>
          <h1 className="text-4xl tracking-tighter text-white leading-none uppercase">Personnel Hub</h1>
          <p className="text-white/20 text-[8px] tracking-[0.4em] mt-3">Node Handshake Registry Protocol 1.04</p>
        </div>
        <Database className="absolute -right-12 -bottom-12 text-white/5 rotate-12" size={220} />
      </div>

      {/* 2. DENSITY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatNode label="Registry Density" value={members.length} sub="IDENTIFIED NODES" color="text-black" />
        <StatNode label="Gate Restricted" value={pendingCount} sub="AWAITING HANDSHAKE" color="text-red-600" />
        <StatNode label="Synced Status" value={members.length - pendingCount} sub="OPERATIONAL OPERATIVES" color="text-[#2b945f]" />
      </div>

      {/* 3. IDENTITY SEARCH NODE */}
      <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 group transition-all focus-within:ring-2 ring-[#2b945f]/20">
        <Search size={18} className="text-slate-300 group-focus-within:text-[#2b945f]" />
        <input 
          type="text" 
          placeholder="EXECUTE SEARCH BY IDENTITY_STRING..." 
          className="bg-transparent border-none text-[10px] font-black tracking-widest text-[#0c3740] outline-none w-full uppercase placeholder:text-slate-200"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 4. PERSONNEL NODES: DENSITY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        {filteredMembers.map((member) => (
          <div 
            key={member.id} 
            className={`bg-white rounded-[35px] p-7 border-4 shadow-sm relative group overflow-hidden transition-all hover:shadow-2xl ${
              !member.is_approved ? 'border-red-600 bg-red-50/20' : 'border-slate-50'
            }`}
          >
            <div className="flex gap-6 items-start relative z-10">
               {/* Identity Icon */}
               <div className="shrink-0 relative">
                  <div className="w-16 h-16 bg-[#F9FBFC] rounded-[22px] overflow-hidden border-2 border-white shadow-md group-hover:grayscale-0 grayscale transition-all duration-700">
                    <img 
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${member.id}`} 
                      alt="avatar" 
                      className="w-full h-full p-1" 
                    />
                  </div>
                  {member.is_approved && (
                    <div className="absolute -bottom-1 -right-1 bg-[#2b945f] p-1 rounded-md shadow-sm">
                        <ShieldCheck size={14} className="text-white"/>
                    </div>
                  )}
               </div>

               <div className="flex-1 min-w-0">
                  <h3 className="text-xl tracking-tighter text-[#0c3740] leading-none mb-2 truncate">
                    {member.full_name}
                  </h3>
                  <p className="text-[8px] text-slate-300 tracking-[0.2em] mb-4 truncate uppercase opacity-50">
                    UUID: {member.id.substring(0, 16)}
                  </p>
                  
                  <div className="flex gap-2">
                    <span className="bg-[#0c3740] text-white text-[7px] px-3 py-1 rounded-lg">NODE_{member.role}</span>
                    {!member.is_approved && (
                       <span className="bg-red-600 text-white text-[7px] px-3 py-1 rounded-lg animate-pulse">RELOAD_MISSING</span>
                    )}
                  </div>
               </div>
            </div>

            {/* HANDSHAKE FOOTER */}
            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between relative z-10">
              <div className="flex gap-3">
                 {!member.is_approved && (
                   <button 
                    onClick={() => authorizeNode(member.id, member.full_name)}
                    className="bg-[#2b945f] text-white px-6 py-2.5 rounded-[15px] text-[9px] flex items-center gap-3 shadow-lg active:scale-95 hover:brightness-110 transition-all"
                   >
                     <Zap size={14} className="animate-pulse"/> Execute Handshake
                   </button>
                 )}
                 <button className="text-[7px] text-slate-400 bg-slate-50 px-4 py-2 rounded-xl hover:bg-black hover:text-white transition-all">Node Specs</button>
              </div>
              <button 
                onClick={() => purgeNode(member.id)}
                className="p-3 text-red-600/20 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 size={20}/>
              </button>
            </div>
            
            {!member.is_approved && (
               <ShieldAlert className="absolute -right-10 -bottom-10 text-red-600/5 rotate-[-25deg]" size={160} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// SHARED STAT UNIT: SCALED FOR 1:1
function StatNode({ label, value, sub, color }) {
  return (
    <div className="bg-white p-7 rounded-[35px] shadow-sm border border-slate-50 text-center flex flex-col justify-center items-center hover:scale-[1.05] transition-transform">
      <p className="text-[8px] text-slate-300 mb-2 tracking-[0.3em]">{label}</p>
      <h3 className={`text-3xl tracking-tighter leading-none mb-4 ${color}`}>{value}</h3>
      <p className="text-[7px] text-[#2b945f] font-black opacity-40">{sub}</p>
    </div>
  );
}