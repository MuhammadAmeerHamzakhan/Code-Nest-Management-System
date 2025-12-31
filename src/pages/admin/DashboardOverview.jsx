import React, { useEffect, useState } from 'react';
import { supabase } from "../../supabaseClient";
import { 
  Users, Activity, AlertTriangle, 
  TrendingUp, ArrowUpRight, Zap, History, Clock 
} from 'lucide-react';

/* 
   TIER 1 DEV NOTE: 
   Prop { setActiveTab } is essential to prevent "White Screen" 
   crashes during module transitions.
*/
export default function Dashboard({ setActiveTab }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    projects: [],
    profiles: [],
    revenuePkr: 0,
    marketRate: 278.50,
  });

  // DATA NODE UPLINK
  useEffect(() => {
    async function fetchStats() {
      const { data: projs } = await supabase.from('projects').select('*');
      const { data: profs } = await supabase.from('profiles').select('*');
      
      const activeCount = projs?.filter(p => p.status === 'ACTIVE').length || 0;
      const calculatedRevenue = activeCount * 500 * data.marketRate;

      setData(prev => ({ 
        ...prev, 
        projects: projs || [], 
        profiles: profs || [],
        revenuePkr: calculatedRevenue 
      }));
      setLoading(false);
    }
    fetchStats();
  }, [data.marketRate]);

  const stats = [
    {
      title: 'OPERATIONAL NODES',
      value: data.profiles.length,
      subtitle: `${data.profiles.filter(p => !p.is_approved).length} AWAITING AUTH`,
      icon: <Users size={16} />,
      color: "text-[#2b945f]",
      bg: "bg-[#2b945f]/10"
    },
    {
      title: 'LIQUIDITY VAULT',
      value: `PKR ${data.revenuePkr.toLocaleString()}`,
      subtitle: `INDEX: ${data.marketRate}`,
      icon: <TrendingUp size={16} />,
      color: "text-[#5542f0]",
      bg: "bg-[#5542f0]/10"
    },
    {
      title: 'ACTIVE MATRIX',
      value: data.projects.filter(p => p.status === 'ACTIVE').length,
      subtitle: 'RELEASED_STABLE',
      icon: <Activity size={16} />,
      color: "text-[#2b945f]",
      bg: "bg-[#2b945f]/10"
    },
    {
      title: 'RISK PROTOCOLS',
      value: data.projects.filter(p => p.progress < 20).length,
      subtitle: 'DELAYED EXECUTION',
      icon: <AlertTriangle size={16} />,
      color: "text-red-600",
      bg: "bg-red-50"
    }
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-[40vh]">
      <Zap className="animate-pulse text-[#2b945f]" size={40} />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 font-black italic uppercase">
      
      {/* 1. NATIVE DENSITY STAT GRID (Fits perfectly on standard desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-[28px] border border-slate-50 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <ArrowUpRight size={14} className="text-slate-200" />
            </div>
            <p className="text-[8px] text-slate-400 mb-1 tracking-[0.2em]">{stat.title}</p>
            <h3 className="text-xl text-black tracking-tighter leading-none">{stat.value}</h3>
            <p className="text-[7px] mt-3 text-[#2b945f] opacity-60">{stat.subtitle}</p>
          </div>
        ))}
      </div>

      {/* 2. EMERGENCY BYPASS BANNER (INTERNAL REDIRECTION) */}
      <div className="bg-[#0c3740] rounded-[25px] p-5 border-l-[8px] border-red-600 shadow-xl flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="bg-red-600 p-2.5 rounded-full animate-pulse">
               <AlertTriangle className="text-white" size={18} />
            </div>
            <div>
               <h3 className="text-white text-base tracking-tighter leading-none">Security Node Handshake</h3>
               <p className="text-white/30 text-[8px] tracking-[0.2em] mt-1.5 uppercase">Identity Link pending: Rabnawaz Administrative gate open.</p>
            </div>
         </div>
         {/* FIX: Use setActiveTab to change screens internally without refresh */}
         <button onClick={() => setActiveTab('team')} className="bg-white text-[#0c3740] px-6 py-2.5 rounded-xl text-[9px] shadow-lg hover:bg-[#2b945f] hover:text-white transition-all font-black">
            Open decision gate
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 3. EXECUTION CLUSTER STREAM (Compact Density) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-7 rounded-[35px] shadow-sm border border-slate-50">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-sm text-black tracking-tight leading-none uppercase italic font-black">Cluster Execution Matrix</h2>
               {/* FIX: Internal tab switch */}
               <button onClick={() => setActiveTab('projects')} className="text-[#2b945f] text-[9px] border-b-2 border-[#2b945f] hover:text-black transition-colors pb-0.5">Matrix Logs →</button>
            </div>
            
            <div className="space-y-4">
              {data.projects.slice(0, 4).map((proj, idx) => (
                <div key={idx} className="p-4 bg-[#F9FBFC] rounded-2xl border-2 border-white hover:border-[#2b945f]/20 transition-all cursor-pointer" onClick={() => setActiveTab('projects')}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="min-w-0">
                      <h4 className="text-xs text-[#0c3740] tracking-tight truncate leading-none uppercase italic font-black">{proj.project_name}</h4>
                      <p className="text-[7px] text-slate-300 mt-1 tracking-widest">{proj.client_name || 'EXTERNAL_NODE'}</p>
                    </div>
                    <span className="shrink-0 text-[6px] font-black uppercase tracking-widest px-2.5 py-1 bg-white border border-slate-50 text-slate-400 rounded-md">Protocol_Locked</span>
                  </div>
                  <div className="h-1 bg-white rounded-full overflow-hidden border border-slate-100 shadow-inner">
                    <div 
                      className="bg-[#2b945f] h-full transition-all duration-1000 shadow-[0_0_10px_rgba(43,148,95,0.3)]" 
                      style={{ width: `${proj.progress || 35}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. ACTIVITY & AUDIT HUD (Clean Side Layout) */}
        <div className="space-y-6">
           <div className="bg-white p-7 rounded-[35px] shadow-sm border border-slate-100">
              <h2 className="text-xs text-black mb-6 italic font-black uppercase leading-none border-b border-slate-50 pb-4">Audit Stream</h2>
              <div className="space-y-5">
                 <MiniAuditItem icon={<History size={12} />} text="Registry Optimized" time="2M" color="bg-[#0c3740]" />
                 <MiniAuditItem icon={<Zap size={12} />} text="New Access Pulse" time="15M" color="bg-[#5542f0]" />
                 <MiniAuditItem icon={<Clock size={12} />} text="Handshake Confirmed" time="1H" color="bg-[#2b945f]" />
              </div>
           </div>

           {/* HIGH-IMPACT LIQUIDITY CARD (DESIGN COMPLIANCE) */}
           <div className="bg-[#2b945f] p-7 rounded-[35px] shadow-2xl text-white relative overflow-hidden group">
              <div className="relative z-10">
                 <h2 className="text-[7px] mb-2 opacity-50 tracking-[0.4em] font-black">Financial Matrix</h2>
                 <p className="text-2xl tracking-tighter leading-none mb-6">Local yield: stable</p>
                 <div className="flex justify-between border-t border-white/20 pt-4 mt-2">
                    <div>
                       <p className="text-[7px] opacity-40 mb-1">Status</p>
                       <p className="text-xs leading-none">REMIT_READY</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[7px] opacity-40 mb-1">Market</p>
                       <p className="text-xs leading-none">POSITIVE</p>
                    </div>
                 </div>
              </div>
              <TrendingUp className="absolute -bottom-6 -right-6 text-white/10 group-hover:scale-125 transition-transform" size={130} />
           </div>
        </div>

      </div>
    </div>
  );
}

// SHARED UTILITY NODE: AUDIT FEED
function MiniAuditItem({ icon, text, time, color }) {
  return (
    <div className="flex items-center gap-4">
      <div className={`size-8 rounded-xl flex items-center justify-center text-white shadow-md ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black italic uppercase text-slate-800 leading-none truncate">{text}</p>
        <span className="text-[7px] text-slate-300 mt-1 tracking-widest">{time} AGO</span>
      </div>
    </div>
  );
}