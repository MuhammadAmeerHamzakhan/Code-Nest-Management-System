import React, { useState } from 'react';
import { 
  Settings, Shield, Database, Download, 
  Trash2, FileText, Globe, Percent, 
  ArrowRightLeft, AlertCircle, RefreshCw,
  Terminal, ShieldCheck
} from 'lucide-react';

export default function HQSettings() {
  const [marketRate, setMarketRate] = useState(278.50);
  const [currentUserRole, setCurrentUserRole] = useState('Admin');
  const [systemZoom, setSystemZoom] = useState('0.8');

  // Logic Node: Simulating Export Logic for Database Backups
  const handleBackup = () => {
    alert("HQ_PROTOCOL: DATABASE EXPORT COMMENCED. ARCHIVE DOWNLOADED.");
  };

  const handleClearSystem = () => {
    if (window.confirm("CRITICAL: THIS WILL PURGE LOCAL SESSION CACHE. PROCEED?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const permissionMatrix = [
    { feature: 'DASHBOARD_OVERVIEW', admin: true, pm: true, dev: true, sales: true },
    { feature: 'STAFF_REGISTRY', admin: true, pm: true, dev: false, sales: false },
    { feature: 'FINANCE_VAULT', admin: true, pm: false, dev: false, sales: false },
    { feature: 'PROJECT_MATRIX', admin: true, pm: true, dev: true, sales: true },
    { feature: 'CLIENTS_CENTER', admin: true, pm: true, dev: false, sales: true },
    { feature: 'TASK_SEQUENCING', admin: true, pm: true, dev: true, sales: false },
    { feature: 'HQ_SYSTEM_LOGIC', admin: true, pm: false, dev: false, sales: false },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-700 pb-20">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center bg-white p-10 rounded-[45px] border-4 border-slate-50 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Terminal className="text-[#2b945f]" size={20} />
            <span className="text-slate-400 font-black italic uppercase text-[10px] tracking-widest">Code Nest HQ Core</span>
          </div>
          <h1 className="text-4xl font-black italic uppercase text-black tracking-tighter">System HQ Logic Hub</h1>
        </div>
        <div className="flex items-center gap-6 bg-[#F9FBFC] p-4 rounded-3xl border border-slate-100 font-black italic uppercase text-[10px]">
           <span className="opacity-40">Status:</span>
           <span className="text-[#2b945f] animate-pulse">Synchronized</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* 1. FINANCIAL MODIFIER NODE */}
        <section className="bg-white p-12 rounded-[50px] shadow-sm border border-slate-50 space-y-10">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-amber-50 rounded-2xl">
               <ArrowRightLeft className="text-amber-600" size={24} />
             </div>
             <h2 className="text-xl font-black italic uppercase">Market Index Logic</h2>
          </div>
          
          <div className="space-y-6">
            <div className="p-8 bg-[#F9FBFC] rounded-[35px] border-2 border-slate-100 shadow-inner">
               <label className="text-[10px] font-black italic uppercase text-slate-400 block mb-4">Manual Currency Peg (PKR per USD)</label>
               <div className="flex items-center gap-6">
                 <input 
                   type="number" 
                   value={marketRate}
                   onChange={(e) => setMarketRate(e.target.value)}
                   className="bg-white p-6 rounded-2xl w-full text-4xl font-black italic tracking-tighter outline-none focus:ring-4 ring-[#2b945f]/10"
                 />
                 <button className="bg-[#2b945f] p-6 rounded-2xl text-white active:scale-95 transition-all">
                    <RefreshCw size={24} />
                 </button>
               </div>
            </div>
          </div>
          <p className="text-[10px] font-black italic uppercase text-slate-300">SYSTEM: ALL REMITTANCE CALCULATIONS WILL MAP TO THIS INDEX UNIT.</p>
        </section>

        {/* 2. ROLE SIMULATION MATRIX */}
        <section className="bg-[#0c3740] p-12 rounded-[50px] shadow-2xl text-white space-y-10 relative overflow-hidden">
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
               <Shield className="text-[#2b945f]" size={28} />
               <h2 className="text-xl font-black italic uppercase">Role Authorization Level</h2>
            </div>
            
            <div className="p-2 bg-white/5 rounded-3xl border border-white/10">
              {['Admin', 'Project Manager', 'Developer', 'Sales'].map((role) => (
                <button 
                  key={role}
                  onClick={() => setCurrentUserRole(role)}
                  className={`w-full text-left p-6 rounded-2xl font-black italic uppercase text-[11px] tracking-widest flex items-center justify-between transition-all ${
                    currentUserRole === role ? 'bg-[#2b945f] text-white shadow-xl' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {role}
                  {currentUserRole === role && <ShieldCheck size={18} />}
                </button>
              ))}
            </div>
          </div>
          <Settings size={200} className="absolute -bottom-16 -right-16 text-white/5 rotate-12" />
        </section>
      </div>

      {/* 3. PERMISSION HIERARCHY GRID (Rabnawaz Design Re-built) */}
      <Card title="Logical Access Matrix">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-black italic uppercase">
            <thead>
              <tr className="border-b-4 border-slate-100 text-slate-400 text-[9px] tracking-widest">
                <th className="py-6 px-4 uppercase">Node Function</th>
                <th className="py-6 px-4 text-center">Admin</th>
                <th className="py-6 px-4 text-center">PM</th>
                <th className="py-6 px-4 text-center">Dev</th>
                <th className="py-6 px-4 text-center">Sales</th>
                <th className="py-6 px-4 text-right pr-10">Logic Current</th>
              </tr>
            </thead>
            <tbody>
              {permissionMatrix.map((item, idx) => {
                const hasAccess = item[currentUserRole.toLowerCase().replace(' ', '')];
                return (
                  <tr key={idx} className="border-b border-slate-50 group hover:bg-[#F9FBFC] transition-colors">
                    <td className="py-6 px-4 text-[12px] tracking-tight text-black underline decoration-[#2b945f]/10">{item.feature}</td>
                    <td className="py-6 px-4 text-center text-xs opacity-40">{item.admin ? '✓' : '—'}</td>
                    <td className="py-6 px-4 text-center text-xs opacity-40">{item.pm ? '✓' : '—'}</td>
                    <td className="py-6 px-4 text-center text-xs opacity-40">{item.dev ? '✓' : '—'}</td>
                    <td className="py-6 px-4 text-center text-xs opacity-40">{item.sales ? '✓' : '—'}</td>
                    <td className="py-6 px-4 text-right pr-10">
                       <span className={`text-[10px] font-black italic uppercase px-4 py-1.5 rounded-full ${hasAccess ? 'bg-[#2b945f]/10 text-[#2b945f]' : 'bg-red-50 text-red-600'}`}>
                         {hasAccess ? 'ACCESS_GRANTED' : 'ACCESS_RESTRICTED'}
                       </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 4. DATA INTEGRITY & AUDIT SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <ActionButton 
          label="Database Export" 
          sub="Logical Cluster Backup"
          icon={<Database size={20} />} 
          onClick={handleBackup} 
          variant="secondary"
        />
        <ActionButton 
          label="Print Audit PDF" 
          sub="HQ Performance Report"
          icon={<FileText size={20} />} 
          onClick={() => window.print()} 
          variant="primary"
        />
        <ActionButton 
          label="Terminal Purge" 
          sub="Session Clear Sequence"
          icon={<Trash2 size={20} />} 
          onClick={handleClearSystem} 
          variant="danger"
        />
      </div>

    </div>
  );
}

// SHARED INTERFACE UI BLOCKS
function Card({ title, children }) {
  return (
    <div className="bg-white p-10 rounded-[50px] border border-slate-50 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 mb-10 border-l-8 border-[#2b945f] pl-6">
         <h2 className="text-xl font-black italic uppercase text-black">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ActionButton({ label, sub, icon, onClick, variant }) {
  const themes = {
    primary: "bg-[#0c3740] text-white hover:bg-black",
    secondary: "bg-white border-4 border-slate-50 text-black hover:bg-[#F9FBFC]",
    danger: "bg-red-50 border-4 border-red-100 text-red-600 hover:bg-red-600 hover:text-white"
  };

  return (
    <button 
      onClick={onClick} 
      className={`${themes[variant]} p-10 rounded-[45px] text-left group transition-all duration-500 hover:-translate-y-4 shadow-xl active:scale-95`}
    >
      <div className="flex justify-between items-start mb-10">
         <div className="p-4 bg-white/10 rounded-2xl group-hover:rotate-12 transition-transform">
           {icon}
         </div>
      </div>
      <p className="text-[10px] font-black italic uppercase opacity-40 mb-2">{sub}</p>
      <h3 className="text-xl font-black italic uppercase tracking-tighter leading-none">{label}</h3>
    </button>
  );
}