import React, { useState, useEffect } from 'react';
import { supabase } from "../../supabaseClient";
import { 
  Download, X, ChevronDown, Check,
  ArrowRightLeft, FileText
} from 'lucide-react';

// BULLETPROOF IMPORTS
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function HQSettings() {
  const [currencyValue, setCurrencyValue] = useState(1);
  const [theme, setTheme] = useState('Light');
  const [currentRole, setCurrentRole] = useState('Admin - Full access to all features');
  const PKR_RATE = 280.23;

  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [counts, setCounts] = useState({ clients: 0, projects: 0, tasks: 0, team: 0 });

  useEffect(() => {
    fetchSystemMeta();
  }, []);

  async function fetchSystemMeta() {
    try {
      const { data: p } = await supabase.from('projects').select('*');
      const { data: t } = await supabase.from('tasks').select('*');
      const { data: c } = await supabase.from('clients').select('*');
      const { data: st } = await supabase.from('profiles').select('*');
      
      setMembers(st || []);
      setCounts({
        projects: p?.length || 0,
        tasks: t?.length || 0,
        clients: c?.length || 0,
        team: st?.length || 0
      });
    } catch (e) {
      console.log("Supabase Fetch Error:", e);
    }
  }

  // --- BRAIN: GENERATE SYSTEM AUDIT PDF ---
  const generateSystemAudit = async () => {
    try {
      const { data: projs } = await supabase.from('projects').select('*');
      
      if (!projs || projs.length === 0) {
        return alert("No projects found in database to audit!");
      }

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setTextColor(79, 70, 229); // Indigo
      doc.text("CODE NEST - SYSTEM AUDIT REPORT", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated Date: ${new Date().toLocaleString()}`, 14, 28);

      const tableData = projs.map(p => [
        p.project_name || "N/A", 
        p.client_name || "N/A", 
        p.status || "N/A", 
        p.deadline || "N/A"
      ]);

      // Call autoTable directly as a function (Fix for Vite/Modern React)
      autoTable(doc, {
        head: [['Project', 'Client', 'Status', 'Deadline']],
        body: tableData,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241], fontStyle: 'bold' },
        styles: { fontSize: 8 }
      });

      doc.save(`System_Audit_${new Date().toLocaleDateString()}.pdf`);
    } catch (error) {
      console.error("PDF Export Failed:", error);
      alert("Error: " + error.message);
    }
  };

  // --- BRAIN: MEMBER PERFORMANCE REPORT ---
  const generateMemberReport = async () => {
    if(!selectedMember) return alert("Select a member first!");
    
    try {
      const member = members.find(m => m.id === selectedMember);
      const { data: tasks } = await supabase.from('tasks').select('*').eq('assigned_to', selectedMember);

      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(99, 102, 241); 
      doc.text(`${member.full_name} - Performance Report`, 14, 20);
      
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      doc.text(`Designation: ${member.role || 'Team Member'}`, 14, 30);
      doc.text(`Execution Points Tracked: ${tasks?.length || 0}`, 14, 35);

      const taskRows = (tasks || []).map(t => [
        t.title || 'No Title', 
        t.status || 'To Do', 
        t.priority || 'Normal', 
        t.deadline || 'No Date'
      ]);
      
      autoTable(doc, {
        head: [['Task Detail', 'Status', 'Priority', 'Due Date']],
        body: taskRows,
        startY: 45,
        headStyles: { fillColor: [67, 56, 202] }
      });

      doc.save(`${member.full_name.replace(/\s+/g, '_')}_Performance.pdf`);
    } catch (error) {
      alert("Performance Report Failed: " + error.message);
    }
  };

  return (
    <div className="flex-1 bg-[#F8FAFC] min-h-screen p-8 space-y-8 animate-in fade-in duration-700 font-sans tracking-tight pb-20 overflow-x-hidden">
      
      <header className="mb-6">
         <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
         <p className="text-slate-500 font-medium text-sm mt-1">Configure workspace and reports</p>
      </header>

      {/* APPEARANCE SECTION */}
      <Box title="Appearance">
         <div className="flex items-center justify-between py-2">
            <div>
               <p className="text-sm font-bold text-slate-700">Theme Engine</p>
               <p className="text-xs text-slate-400">Choose your system aesthetic</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
               <button onClick={()=>setTheme('Light')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${theme === 'Light' ? 'bg-white shadow text-[#6366F1]' : 'text-slate-400'}`}>Light</button>
               <button onClick={()=>setTheme('Dark')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${theme === 'Dark' ? 'bg-white shadow text-[#6366F1]' : 'text-slate-400'}`}>Dark</button>
            </div>
         </div>
      </Box>

      {/* CURRENCY CONVERTER - THE "SIR RABNAWAZ" SPECIAL */}
      <Box title="Currency Exchange Logic">
         <div className="flex flex-col md:flex-row gap-8 items-center py-4">
            <div className="flex-1 w-full space-y-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Input Amount (USD)</label>
               <input 
                  type="number" 
                  value={currencyValue} 
                  onChange={(e) => setCurrencyValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-3xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-[#6366F1] transition-all"
               />
            </div>
            <div className="bg-white border border-slate-100 p-3 rounded-full shadow-sm text-slate-300">
               <ArrowRightLeft size={20} />
            </div>
            <div className="flex-1 w-full bg-indigo-50/40 border border-indigo-100 p-6 rounded-2xl flex flex-col justify-center">
               <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Exchange Result (Rate: {PKR_RATE})</p>
               <p className="text-4xl font-black text-[#6366F1] tracking-tighter">Rs. {(currencyValue * PKR_RATE).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            </div>
         </div>
      </Box>

      {/* REVOLUTIONARY DATA EXPORT */}
      <Box title="Reports & Data Backup">
         <div className="space-y-6">
            <ActionItem 
               label="Complete Audit Export" 
               sub="Generate a detailed list of all system projects and their metadata." 
               btn="Export Project Matrix" 
               onClick={generateSystemAudit} 
            />

            <div className="h-px bg-slate-50 w-full" />

            <div className="flex flex-col md:flex-row gap-4 items-end bg-[#F8FAFC]/50 p-6 rounded-2xl border border-slate-100">
               <div className="flex-1 space-y-2 w-full">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Staff Audit Target</label>
                  <div className="relative">
                    <select 
                        value={selectedMember} 
                        onChange={(e)=>setSelectedMember(e.target.value)}
                        className="w-full appearance-none bg-white border border-slate-200 p-3 rounded-xl text-sm font-semibold shadow-sm focus:border-indigo-500"
                    >
                        <option value="">Choose a member...</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
               </div>
               <button onClick={generateMemberReport} className="bg-[#6366F1] text-white px-8 py-3 rounded-xl font-bold text-xs shadow-lg shadow-indigo-200/50 hover:bg-[#4F46E5] active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap">
                 <FileText size={16}/> Download Member PDF
               </button>
            </div>
         </div>
      </Box>

      {/* VISUAL PERMISSIONS HUB */}
      <Box title="System Permissions Hub">
         <div className="overflow-x-auto pt-2">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     <th className="py-4">Feature Set</th><th>Admin</th><th>PM</th><th>Developer</th><th className="text-center pr-6">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50/40 text-slate-600 text-sm">
                  <PermissionRow label="Matrix Core" a p d /><PermissionRow label="Finance Ops" a /><PermissionRow label="User Registry" a p /><PermissionRow label="System Config" a />
               </tbody>
            </table>
         </div>
      </Box>

      {/* QUICK STATUS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
         <SmallBadge lab="Nodes Active" val={counts.clients} />
         <SmallBadge lab="Live Execution" val={counts.projects} />
         <SmallBadge lab="Open Flows" val={counts.tasks} />
         <SmallBadge lab="Staff Unit" val={counts.team} />
      </div>

    </div>
  );
}

// ---------------- STYLED INTERFACE COMPONENTS ---------------- //

function Box({ title, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-[35px] p-8 md:p-10 shadow-sm relative overflow-hidden transition-all hover:shadow-indigo-100/40 hover:shadow-lg">
       <h3 className="text-xl font-bold text-slate-800 mb-8 border-l-4 border-[#6366F1] pl-5 leading-none">{title}</h3>
       {children}
    </div>
  );
}

function PermissionRow({ label, a, p, d }) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
       <td className="py-5 font-bold text-slate-800">{label}</td>
       <td>{a ? <span className="text-indigo-600 font-bold">✓</span> : '—'}</td>
       <td>{p ? <span className="text-indigo-600 font-bold">✓</span> : '—'}</td>
       <td className="text-slate-200">{d ? <span className="text-indigo-600 font-bold opacity-30">✓</span> : '—'}</td>
       <td className="text-center pr-6">
          <div className="w-5 h-5 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto text-emerald-500"><Check size={12} strokeWidth={4}/></div>
       </td>
    </tr>
  );
}

function ActionItem({ label, sub, btn, onClick }) {
   return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 gap-4 bg-slate-50/30 p-4 rounded-2xl border border-transparent hover:border-slate-100 transition-all group">
       <div>
          <h4 className="text-sm font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{label}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
       </div>
       <button onClick={onClick} className="bg-white border-2 border-slate-100 text-[#6366F1] px-5 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider hover:border-[#6366F1] shadow-sm active:scale-95 transition-all">
          {btn}
       </button>
    </div>
   );
}

function SmallBadge({ lab, val }) {
  return (
    <div className="bg-white border border-slate-100 p-6 rounded-[30px] text-center shadow-sm">
       <h5 className="text-3xl font-black text-slate-900 leading-none mb-1">{val}</h5>
       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{lab}</p>
    </div>
  );
}