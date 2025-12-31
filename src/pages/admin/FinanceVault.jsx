import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  DollarSign, TrendingUp, CreditCard, Calculator, 
  ArrowUpRight, ArrowDownRight, RefreshCw, 
  FileText, Briefcase, Zap, Terminal, ShieldCheck 
} from 'lucide-react';

export default function FinanceVault() {
  const [loading, setLoading] = useState(true);
  const [marketRate, setMarketRate] = useState(278.50); // HQ System Default
  const [usdInput, setUsdInput] = useState(1000);
  const [financials, setFinancials] = useState({
    totalUsd: 0,
    releasedPkr: 0,
    pendingUsd: 0,
    history: []
  });

  // LOGIC NODE: HQ ECONOMIC HANDSHAKE
  useEffect(() => {
    fetchFinancialData();
    // Simulate real-time logic pulse
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const fetchFinancialData = async () => {
    // Logic: In a full scale app, this would aggregate 'monthly_value' from clients
    const { data: clients } = await supabase.from('clients').select('monthly_value');
    
    const total = clients?.reduce((sum, item) => sum + (Number(item.monthly_value) / marketRate), 0) || 0;
    
    setFinancials({
      totalUsd: total,
      releasedPkr: total * marketRate * 0.9, // Simulation: 90% released
      pendingUsd: total * 0.1,
      history: [
        { id: 1, desc: 'Titan Core Monthly Retention', type: 'INBOUND', amount: 2500, status: 'STABLE' },
        { id: 2, desc: 'Nebula App Phase 1 Payout', type: 'INBOUND', amount: 4800, status: 'STABLE' },
        { id: 3, desc: 'Infrastructure Cloud Tax', type: 'OUTBOUND', amount: 150, status: 'RELEASED' },
      ]
    });
  };

  const calculatedYield = (usdInput * marketRate).toLocaleString();

  if (loading) return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-center">
        <RefreshCw className="animate-spin text-[#2b945f] mx-auto mb-4" size={40} />
        <p className="font-black italic uppercase text-[10px] tracking-[0.4em] text-slate-400">Loading Cash-Flow Matrix...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
      
      {/* 1. VAULT COMMAND HEADER */}
      <div className="bg-[#0c3740] p-12 rounded-[50px] shadow-2xl relative overflow-hidden flex flex-wrap justify-between items-center gap-10">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <ShieldCheck className="text-[#2b945f]" size={20} />
             <span className="text-[#2b945f] font-black italic uppercase text-[10px] tracking-[0.5em]">Auth State: Encrypted Liquidity</span>
          </div>
          <h1 className="text-5xl font-black italic uppercase text-white tracking-tighter leading-none">Finance Vault</h1>
          <p className="text-white/30 font-black italic uppercase text-[10px] tracking-widest mt-4">Node Operations Center • Economic Yield Matrix</p>
        </div>

        <div className="relative z-10 flex gap-4">
           <button className="bg-[#2b945f] text-white px-8 py-4 rounded-2xl font-black italic uppercase text-xs border-b-8 border-black hover:scale-105 transition-all">
             Initialize Audit
           </button>
           <button className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl font-black italic uppercase text-xs hover:bg-white/10 transition-all">
             Export Log
           </button>
        </div>
        <DollarSign className="absolute -right-12 -bottom-12 text-white/5" size={280} />
      </div>

      {/* 2. CORE FINANCIAL NODES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <FinanceStat 
          label="GROSS_PORTFOLIO_USD" 
          value={`$${financials.totalUsd.toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
          trend="+12.5% INCREMENT" 
          color="text-[#5542f0]" 
        />
        <FinanceStat 
          label="NET_LOCAL_YIELD_PKR" 
          value={`${financials.releasedPkr.toLocaleString()} PKR`} 
          trend="LIQUID_SETTLED" 
          color="text-[#2b945f]" 
        />
        <FinanceStat 
          label="AWAITING_REMITTANCE" 
          value={`$${financials.pendingUsd.toLocaleString()}`} 
          trend="LOCKED_ESCROW" 
          color="text-red-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* 3. THE REMITTANCE ENGINE (CALCULATOR) */}
        <div className="lg:col-span-4 bg-white p-10 rounded-[55px] border-4 border-slate-50 shadow-sm space-y-8 relative overflow-hidden group">
           <div className="flex items-center gap-4 mb-4">
              <Calculator className="text-[#2b945f]" size={24} />
              <h2 className="text-xl font-black italic uppercase tracking-tighter">Remittance Engine</h2>
           </div>

           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black italic uppercase text-slate-400 ml-4">HQ_INDEX_RATE (USD/PKR)</label>
                 <div className="bg-[#F9FBFC] p-6 rounded-3xl font-black italic text-3xl tracking-tighter text-[#0c3740]">
                    {marketRate}
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black italic uppercase text-slate-400 ml-4">INPUT_USD_NODE</label>
                 <input 
                   type="number" 
                   value={usdInput} 
                   onChange={(e) => setUsdInput(e.target.value)}
                   className="w-full bg-[#0c3740] text-white p-6 rounded-3xl outline-none font-black italic text-3xl focus:ring-4 ring-[#2b945f]/20 shadow-2xl transition-all" 
                 />
              </div>

              <div className="p-8 bg-[#2b945f] rounded-[40px] text-white shadow-xl shadow-[#2b945f]/30">
                 <p className="text-[10px] font-black italic uppercase mb-2 opacity-60">Result: LOCAL_YIELD_OUTPUT</p>
                 <h4 className="text-4xl font-black italic uppercase tracking-tighter">
                   {calculatedYield} <span className="text-xl">PKR</span>
                 </h4>
              </div>
           </div>
           <Terminal className="absolute -bottom-10 -right-10 text-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" size={150} />
        </div>

        {/* 4. TRANSACTION STREAM LOG */}
        <div className="lg:col-span-8 bg-white p-10 rounded-[55px] border-4 border-slate-50 shadow-sm relative overflow-hidden flex flex-col italic">
           <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                 <Briefcase className="text-[#5542f0]" size={24} />
                 <h2 className="text-xl font-black italic uppercase tracking-tighter text-black">Inbound Execution Matrix</h2>
              </div>
              <button className="bg-slate-50 px-6 py-2 rounded-full text-[9px] font-black italic uppercase border text-slate-400 hover:bg-black hover:text-white transition-all">VIEW_GLOBAL_LEDGER</button>
           </div>

           <div className="space-y-4 flex-1">
             {financials.history.map((tx) => (
               <div key={tx.id} className="p-6 bg-[#F9FBFC] rounded-3xl border-2 border-white hover:border-[#5542f0]/20 group transition-all flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${tx.type === 'INBOUND' ? 'bg-emerald-50 text-[#2b945f]' : 'bg-red-50 text-red-600'}`}>
                      {tx.type === 'INBOUND' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    </div>
                    <div>
                       <p className="font-black italic uppercase text-xs text-black leading-none">{tx.desc}</p>
                       <p className="text-[8px] font-black italic uppercase text-slate-300 mt-2">Node Type: {tx.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black italic text-xl text-black leading-none">${tx.amount.toLocaleString()}</p>
                    <span className="text-[8px] font-black italic uppercase text-[#2b945f] bg-[#2b945f]/10 px-3 py-1 rounded-md mt-2 inline-block">STATUS: {tx.status}</span>
                  </div>
               </div>
             ))}
           </div>

           <div className="mt-8 pt-8 border-t border-slate-50 text-center">
              <p className="text-[10px] font-black italic uppercase text-slate-300">
                SECURE TRANSACTION • AUTOMATED REMITTANCE TRACEABILITY • TERM_ID: {Math.random().toString(36).substring(7).toUpperCase()}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}

// SHARED INTERFACE UI NODES
function FinanceStat({ label, value, trend, color }) {
  return (
    <div className="bg-white p-12 rounded-[50px] border border-slate-50 shadow-sm text-center group hover:border-black/5 hover:-translate-y-2 transition-all duration-700">
       <p className="text-[9px] font-black italic uppercase text-slate-400 mb-2 tracking-[0.5em]">{label}</p>
       <h4 className={`text-6xl font-black italic tracking-tighter uppercase leading-none ${color}`}>{value}</h4>
       <div className="mt-6 inline-flex items-center gap-2 bg-[#F9FBFC] px-4 py-2 rounded-full border">
          <Zap size={10} className="text-[#2b945f]" />
          <span className="text-[8px] font-black italic uppercase text-slate-500 opacity-60">{trend}</span>
       </div>
    </div>
  );
}