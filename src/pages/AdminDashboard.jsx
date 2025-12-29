import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  LogOut, LayoutDashboard, Users, Briefcase, 
  DollarSign, Plus, Trash2, Search, Bell, 
  ChevronRight, Activity, Calendar, X,
  Clock, AlertCircle, CheckCircle2, RefreshCcw, Globe, ShieldCheck,
  CreditCard, Wallet, Hourglass, Radio, UserCheck, 
  ExternalLink, Layers, ShieldAlert, Settings, FileDown, 
  Calculator, AlertTriangle, ArrowRightLeft, FileCheck, ClipboardList,
  Printer, HardDriveDownload, FileText, Sparkles, User, Shield, CheckSquare, Filter, Github, MoreHorizontal, MapPin, Image as ImageIcon,
  Zap, History, UserPlus as UserPlusIcon
} from 'lucide-react';

export default function AdminDashboard() {
  // --- CORE DATA ENGINE ---
  const [activeTab, setActiveTab] = useState('overview');
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedProject, setSelectedProject] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEmpConfigOpen, setIsEmpConfigOpen] = useState(false);
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [marketRate, setMarketRate] = useState(278);
  const [gracePeriod, setGracePeriod] = useState(5);
  const [calcUsd, setCalcUsd] = useState(0);

  const [newEmp, setNewEmp] = useState({ full_name: '', role: 'Remote Full Stack Dev' });
  const [newProj, setNewProj] = useState({ name: '', client: '', url: '', staff_id: '' });

  // RECOVERY SYSTEM: Ensuring data never hangs
  const fetchSystemData = useCallback(async () => {
    try {
      const { data: profs } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      const { data: projs } = await supabase.from('projects').select('*').order('last_report_date', { ascending: true });
      
      if (profs) setEmployees(profs);
      if (projs) setProjects(projs);
      
      setTasks([
        { id: '0XD46498', title: 'Fix memory leak in websocket', assigned_to: 'Elena Rodriguez', status: 'backlog', priority: 'P0', role: 'Backend' },
        { id: '0XD46501', title: 'Implement OAuth2 integration', assigned_to: 'Sarah Chen', status: 'active', priority: 'P0', role: 'Security' },
        { id: '0XD46505', title: 'CDN Edge Node Optimization', assigned_to: 'Marcus Dev', status: 'backlog', priority: 'P1', role: 'Infrastructure' }
      ]);
    } catch (e) {
      console.error("DATA TERMINAL RECOIL: Attempting Re-Sync...");
    }
  }, []);

  // REAL-TIME HANDSHAKE (Smoothed)
  useEffect(() => {
    fetchSystemData();

    const hqSubscription = supabase
      .channel('hq_matrix_sync')
      .on('postgres_changes', { event: '*', table: 'profiles', schema: 'public' }, () => {
        fetchSystemData();
      })
      .subscribe();

    return () => { supabase.removeChannel(hqSubscription); };
  }, [fetchSystemData]);

  // COMMAND: AUTHORIZE PENDING NODE (SMOOTH SYNC)
  const approveEmployee = async (id, name) => {
    try {
        const { error } = await supabase
          .from('profiles')
          .update({ is_approved: true })
          .eq('id', id);

        if (error) throw error;
        
        // INSTANT LOCAL CLEARANCE
        setEmployees(prev => prev.map(e => e.id === id ? {...e, is_approved: true} : e));
        
        alert(`PROTOCOL EXECUTED: ${name.toUpperCase()} HAS BEEN GRANTED ENTRY. LINKING...`);
        setIsEmpConfigOpen(false);
        fetchSystemData(); // Confirm with DB state
    } catch (err) {
        alert("TERMINAL ERROR: FAILED TO AUTHORIZE. RETRY.");
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const empId = "EMP-" + Date.now();
    try {
      const { error } = await supabase.from('profiles').insert([{ id: empId, full_name: newEmp.full_name, role: newEmp.role, is_approved: true }]);
      if (error) throw error;
      setIsModalOpen(false);
      setNewEmp({ full_name: '', role: 'Remote Full Stack Dev' });
      fetchSystemData();
    } catch (err) { alert(err.message); } 
    finally { setIsSubmitting(false); }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('projects').insert([{ 
        project_name: newProj.name, client_name: newProj.client, 
        website_url: newProj.url, assigned_to: newProj.staff_id,
        last_report_date: new Date().toISOString()
      }]);
      if (error) throw error;
      setIsProjectModalOpen(false);
      setNewProj({ name: '', client: '', url: '', staff_id: '' });
      fetchSystemData();
    } catch (err) { alert(err.message); } 
    finally { setIsSubmitting(false); }
  };

  const deleteEmployee = async (id) => {
    if (window.confirm("CRITICAL: Permanent Deletion?")) {
      await supabase.from('profiles').delete().eq('id', id);
      setIsEmpConfigOpen(false);
      fetchSystemData();
    }
  };

  const checkMaintenanceAlert = (lastDate) => {
    if (!lastDate) return true;
    const diff = Math.floor((new Date() - new Date(lastDate)) / (1000 * 60 * 60 * 24));
    return diff >= 30; 
  };

  const pendingApprovals = employees.filter(emp => !emp.is_approved).length;

  const filteredProjects = projects.filter(p => p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.client_name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredEmployees = employees.filter(e => e.full_name.toLowerCase().includes(searchQuery.toLowerCase()));

  const downloadSystemReport = () => {
    const printWindow = window.open('', '_blank');
    let htmlContent = `
      <html>
        <head>
          <title>Code Nest - Executive Monthly Audit</title>
          <style>
            body { font-family: 'Arial', sans'; padding: 40px; color: #1a1a1a; line-height: 1.6; }
            h1 { text-transform: uppercase; font-style: italic; border-bottom: 4px solid #0c3740; padding-bottom: 10px; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 40px; font-size: 12px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #0c3740; color: white; padding: 12px; text-align: left; font-size: 10px; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #eee; font-size: 11px; }
            .status-red { color: red; font-weight: bold; }
            .status-green { color: green; font-weight: bold; }
            footer { margin-top: 50px; font-size: 10px; opacity: 0.5; border-top: 1px solid #ccc; pt: 10px; }
          </style>
        </head>
        <body>
          <h1>Monthly Operational Audit: Dec 2025</h1>
          <div class="header-info">
             <div>ADMINISTRATOR: SIR RABNAWAZ<br/>STATION: HQ_ERP_COMMAND</div>
             <div style="text-align: right">NODES: ${employees.length}<br/>SUBSCRIPTIONS: ${projects.length}</div>
          </div>
          <table>
            <thead><tr><th>Client</th><th>Assigned</th><th>URL</th><th>Status</th></tr></thead>
            <tbody>
    `;

    projects.forEach(p => {
        const staffNode = employees.find(e => e.id === p.assigned_to);
        const isOverdue = checkMaintenanceAlert(p.last_report_date);
        htmlContent += `
          <tr><td>${p.client_name.toUpperCase()}</td><td>${staffNode ? staffNode.full_name : 'RESTRICTED'}</td><td>${p.website_url}</td><td class="${isOverdue ? 'status-red' : 'status-green'}">${isOverdue ? '!! CRITICAL !!' : 'OPERATIONAL_PASS'}</td></tr>
        `;
    });

    htmlContent += `</tbody></table><footer>ENCRYPTED LOG GENERATED LOCALLY BY CODE NEST ERP SYSTEM</footer></body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="flex h-screen w-full bg-[#fcfdfe] font-sans overflow-hidden text-[#1a1a1a] selection:bg-[#2b945f] selection:text-white uppercase font-black italic">
      
      {/* SIDEBAR: PERSISTENT #2B945F PROTOCOL */}
      <aside className="w-60 bg-[#2b945f] text-white flex flex-col shadow-2xl z-50 shrink-0 hidden md:flex border-r border-white/5 transition-all duration-700">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-2">
             <div className="p-1.5 bg-[#0c3740] rounded-lg shadow-xl"><Briefcase size={16}/></div>
             <h1 className="text-lg font-black italic uppercase tracking-tighter">Code Nest</h1>
          </div>
          <p className="text-[8px] font-black text-white/50 mt-2 tracking-[0.3em] uppercase opacity-60 italic ml-0.5">Control Terminal 1.04</p>
        </div>
        <nav className="flex-1 px-3 mt-6 space-y-1">
          <NavButton active={activeTab === 'overview'} icon={<LayoutDashboard size={16}/>} label="Dashboard" onClick={() => setActiveTab('overview')} />
          <NavButton active={activeTab === 'employees'} icon={<Users size={16}/>} label="Team" onClick={() => setActiveTab('employees')} />
          <NavButton active={activeTab === 'clients'} icon={<UserCheck size={16}/>} label="Clients Center" onClick={() => setActiveTab('clients')} />
          <NavButton active={activeTab === 'tasks'} icon={<ClipboardList size={16}/>} label="Tasks" onClick={() => setActiveTab('tasks')} />
          <NavButton active={activeTab === 'projects'} icon={<Activity size={16}/>} label="Projects" onClick={() => setActiveTab('projects')} />
          <div className="h-px bg-white/5 my-4 mx-3"></div>
          <NavButton active={activeTab === 'finance'} icon={<DollarSign size={16}/>} label="Finance vault" onClick={() => setActiveTab('finance')} />
          <NavButton active={activeTab === 'settings'} icon={<Settings size={16}/>} label="HQ Settings" onClick={() => setActiveTab('settings')} />
        </nav>
        <div className="p-4 mb-2">
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-3 w-full p-3 bg-[#0c3740]/20 text-white border border-white/10 rounded-xl hover:bg-red-500 hover:text-white transition-all text-[9px] uppercase tracking-widest font-black italic">
            <LogOut size={14}/> <span>HQ Log-out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col relative bg-[#F9FBFC] min-w-0 font-black italic min-h-screen" style={{ zoom: '0.8' }}>
        
        <header className="h-16 bg-white/70 backdrop-blur-xl sticky top-0 border-b border-slate-100 px-8 flex justify-between items-center z-40 shrink-0">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-black italic uppercase tracking-tight leading-none">Command Center</h1>
            <div className="flex items-center gap-4 bg-[#eff2f7] px-6 py-2.5 rounded-full w-96 border border-slate-100">
               <Search size={16} className="text-slate-400" />
               <input value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} type="text" placeholder="QUERY NODE DIRECTORY..." className="bg-transparent border-none text-[11px] font-black tracking-widest text-[#0c3740] outline-none w-full uppercase placeholder:text-slate-400 italic"/>
            </div>
          </div>
          <div className="flex items-center gap-6 relative">
              <button className="flex items-center gap-2 bg-[#F3F4FF] text-[#4c44f2] px-4 py-2 rounded-xl text-[10px] font-black italic uppercase">
                 <Sparkles size={14}/> Nest AI logic
              </button>
              {/* REAL-TIME NOTIFICATION HUB */}
              <div className="relative p-2 cursor-pointer transition-transform active:scale-90" onClick={() => setActiveTab('employees')}>
                  <Bell size={20} className={pendingApprovals > 0 ? "text-red-600 animate-bounce" : "text-slate-400"} />
                  {pendingApprovals > 0 && <span className="absolute top-1 right-1 bg-red-600 text-white text-[8px] font-black rounded-full px-1 min-w-[14px] flex items-center justify-center border-2 border-white animate-pulse">{pendingApprovals}</span>}
              </div>
              <div className="flex items-center gap-3 pl-4 cursor-pointer" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-[#000000] uppercase italic">Sir Rabnawaz</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase italic">HQ Administrator</p>
                  </div>
                  <div className="size-10 bg-[#0c3740] text-[#2b945f] rounded-full flex items-center justify-center font-black italic text-lg border-2 border-white">R</div>
              </div>
              {isProfileOpen && (
                 <div className="absolute top-16 right-0 w-64 bg-[#0d1629] border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden text-white font-black uppercase italic p-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="p-3 border-b border-white/5 mb-3 font-black italic">
                        <p className="text-[9px] text-indigo-400 mb-1">HQ Access Node</p>
                        <p className="text-xs truncate italic">mameerhamzak07@gmail.com</p>
                    </div>
                    <button className="w-full flex items-center gap-2 p-3 text-[10px] hover:bg-white/5 rounded-xl uppercase font-black italic"><User size={14}/> Node Profile</button>
                    <button className="w-full flex items-center gap-2 p-3 text-[10px] hover:bg-white/5 rounded-xl uppercase font-black italic"><Settings size={14}/> System Logic</button>
                    <button onClick={()=>supabase.auth.signOut()} className="w-full flex items-center gap-2 p-3 text-[10px] text-red-400 mt-4 border-t border-white/5 pt-4 hover:brightness-150 transition-all uppercase font-black italic"><LogOut size={14}/> Terminate Access</button>
                 </div>
              )}
          </div>
        </header>

        <div className="p-8 space-y-8 font-black italic uppercase">
          
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in duration-500 fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-black italic">
                <ModernCard label="Operational Projects" value={projects.length} icon={<Activity size={24}/>} color="bg-blue-50 text-blue-500" onClick={()=>setActiveTab('projects')}/>
                <ModernCard label="Executed Tasks" value="0" icon={<CheckSquare size={24}/>} color="bg-emerald-50 text-emerald-500" onClick={()=>setActiveTab('tasks')}/>
                <div className="bg-white p-8 rounded-[32px] border shadow-sm font-black italic">
                   <h3 className="text-xs font-black italic flex items-center gap-2 text-pink-500 uppercase"><Calendar size={18}/> Target Timeline</h3>
                   <div className="mt-8 space-y-6 italic"><div className="border-b pb-2 flex justify-between uppercase"><p className="text-[10px] font-black italic">TITAN_CORE</p><p className="text-pink-500 text-[10px] font-black">64%</p></div><div className="border-b pb-2 flex justify-between uppercase"><p className="text-[10px] font-black italic">NEBULA_APP</p><p className="text-pink-500 text-[10px] font-black">78%</p></div></div>
                </div>
                <div className="bg-white p-8 rounded-[32px] border shadow-sm font-black italic">
                   <h3 className="text-xs font-black italic flex items-center gap-2 text-amber-500 uppercase"><AlertCircle size={18}/> URGENT PROTOCOLS</h3>
                   <div className="mt-6 space-y-4">
                     <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between text-[8px] font-black italic"><span>OAUTH PROTOCOL UPDATE</span><div className="size-5 bg-[#0c3740] rounded-full animate-pulse"></div></div>
                     <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between text-[8px] font-black italic"><span>DB_NODE_LATENCY_TEST</span><div className="size-5 bg-blue-500 rounded-full animate-ping"></div></div>
                   </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <WideCard label="Remittance Cleared (NET)" value="412,450 PKR" sub="Gross Cash Vault" icon={<Wallet/>} color="bg-[#0c3740] text-[#2b945f]" onClick={()=>setActiveTab('finance')}/>
                  <WideCard label="Inbound (Awaiting Payout)" value="85,000 PKR" sub="Logical Receivables" icon={<Briefcase/>} color="bg-slate-900 text-white" onClick={()=>setActiveTab('finance')}/>
                  <WideCard label="Payroll Liquidity Gap" value="12,500 PKR" sub="Settlement Allocation" icon={<UserCheck/>} color="bg-[#5542f0] text-white" onClick={()=>setActiveTab('finance')}/>
              </div>
              <div className="grid lg:grid-cols-12 gap-8 h-[420px]">
                 <div className="lg:col-span-8 bg-white p-10 rounded-[40px] shadow-sm border overflow-hidden relative group font-black italic uppercase">
                    <h3 className="font-black italic text-base uppercase mb-10 underline decoration-indigo-200 decoration-4">Operational Cycle Load mapping</h3>
                    <div className="flex items-end justify-between h-48 border-b border-slate-50 px-20 font-black italic uppercase">
                        <div className="w-12 bg-indigo-500 rounded-t-xl h-[90%] shadow-lg shadow-indigo-100"></div>
                        <div className="w-12 bg-slate-100 rounded-t-xl h-0 border-2 border-dashed opacity-20"></div>
                        <div className="w-12 bg-[#2b945f] rounded-t-xl h-[75%] shadow-lg shadow-emerald-100"></div>
                        <div className="w-12 bg-emerald-500 rounded-t-xl h-[92%] shadow-lg shadow-emerald-100"></div>
                    </div>
                    <Sparkles size={60} className="absolute -bottom-10 -right-10 text-slate-100 rotate-45 opacity-30" />
                 </div>
                 <div className="lg:col-span-4 bg-[#0d1629] p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between font-black italic uppercase">
                    <div>
                        <div className="flex items-center gap-3 mb-10 text-indigo-400 font-black italic text-xs uppercase"><Clock size={16}/> Command Stream</div>
                        <div className="space-y-6 ml-1 border-l border-white/5 pl-6 font-black italic text-[9px] uppercase opacity-70">
                            <p><span className="text-indigo-400 font-black uppercase italic">Sarah Chen node</span> Update Received<br/><span className="text-[8px] opacity-20 italic font-black uppercase tracking-tighter">2M AGO</span></p>
                            <p><span className="text-indigo-400 font-black uppercase italic">Marcus Logic node</span> established<br/><span className="text-[8px] opacity-20 italic font-black uppercase tracking-tighter">45M AGO</span></p>
                        </div>
                    </div>
                    <div className="space-y-4 pt-10">
                        <button onClick={()=>setIsProjectModalOpen(true)} className="w-full flex justify-between bg-[#2b945f] text-white p-5 rounded-2xl font-black italic text-[10px] active:scale-95 shadow-2xl uppercase italic tracking-widest border-b-4 border-[#0c3740]">Authorize Master Node <Plus size={16}/></button>
                        <button onClick={downloadSystemReport} className="w-full flex justify-between bg-white/5 border border-white/10 text-white p-5 rounded-2xl font-black italic text-[10px] active:scale-95 uppercase italic tracking-widest">Logic Audit Report <FileDown size={16}/></button>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-6 normal-case not-italic font-black italic uppercase">
              <div className="flex justify-between items-start mb-8 font-black italic uppercase">
                <div>
                   <h2 className="text-2xl font-black text-[#000000] italic uppercase leading-none underline decoration-slate-200">Personnel Grid Mapping</h2>
                   <p className="text-slate-400 font-bold text-[12px] uppercase italic tracking-widest mt-2 opacity-60">HQ Terminal Direct Access Controls</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-[#121926] text-white px-5 py-3 rounded-2xl flex items-center gap-2 font-black text-xs shadow-xl active:scale-95 uppercase italic tracking-[0.2em] border-b-4 border-[#2b945f]">
                  <UserPlusIcon size={18}/> Establish User ID
                </button>
              </div>

              <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden font-sans">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white font-black italic uppercase">
                    <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-xl w-64 shadow-sm italic uppercase font-black">
                      <Search size={14} className="text-slate-400"/>
                      <input type="text" placeholder="FILTER NODES..." className="text-[11px] outline-none w-full font-black text-[#0c3740] placeholder:text-slate-300 italic uppercase"/>
                    </div>
                    <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-wider text-slate-400 italic">
                        <span className="flex items-center gap-2"><div className="size-2 rounded-full bg-emerald-500"></div> ACTIVE PERSONNEL</span>
                        <span className="flex items-center gap-2"><div className="size-2 rounded-full bg-[#ff4d4d] animate-pulse shadow-sm"></div> {pendingApprovals} AWAITING BOSS AUTH</span>
                    </div>
                </div>

                <table className="w-full text-left font-black italic uppercase">
                   <thead className="bg-[#FBFCFE] text-[10px] font-black uppercase text-slate-400 tracking-[0.1em] border-b border-slate-100 italic font-black uppercase">
                     <tr>
                        <th className="px-8 py-5">Identified Node</th>
                        <th className="px-8 py-5">Logical function Slot</th>
                        <th className="px-8 py-5 text-center">Status protocol</th>
                        <th className="px-8 py-5 text-center">Efficiency index</th>
                        <th className="px-8 py-5 text-right pr-12">Configuration Hub</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 text-[12px] font-black italic uppercase italic">
                     {filteredEmployees.map(emp => (
                       <tr key={emp.id} className={`hover:bg-[#F8FAFF] group transition-all duration-300 cursor-pointer ${!emp.is_approved ? 'bg-red-50/50' : ''}`}>
                         <td className="px-8 py-5" onClick={() => {setSelectedEmployee(emp); setIsEmpConfigOpen(true);}}>
                            <div className="flex items-center gap-4 italic font-black uppercase">
                                <div className="size-10 bg-[#f9fafc] rounded-xl flex items-center justify-center border-2 border-slate-100 relative overflow-hidden shadow-inner group-hover:scale-110 transition-transform">
                                   <img src={`https://i.pravatar.cc/150?u=${emp.id}`} className="size-full opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100" />
                                </div>
                                <div>
                                    <p className="font-black text-[#1a1a1a] mb-0.5 tracking-tighter uppercase italic">{emp.full_name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter opacity-30 italic font-mono">ID_{emp.id.slice(0,5).toUpperCase()}</p>
                                </div>
                            </div>
                         </td>
                         <td className="px-8 py-5">
                             <div className="flex items-center gap-2 text-slate-500 font-black italic opacity-60">
                                <Briefcase size={14} className="text-[#2b945f]"/> {emp.role}
                             </div>
                         </td>
                         <td className="px-8 py-5 font-black italic uppercase">
                             <div className="flex justify-center">
                                 <span className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-black border uppercase tracking-widest ${emp.is_approved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100 animate-pulse'}`}>
                                    <div className={`size-1.5 rounded-full ${emp.is_approved ? 'bg-emerald-500' : 'bg-[#ff4d4d]'}`}></div> {emp.is_approved ? "Authorized" : "Gateway lock"}
                                 </span>
                             </div>
                         </td>
                         <td className="px-8 py-5 font-black italic uppercase opacity-20">
                             <div className="flex items-center gap-4 justify-center">
                                 <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden italic uppercase font-black">
                                     <div className="h-full bg-indigo-500 rounded-full" style={{width: '60%'}}></div>
                                 </div>
                                 <span className="text-slate-300 font-black text-[10px]">OPTIMAL</span>
                             </div>
                         </td>
                         <td className="px-8 py-5 text-right pr-12">
                             <button onClick={() => {setSelectedEmployee(emp); setIsEmpConfigOpen(true);}} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                <ChevronRight size={18}/>
                             </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
             <div className="animate-in space-y-10 normal-case not-italic font-black italic uppercase">
                <div className="flex justify-between items-center mb-8 font-black italic uppercase italic">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 mb-1 leading-none italic uppercase">Orchestration sequencing</h2>
                        <p className="text-slate-400 font-bold text-[12px] uppercase opacity-40">technical sprint mapping cluster active</p>
                    </div>
                    <div className="flex items-center gap-4 italic font-black uppercase">
                        <button onClick={() => setIsTaskModalOpen(true)} className="bg-[#4c44f2] text-white px-7 py-3.5 rounded-xl flex items-center gap-3 font-black text-[11px] uppercase shadow-2xl transition-all hover:brightness-125 border-b-4 border-slate-900 italic font-black uppercase">
                           <Plus size={18}/> Generate Sequence node
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-6 min-h-[600px] italic font-black uppercase">
                    {[
                      { key: 'backlog', label: 'PRE_SYNC_TICKETS', icon: <Clock size={16} className="text-slate-400"/> },
                      { key: 'active', label: 'OPERATIONAL_LIVE', icon: <Zap size={16} className="text-[#4c44f2] animate-pulse"/> },
                      { key: 'audit', label: 'CODE_VERIFICATION', icon: <AlertCircle size={16} className="text-amber-500"/> },
                      { key: 'released', label: 'RELEASED_STABLE', icon: <CheckCircle2 size={16} className="text-emerald-500"/> }
                    ].map(col => (
                        <div key={col.key} className="space-y-4">
                            <div className="flex items-center justify-between px-3 mb-4 italic uppercase font-black text-[10px] tracking-[0.25em]">
                               <div className="flex items-center gap-3 opacity-60">
                                  {col.icon}
                                  <h4 className="text-slate-800 font-black italic">{col.label}</h4>
                               </div>
                               <span className="bg-[#eff2f7] text-[#4c44f2] text-[10px] px-2.5 py-0.5 rounded-full border border-slate-100 font-black italic shadow-inner">{tasks.filter(t=>t.status === col.key).length}</span>
                            </div>

                            <div className="bg-[#f3f6fa] rounded-[45px] p-2.5 min-h-[500px] space-y-3 border-4 border-dashed border-white shadow-inner">
                                {tasks.filter(t => t.status === col.key).map(task => (
                                    <div key={task.id} onClick={()=>{setSelectedTask(task); setIsTaskModalOpen(true);}} className="bg-white p-7 rounded-[38px] shadow-sm hover:shadow-2xl group cursor-pointer transition-all border border-slate-50 relative font-black italic uppercase italic">
                                        <div className="flex justify-between mb-6 opacity-30 italic font-black">
                                           <span className="text-[8.5px] font-black text-[#2b945f] bg-[#f0fff8] px-3 py-1 rounded-full uppercase tracking-widest">{task.priority}_SLO</span>
                                        </div>
                                        <h4 className="text-[12px] font-black text-[#0c3740] italic uppercase mb-8 leading-snug tracking-tighter italic">{task.title}</h4>
                                        <div className="flex items-center justify-between pt-6 border-t-2 border-slate-50 mt-auto font-black italic uppercase">
                                            <div className="flex items-center gap-3 font-black italic">
                                               <div className="size-7 rounded-xl bg-slate-100 border-2 border-white overflow-hidden shadow-inner"><img src={`https://i.pravatar.cc/150?u=${task.id}`} className="grayscale"/></div>
                                               <p className="text-[8.5px] font-black text-slate-400 uppercase italic truncate opacity-40">{task.assigned_to.split(' ')[0]}_DEV</p>
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-200 flex items-center gap-1 font-mono">{task.id.slice(-2)}H_REMAIN</div>
                                        </div>
                                    </div>
                                ))}
                                <button className="w-full py-8 rounded-[40px] border-4 border-dashed border-white bg-slate-50/20 text-slate-200 text-[10px] font-black uppercase tracking-widest italic flex items-center justify-center gap-2 hover:bg-white transition-all">
                                   <Plus size={16}/> establishment layer_add
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
          )}

          {activeTab === 'settings' && (
             <div className="animate-in space-y-12 pb-20 font-black italic uppercase">
                <div className="flex justify-between items-start border-b-8 border-slate-50 pb-8 font-black italic uppercase leading-none italic uppercase italic">
                    <div>
                        <h2 className="text-4xl text-[#000000] tracking-tighter italic font-black underline decoration-[#2b945f]/20 underline-offset-[14px]">System HQ Logistics Logic Hub</h2>
                        <p className="text-[11px] opacity-30 tracking-[0.5em] mt-5 italic leading-none font-bold uppercase font-black italic font-black uppercase italic font-black">Control Terminal layer Access ID: RABNAWAZ_HQ_GATE</p>
                    </div>
                    <button onClick={downloadSystemReport} className="bg-[#0c3740] text-white p-5 border-b-[8px] border-[#2b945f] rounded-3xl shadow-2xl flex items-center gap-5 active:scale-95 active:translate-y-2 transition-all font-black uppercase italic text-[11px] tracking-widest italic font-black"><Printer size={20} className="animate-bounce" /> Print Logic Archive Audit</button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 font-black italic uppercase font-black">
                   <section className="bg-white p-14 rounded-[55px] border-4 border-[#eff2f7] shadow-2xl space-y-12 relative overflow-hidden italic font-black uppercase italic font-black italic font-black">
                      <h4 className="text-[14px] uppercase text-[#0c3740] tracking-[0.3em] italic border-l-8 border-[#2b945f] pl-6 font-black uppercase">Technical modifier sequencing</h4>
                      <div className="space-y-12 font-black italic uppercase">
                          <div className="space-y-5 font-black italic uppercase font-black uppercase font-black uppercase font-black uppercase font-black italic uppercase font-black"><label className="text-[11px] opacity-40 block tracking-[0.25em] font-black italic">Maintanence node timeout span (days_unit)</label> <input type="number" value={gracePeriod} onChange={e=>setGracePeriod(e.target.value)} className="w-full bg-[#f9fafc] p-6 rounded-[35px] text-3xl outline-none font-black italic uppercase border-4 border-slate-100 shadow-inner focus:border-[#2b945f] transition-all"/></div>
                          <div className="space-y-5 pt-4 font-black italic uppercase font-black uppercase font-black"><label className="text-[11px] opacity-40 block tracking-[0.25em] font-black italic uppercase">Market Conversion Logic Unit (USD/PKR index)</label> <div className="bg-[#f9fafc] flex items-center p-6 rounded-[40px] shadow-inner border-4 border-slate-100 italic font-black uppercase"><p className="text-xs opacity-20 mr-8 font-black italic uppercase font-black">logic index</p><input type="number" value={marketRate} onChange={e=>setMarketRate(e.target.value)} className="flex-1 bg-transparent text-3xl outline-none font-black italic uppercase font-black uppercase italic font-black"/></div></div>
                      </div>
                      <button className="w-full bg-[#0c3740] text-white py-8 rounded-[38px] font-black italic text-xl shadow-2xl border-b-[10px] border-[#2b945f] active:border-b-0 active:translate-y-2 transition-all tracking-[0.2em] italic uppercase italic">commit Logical Modifier sequence</button>
                   </section>
                   <div className="space-y-8 font-black italic uppercase font-black uppercase font-black">
                      <div className="bg-white rounded-[55px] p-12 border-4 border-[#eff2f7] shadow-2xl space-y-10 font-black italic uppercase font-black uppercase font-black italic uppercase italic">
                           <h4 className="text-[11px] uppercase text-[#2b945f] tracking-[0.5em] italic border-b-2 border-slate-50 pb-6 font-black uppercase font-black uppercase font-black uppercase font-black italic uppercase">Projected Currency disbursal ENGINE (PKR_REMITTANCE)</h4>
                           <div className="bg-[#f9fafc] p-10 rounded-[45px] font-black italic uppercase border-4 border-slate-100 shadow-inner italic font-black uppercase italic">
                                <div className="mb-12 font-black italic uppercase italic">
                                    <p className="text-[10px] opacity-30 mb-4 tracking-[0.4em] italic font-black uppercase">Establish Input Index (USD Value Node)</p>
                                    <input type="number" onChange={e=>setCalcUsd(e.target.value)} value={calcUsd} className="bg-white border-4 border-slate-100 p-8 rounded-[35px] w-full text-5xl font-black italic shadow-2xl focus:border-[#2b945f] outline-none text-[#0c3740] tracking-tighter uppercase font-black uppercase italic"/>
                                </div>
                                <div className="bg-[#0d1629] text-[#2b945f] p-14 rounded-[50px] text-center font-black italic border-[14px] border-white shadow-2xl italic font-black uppercase italic">
                                    <p className="text-[10px] opacity-30 mb-6 uppercase tracking-[0.6em] font-black italic font-black uppercase italic">Liquidity Mapping result (Local Yield Output)</p>
                                    <p className="text-5xl font-black tracking-tighter leading-none italic uppercase">{(calcUsd * marketRate).toLocaleString()}.00 PKR</p>
                                    <p className="text-[9px] opacity-20 mt-6 tracking-widest font-black italic uppercase">Based on Matrix Index Rate: {marketRate}</p>
                                </div>
                           </div>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'projects' && (
             <div className="animate-in slide-in-from-right-4 duration-700 font-black italic uppercase normal-case not-italic italic uppercase italic font-black italic uppercase italic">
                <div className="flex justify-between items-center mb-14 font-black italic uppercase italic">
                  <div>
                    <h2 className="text-4xl font-black tracking-tighter text-[#121926] leading-none italic uppercase underline decoration-[#2b945f]/20 underline-offset-8 italic font-black uppercase italic font-black uppercase italic font-black italic font-black uppercase italic font-black">Release Cluster Initiative Matrix</h2>
                  </div>
                  <div className="flex items-center gap-5 italic font-black uppercase font-black uppercase font-black">
                     <button onClick={()=>setIsProjectModalOpen(true)} className="flex items-center gap-3 bg-[#0c3740] text-white px-8 py-4 rounded-2xl font-black text-xs shadow-2xl active:translate-y-1 transition-all border-b-8 border-[#2b945f] italic uppercase italic">
                        <Plus size={22}/> Establish New Matrix node
                     </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 font-black italic uppercase italic font-black uppercase italic font-black uppercase italic font-black">
                   {filteredProjects.map(proj => (
                      <div key={proj.id} onClick={()=>{setSelectedProject(proj); setIsDetailModalOpen(true)}} className="bg-white rounded-[55px] p-10 border-4 border-[#f9fafc] hover:border-[#2b945f]/40 hover:shadow-2xl hover:-translate-y-3 transition-all cursor-pointer group shadow-xl relative overflow-hidden font-black italic uppercase italic">
                          <div className="flex justify-between items-start mb-12 italic font-black uppercase font-black uppercase font-black italic font-black">
                            <span className="bg-[#f0f9f6] text-[#2b945f] text-[10px] font-black px-5 py-2 rounded-2xl uppercase tracking-[0.3em] italic border-2 border-[#2b945f]/20">Protocol ACTIVE_STABLE</span>
                            <div className="size-3 bg-slate-50 border border-slate-100 rounded-full group-hover:bg-[#2b945f] group-hover:animate-ping group-hover:shadow-[0_0_20px_#2b945f] transition-all italic font-black"></div>
                          </div>
                          <h4 className="text-3xl font-black text-[#0c3740] mb-3 leading-none tracking-tighter italic uppercase italic font-black uppercase italic">{proj.project_name}</h4>
                          <p className="text-slate-400 text-[10px] mb-12 leading-none opacity-40 font-black italic italic font-black uppercase">LOGIC_CORE ID IDENTIFIER: {proj.client_name.toUpperCase()}</p>
                          
                          <div className="flex items-center gap-8 text-[#0c3740] text-[11px] font-black mb-12 opacity-80 italic font-black border-y-2 border-slate-50 py-6 uppercase font-black italic">
                            <span className="flex items-center gap-4 italic"><User size={20} className="text-[#2b945f]"/> {employees.find(e=>e.id === proj.assigned_to)?.full_name || 'MASTER_HQ_TERMINAL'}</span>
                          </div>

                          <div className="space-y-4 font-black italic uppercase font-black italic font-black italic">
                             <div className="flex justify-between text-[11px] font-black tracking-[0.3em] text-slate-300 italic uppercase"><span>SLA Performance Mapping</span><span>78%</span></div>
                             <div className="w-full h-3 bg-[#f3f6fa] rounded-full overflow-hidden shadow-inner border border-white italic">
                                <div className="bg-[#2b945f] h-full rounded-full transition-all duration-1000 shadow-lg shadow-[#2b945f]/40 border-r-4 border-white" style={{width: '78%'}}></div>
                             </div>
                          </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

        </div>
      </main>

      {/* TEAM CONFIGURATION / MANAGEMENT MODAL - DECISION GATEWAY (sir rabnawaz layers) */}
      {isEmpConfigOpen && selectedEmployee && (
         <div className="fixed inset-0 bg-[#0c3740]/98 backdrop-blur-3xl z-[10000] flex items-center justify-center p-4 selection:bg-[#2b945f]">
             <div className="bg-white w-full max-w-[500px] rounded-[70px] overflow-hidden shadow-2xl border-4 border-white/20 animate-in zoom-in-95 duration-500 font-black italic uppercase italic">
                 <div className="bg-[#0c3740] p-14 text-white relative font-black italic uppercase font-black italic font-black uppercase">
                    <div className="flex justify-between items-start font-black italic uppercase font-black uppercase">
                        <div className="flex items-center gap-7 italic font-black">
                            <div className="bg-white/5 p-5 rounded-[30px] shadow-2xl backdrop-blur-3xl border border-white/10 group-hover:scale-110 transition-transform">
                                <UserCheck className="text-[#2b945f]" size={42} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight leading-none mb-2 italic">Matrix Decision Gate</h3>
                                <p className="text-[12px] text-[#2b945f] font-black uppercase tracking-[0.4em] italic opacity-60">Handshake protocol ID: UUID_{selectedEmployee.id.slice(0,5).toUpperCase()}</p>
                            </div>
                        </div>
                        <button onClick={() => setIsEmpConfigOpen(false)} className="hover:rotate-90 transition-all text-white/40 hover:text-white duration-500"><X size={44}/></button>
                    </div>
                 </div>

                 <div className="px-14 pb-16 -mt-16 relative bg-white font-black italic uppercase italic">
                     <div className="flex justify-center mb-12 relative italic font-black uppercase font-black italic">
                         <div className="relative group italic font-black">
                            <div className="size-48 bg-[#fcfdfe] rounded-[60px] border-[18px] border-white shadow-[0_20px_80px_rgba(0,0,0,0.1)] overflow-hidden shadow-[#0c3740]/30 flex items-center justify-center font-black italic">
                               <User size={80} className="text-[#eff2f7] group-hover:text-[#2b945f] transition-colors" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-white p-5 rounded-[32px] shadow-2xl border-4 border-[#f9fafc]">
                               <ShieldCheck size={34} className={selectedEmployee.is_approved ? "text-emerald-500 shadow-emerald-200" : "text-[#ff3d3d] animate-pulse"} />
                            </div>
                         </div>
                     </div>

                     <div className="space-y-10 font-black italic uppercase font-black italic uppercase italic font-black italic">
                        <DetailField label="Operational NODE Name identifier" value={selectedEmployee.full_name} icon={<User size={18}/>} />
                        <DetailField label="Technical Personnel function cluster" value={selectedEmployee.role} icon={<Briefcase size={18}/>} />

                        {/* --- HQ COMMAND PROTOCOLS --- */}
                        <div className="pt-10 border-t-8 border-slate-50 mt-14 space-y-5 font-black italic uppercase font-black uppercase font-black">
                           {!selectedEmployee.is_approved ? (
                             <div className="flex flex-col gap-5 italic font-black">
                                <button 
                                  type="button" 
                                  onClick={() => approveEmployee(selectedEmployee.id, selectedEmployee.full_name)}
                                  className="w-full bg-[#2b945f] text-white py-8 rounded-[40px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:translate-y-2 border-b-[10px] border-[#0c3740] transition-all flex items-center justify-center gap-5 italic font-black"
                                >
                                   <UserCheck size={28}/> Establish Protocol passage link
                                </button>
                                <button onClick={()=>deleteEmployee(selectedEmployee.id)} type="button" className="w-full text-[#ff3d3d] py-4 font-black italic text-[11px] uppercase tracking-widest opacity-30 hover:opacity-100 hover:underline transition-all">
                                   Purge ID Node & Terminate attempt
                                </button>
                             </div>
                           ) : (
                             <div className="flex gap-5 font-black italic uppercase font-black">
                                <button type="button" className="flex-1 bg-white border-4 border-slate-50 text-slate-200 py-7 rounded-[40px] font-black text-[13px] uppercase shadow-inner flex items-center justify-center gap-4 transition-all italic font-black italic uppercase opacity-60">
                                   <HardDriveDownload size={22}/> Save Node Logic
                                </button>
                                <button onClick={()=>deleteEmployee(selectedEmployee.id)} type="button" className="bg-[#ff4d4d]/5 text-[#ff4d4d] border-4 border-[#ff4d4d]/10 px-10 py-7 rounded-[40px] font-black text-[13px] uppercase shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all italic font-black uppercase">
                                    <Trash2 size={26}/> Kill Matrix node
                                </button>
                             </div>
                           )}
                        </div>
                     </div>
                 </div>
             </div>
         </div>
      )}

      {/* MATRIX REGISTRATION MODAL (manual gateway entry) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0c3740]/98 backdrop-blur-2xl z-[9999] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-[420px] rounded-[65px] overflow-hidden border-[10px] border-white shadow-2xl font-black italic uppercase animate-in duration-300 zoom-in-95 font-black italic">
              <div className="bg-[#0c3740] p-12 text-white flex justify-between items-center border-b-[10px] border-[#2b945f] font-black italic uppercase">
                <div className="flex items-center gap-5 italic font-black uppercase">
                    <UserPlusIcon size={26} className="text-[#2b945f]"/>
                    <h4 className="text-sm tracking-[0.3em] italic font-black uppercase font-black uppercase">Establish Manual Node</h4>
                </div>
                <X onClick={()=>setIsModalOpen(false)} size={38} className="text-white/20 cursor-pointer hover:rotate-90 duration-500 font-black italic"/>
              </div>
              <form onSubmit={handleAddEmployee} className="p-14 space-y-8 font-black italic uppercase"> 
                  <input required value={newEmp.full_name} onChange={e=>setNewEmp({...newEmp, full_name: e.target.value})} placeholder="Map string ID Node..." className="w-full bg-[#f9fafc] border-4 border-slate-100 p-7 rounded-[35px] outline-none font-black italic placeholder:opacity-20 uppercase shadow-inner focus:border-[#2b945f] transition-all text-xl italic font-black"/>
                  <input required value={newEmp.role} onChange={e=>setNewEmp({...newEmp, role: e.target.value})} placeholder="Allocate cluster Role..." className="w-full bg-[#f9fafc] border-4 border-slate-100 p-7 rounded-[35px] outline-none font-black italic placeholder:opacity-20 uppercase shadow-inner focus:border-[#2b945f] transition-all text-xl italic font-black"/>
                  <button type="submit" className="w-full bg-[#0c3740] text-white py-7 rounded-[40px] font-black italic uppercase tracking-[0.25em] shadow-2xl active:translate-y-2 border-b-[10px] border-[#2b945f] transition-all italic font-black border-none uppercase italic font-black">Confirm Cluster Establishment</button>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}

// SHARED INTERFACE NODE COMPONETS (PRESERVED SYSTEM STYLING)
function NavButton({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-5 px-6 py-5 rounded-[28px] font-black text-[12px] uppercase tracking-[0.3em] transition-all relative group font-black italic uppercase italic
    ${active ? 'bg-[#0c3740] text-white shadow-2xl scale-[1.05] translate-x-2 border-l-[10px] border-[#2b945f] font-black italic uppercase' : 'text-white/40 hover:bg-white/5 hover:text-white italic opacity-80 uppercase'}`}>
      <span className={active ? 'bg-[#2b945f]/30 p-2.5 rounded-[15px]' : 'opacity-20 group-hover:scale-150 transition-transform font-black'}>{icon}</span> {label}
      {active && <div className="absolute right-6 size-2 bg-[#2b945f] rounded-full animate-pulse shadow-[0_0_20px_#2b945f] font-black"></div>}
    </button>
  );
}

function ModernCard({ label, value, icon, color, onClick }) {
  return (
    <div onClick={onClick} className="bg-white p-11 rounded-[55px] border-4 border-white shadow-xl hover:border-[#2b945f]/30 hover:shadow-2xl transition-all cursor-pointer group hover:-translate-y-4 relative duration-700 font-black italic uppercase italic font-black uppercase">
       <div className="flex justify-between w-full mb-12 font-black italic uppercase italic">
         <div className={`p-7 ${color} rounded-[32px] transition-all duration-1000 group-hover:scale-125 shadow-2xl group-hover:rotate-[360deg] italic`}>{icon}</div>
         <p className="text-[10px] text-slate-100 font-black italic uppercase tracking-[0.4em] opacity-30 group-hover:opacity-100 transition-opacity">Logical node Scan Hub</p>
       </div>
       <h4 className="text-6xl text-[#0c3740] font-black italic uppercase tracking-tighter leading-none mb-6 italic">{value}</h4>
       <p className="text-[11px] text-slate-400 font-black italic tracking-[0.3em] pt-6 border-t-[4px] border-[#f9fafc] opacity-60 uppercase italic">{label}</p>
    </div>
  );
}

function WideCard({ label, value, sub, icon, color, onClick }) {
    return (
      <div onClick={onClick} className={`${color} p-12 rounded-[60px] shadow-2xl flex items-center justify-between group overflow-hidden active:scale-95 transition-all cursor-pointer font-black italic uppercase relative border-[12px] border-white/5 italic`}>
         <div className="relative z-10 font-black italic uppercase italic font-black uppercase">
            <p className="text-[11px] opacity-40 mb-5 tracking-[0.5em] italic uppercase font-black uppercase italic">{label}</p>
            <h4 className="text-5xl font-black italic tracking-tighter leading-none uppercase italic font-black">{value}</h4>
            <p className="text-[11px] opacity-20 tracking-[0.6em] font-mono mt-6 italic uppercase italic font-black">{sub}</p>
         </div>
         <div className="bg-white/5 p-10 rounded-[45px] group-hover:rotate-[30deg] transition-all duration-1000 shadow-2xl border border-white/10 group-hover:scale-150 group-hover:bg-[#2b945f]/40 group-hover:animate-pulse font-black italic">{icon}</div>
      </div>
    );
}

function DetailField({ label, value, icon }) {
    return (
        <div className="space-y-4 group font-black italic uppercase italic">
            <label className="flex items-center gap-4 text-[11px] text-[#2b945f] opacity-80 tracking-[0.3em] uppercase italic font-black uppercase italic">{icon} {label}</label>
            <div className="w-full bg-[#f9fafc] border-[6px] border-white px-9 py-6 rounded-[35px] shadow-inner font-black text-[#0c3740] text-2xl opacity-90 uppercase italic tracking-tighter transition-all group-hover:border-[#2b945f]/20 font-black italic">{value}</div>
        </div>
    )
}