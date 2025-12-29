import React, { useState, useEffect } from 'react';
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
  Zap, History
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

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    const { data: profs } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: projs } = await supabase.from('projects').select('*').order('last_report_date', { ascending: true });
    
    setEmployees(profs || []);
    setProjects(projs || []);
    setTasks([
      { id: '0XD46498', title: 'Fix memory leak in websocket', assigned_to: 'Elena Rodriguez', status: 'backlog', priority: 'P0', role: 'Backend' },
      { id: '0XD46501', title: 'Implement OAuth2 integration', assigned_to: 'Sarah Chen', status: 'active', priority: 'P0', role: 'Security' },
      { id: '0XD46505', title: 'CDN Edge Node Optimization', assigned_to: 'Marcus Dev', status: 'backlog', priority: 'P1', role: 'Infrastructure' }
    ]);
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
    <div className="flex h-screen w-full bg-[#fcfdfe] font-sans overflow-hidden text-[#1a1a1a] selection:bg-cnLightGreen selection:text-white uppercase font-black italic">
      
      {/* SIDEBAR UPDATED TO #2b945f */}
      <aside className="w-60 bg-[#2b945f] text-white flex flex-col shadow-2xl z-50 shrink-0 hidden md:flex border-r border-white/5 transition-colors duration-500">
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
            <h1 className="text-xl font-black italic uppercase tracking-tight">System</h1>
            <div className="flex items-center gap-4 bg-[#eff2f7] px-6 py-2.5 rounded-full w-96 border border-slate-100">
               <Search size={16} className="text-slate-400" />
               <input value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} type="text" placeholder="Search projects, tasks, devs..." className="bg-transparent border-none text-[11px] font-black tracking-widest text-[#000000] outline-none w-full uppercase placeholder:text-slate-400 italic"/>
            </div>
          </div>
          <div className="flex items-center gap-6 relative">
              <button className="flex items-center gap-2 bg-[#F3F4FF] text-[#4c44f2] px-4 py-2 rounded-xl text-[10px] font-bold">
                 <Sparkles size={14}/> Ask Nest AI
              </button>
              <div className="relative p-2" onClick={() => setActiveTab('employees')}>
                  <Bell size={20} className={pendingApprovals > 0 ? "text-red-600 animate-bounce" : "text-slate-400"} />
                  {pendingApprovals > 0 && <span className="absolute top-1 right-1 bg-red-600 text-white text-[8px] font-black rounded-full px-1 min-w-[14px] flex items-center justify-center border-2 border-white">{pendingApprovals}</span>}
              </div>
              <div className="flex items-center gap-3 pl-4 cursor-pointer" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-[#000000] uppercase italic">Sir Rabnawaz</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase italic">HQ Administrator</p>
                  </div>
                  <div className="size-10 bg-[#0c3740] text-[#2b945f] rounded-full flex items-center justify-center font-black italic text-lg border-2 border-white">R</div>
              </div>
              {isProfileOpen && (
                 <div className="absolute top-16 right-0 w-64 bg-[#0d1629] border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden text-white font-black uppercase italic p-4">
                    <div className="p-3 border-b border-white/5 mb-3">
                        <p className="text-[9px] text-indigo-400 mb-1">Admin Session</p>
                        <p className="text-xs truncate italic">mameerhamzak07@gmail.com</p>
                    </div>
                    <button className="w-full flex items-center gap-2 p-3 text-[10px] hover:bg-white/5 rounded-xl"><User size={14}/> My Profile</button>
                    <button className="w-full flex items-center gap-2 p-3 text-[10px] hover:bg-white/5 rounded-xl"><Settings size={14}/> Account Settings</button>
                    <button onClick={()=>supabase.auth.signOut()} className="w-full flex items-center gap-2 p-3 text-[10px] text-red-400 mt-4 border-t border-white/5 pt-4 hover:brightness-150 transition-all"><LogOut size={14}/> Logout</button>
                 </div>
              )}
          </div>
        </header>

        <div className="p-8 space-y-8">
          
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <ModernCard label="Active Projects" value={projects.length} icon={<Activity size={24}/>} color="bg-blue-50 text-blue-500" onClick={()=>setActiveTab('projects')}/>
                <ModernCard label="Tasks Completed" value="0" icon={<CheckSquare size={24}/>} color="bg-emerald-50 text-emerald-500" onClick={()=>setActiveTab('tasks')}/>
                <div className="bg-white p-8 rounded-[32px] border shadow-sm">
                   <h3 className="text-xs font-black italic flex items-center gap-2"><Calendar size={18} className="text-pink-500"/> DEADLINES</h3>
                   <div className="mt-8 space-y-6"><div className="border-b pb-2 flex justify-between"><p className="text-[10px] font-black italic">TITAN_CORE</p><p className="text-pink-500 text-[10px]">64%</p></div><div className="border-b pb-2 flex justify-between"><p className="text-[10px] font-black italic">NEBULA_APP</p><p className="text-pink-500 text-[10px]">78%</p></div></div>
                </div>
                <div className="bg-white p-8 rounded-[32px] border shadow-sm">
                   <h3 className="text-xs font-black italic flex items-center gap-2 text-amber-500"><AlertCircle size={18}/> URGENT TASKS</h3>
                   <div className="mt-6 space-y-4">
                     <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between text-[8px] font-black italic"><span>OAUTH PROTOCOL FIX</span><div className="size-5 bg-black rounded-full"></div></div>
                     <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between text-[8px] font-black italic"><span>DB_NODE_LATENCY</span><div className="size-5 bg-blue-500 rounded-full"></div></div>
                   </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <WideCard label="Payments Cleared (NET)" value="412,450 PKR" sub="Gross Remittance Ledger" icon={<Wallet/>} color="bg-[#0c3740] text-[#2b945f]" onClick={()=>setActiveTab('finance')}/>
                  <WideCard label="Awaiting payout (Client)" value="85,000 PKR" sub="Pending Inbound Nodes" icon={<Briefcase/>} color="bg-slate-900 text-white" onClick={()=>setActiveTab('finance')}/>
                  <WideCard label="Awaiting payout (Employee)" value="12,500 PKR" sub="Staff Settlement Queue" icon={<UserCheck/>} color="bg-[#5542f0] text-white" onClick={()=>setActiveTab('finance')}/>
              </div>
              <div className="grid lg:grid-cols-12 gap-8 h-[420px]">
                 <div className="lg:col-span-8 bg-white p-10 rounded-[40px] shadow-sm border overflow-hidden relative group">
                    <h3 className="font-black italic text-base uppercase mb-10 underline decoration-indigo-200 decoration-4">Sprint Workload Analysis</h3>
                    <div className="flex items-end justify-between h-48 border-b border-slate-50 px-20">
                        <div className="w-12 bg-indigo-500 rounded-t-xl h-[90%] shadow-lg shadow-indigo-100"></div>
                        <div className="w-12 bg-slate-100 rounded-t-xl h-0 border-2 border-dashed"></div>
                        <div className="w-12 bg-pink-500 rounded-t-xl h-[75%] shadow-lg shadow-pink-100"></div>
                        <div className="w-12 bg-emerald-500 rounded-t-xl h-[92%] shadow-lg shadow-emerald-100"></div>
                    </div>
                    <Sparkles size={60} className="absolute -bottom-10 -right-10 text-slate-100 rotate-45" />
                 </div>
                 <div className="lg:col-span-4 bg-[#0d1629] p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-10 text-indigo-400 font-black italic text-xs uppercase"><Clock size={16}/> Recent HQ Activity</div>
                        <div className="space-y-6 ml-1 border-l border-white/5 pl-6 font-black italic text-[9px] uppercase opacity-70">
                            <p><span className="text-indigo-400 font-black">Sarah Chen</span> Audit Completed<br/><span className="text-[8px] opacity-20 italic">2M AGO</span></p>
                            <p><span className="text-indigo-400 font-black">Marcus</span> node updated<br/><span className="text-[8px] opacity-20 italic">45M AGO</span></p>
                        </div>
                    </div>
                    <div className="space-y-4 pt-10">
                        <button onClick={()=>setIsProjectModalOpen(true)} className="w-full flex justify-between bg-white text-black p-5 rounded-2xl font-black italic text-[10px] active:scale-95 shadow-2xl uppercase">Publish Release <Plus size={16}/></button>
                        <button onClick={downloadSystemReport} className="w-full flex justify-between bg-white/5 border border-white/10 text-white p-5 rounded-2xl font-black italic text-[10px] active:scale-95 uppercase">Sprint Report <FileDown size={16}/></button>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="animate-in space-y-6 normal-case not-italic">
              <div className="flex justify-between items-start mb-8">
                <div>
                   <h2 className="text-2xl font-black text-[#000000]">Engineering Team</h2>
                   <p className="text-slate-400 font-bold text-[12px]">Manage directory and cross-functional user roles</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-[#121926] text-white px-5 py-3 rounded-2xl flex items-center gap-2 font-bold text-xs shadow-xl active:scale-95">
                  <UserPlus size={18}/> Add New User
                </button>
              </div>

              <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden font-sans">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-xl w-64 shadow-sm">
                      <Search size={14} className="text-slate-400"/>
                      <input type="text" placeholder="Filter users by name or role..." className="text-[11px] outline-none w-full font-bold text-slate-600"/>
                    </div>
                    <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <span className="flex items-center gap-2"><div className="size-2 rounded-full bg-emerald-500"></div> 2 ONLINE</span>
                        <span className="flex items-center gap-2"><div className="size-2 rounded-full bg-amber-500"></div> 1 BUSY</span>
                        <span className="flex items-center gap-2"><div className="size-2 rounded-full bg-slate-200"></div> 0 OFFLINE</span>
                    </div>
                </div>

                <table className="w-full text-left">
                   <thead className="bg-[#FBFCFE] text-[10px] font-black uppercase text-slate-400 tracking-[0.1em]">
                     <tr>
                        <th className="px-8 py-5">User</th>
                        <th className="px-8 py-5">Assigned Role</th>
                        <th className="px-8 py-5 text-center">Status</th>
                        <th className="px-8 py-5 text-center">Commits (30D)</th>
                        <th className="px-8 py-5 text-right pr-12">Location</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 text-[12px]">
                     {filteredEmployees.map(emp => (
                       <tr key={emp.id} onClick={() => {setSelectedEmployee(emp); setIsEmpConfigOpen(true);}} className="hover:bg-[#F8FAFF] group cursor-pointer transition-colors">
                         <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                                <div className="size-10 bg-slate-50 rounded-xl flex items-center justify-center border-2 border-slate-100 relative overflow-hidden shadow-inner">
                                   <ImageIcon size={20} className="text-slate-200 opacity-60" />
                                </div>
                                <div>
                                    <p className="font-black text-[#1a1a1a] mb-0.5">{emp.full_name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter opacity-70">ID: {emp.id.split('-')[1]?.slice(0,4) || '710'}</p>
                                </div>
                            </div>
                         </td>
                         <td className="px-8 py-5">
                             <div className="flex items-center gap-2 text-slate-500 font-bold">
                                <Briefcase size={14} className="opacity-40"/> {emp.role}
                             </div>
                         </td>
                         <td className="px-8 py-5">
                             <div className="flex justify-center">
                                 <span className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-black border uppercase tracking-widest ${emp.is_approved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                    <div className={`size-1.5 rounded-full ${emp.is_approved ? 'bg-emerald-500' : 'bg-amber-500'}`}></div> {emp.is_approved ? "Online" : "Busy"}
                                 </span>
                             </div>
                         </td>
                         <td className="px-8 py-5">
                             <div className="flex items-center gap-4 justify-center">
                                 <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                     <div className="h-full bg-indigo-500 rounded-full" style={{width: '60%'}}></div>
                                 </div>
                                 <span className="text-slate-400 font-bold text-[11px]">142</span>
                             </div>
                         </td>
                         <td className="px-8 py-5 text-right pr-12">
                             <div className="inline-flex items-center gap-2 text-slate-400 font-bold">
                                 <Globe size={14} className="opacity-40"/> GMT+5
                             </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
             <div className="animate-in space-y-10 normal-case not-italic">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 mb-1">Workflow Management</h2>
                        <p className="text-slate-400 font-bold text-[12px]">Real-time task orchestration across global engineering clusters</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-white border-2 border-slate-50 flex items-center px-5 py-2.5 rounded-2xl shadow-sm">
                           <Search size={16} className="text-slate-300 mr-3"/>
                           <input type="text" placeholder="Search tasks..." className="bg-transparent border-none text-[12px] font-bold outline-none w-52"/>
                        </div>
                        <button className="bg-white border px-6 py-2.5 rounded-xl font-black text-[10px] text-slate-400 shadow-sm flex items-center gap-3">
                           PRIORITY: ALL <ChevronRight size={14} className="rotate-90 opacity-40"/>
                        </button>
                        <button onClick={() => setIsTaskModalOpen(true)} className="bg-[#4c44f2] text-white px-7 py-2.5 rounded-xl flex items-center gap-2 font-black text-[11px] uppercase shadow-2xl shadow-indigo-600/30 active:scale-95">
                           <Plus size={18}/> Add Entry
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-6 min-h-[600px]">
                    {[
                      { key: 'backlog', label: 'BACKLOG', icon: <Clock size={16} className="text-slate-400"/> },
                      { key: 'active', label: 'ACTIVE', icon: <Zap size={16} className="text-[#4c44f2]"/> },
                      { key: 'audit', label: 'AUDIT', icon: <AlertCircle size={16} className="text-amber-500"/> },
                      { key: 'released', label: 'RELEASED', icon: <CheckCircle2 size={16} className="text-emerald-500"/> }
                    ].map(col => (
                        <div key={col.key} className="space-y-4">
                            <div className="flex items-center justify-between px-2 mb-4">
                               <div className="flex items-center gap-3">
                                  {col.icon}
                                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800">{col.label}</h4>
                               </div>
                               <span className="bg-white text-slate-400 text-[10px] px-2.5 py-0.5 rounded-full border border-slate-100 font-black">{tasks.filter(t=>t.status === col.key).length}</span>
                            </div>

                            <div className="bg-[#f3f6fa] rounded-[38px] p-2.5 min-h-[500px] space-y-3 border-2 border-dashed border-slate-200">
                                {tasks.filter(t => t.status === col.key).map(task => (
                                    <div key={task.id} onClick={()=>{setSelectedTask(task); setIsTaskModalOpen(true);}} className="bg-white p-6 rounded-[30px] shadow-sm hover:shadow-xl group cursor-pointer transition-all border border-slate-100 relative">
                                        <div className="flex justify-between mb-5">
                                           <span className="text-[8.5px] font-black text-pink-500 bg-pink-50 px-3 py-1 rounded-full border border-pink-100">{task.priority} CRITICAL</span>
                                        </div>
                                        <h4 className="text-[13px] font-black text-slate-800 italic uppercase mb-6 leading-snug">{task.title}</h4>
                                        <div className="flex items-center justify-between pt-5 border-t border-slate-50 mt-auto">
                                            <div className="flex items-center gap-3">
                                               <div className="size-7 rounded-full bg-slate-100 border overflow-hidden"><img src={`https://i.pravatar.cc/150?u=${task.id}`}/></div>
                                               <p className="text-[9px] font-black text-slate-400 uppercase italic truncate">{task.assigned_to}</p>
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-300 flex items-center gap-1"><Clock size={12}/> 4D LEFT</div>
                                        </div>
                                    </div>
                                ))}
                                <button className="w-full py-5 rounded-[28px] border-2 border-dashed border-slate-300 text-slate-300 text-[10px] font-black uppercase tracking-widest italic flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                                   <Plus size={16}/> New Entry
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
          )}

          {activeTab === 'settings' && (
             <div className="animate-in space-y-12 pb-20">
                <div className="flex justify-between items-start border-b-8 border-slate-50 pb-8 italic font-black uppercase">
                    <div>
                        <h2 className="text-4xl text-[#000000] tracking-tighter italic underline decoration-[#1a1a1a]/10 underline-offset-4 italic font-black uppercase">HQ Commands parameters layer</h2>
                        <p className="text-[9.5px] opacity-40 tracking-[0.45em] mt-3 italic leading-none font-bold uppercase font-black">Administrator Access Layer v4.1 operational</p>
                    </div>
                    <button onClick={downloadSystemReport} className="bg-white text-cnDarkGreen p-4 border border-slate-200 rounded-3xl shadow-xl flex items-center gap-4 active:scale-95 transition-all font-black uppercase italic text-[9.5px]"><Printer size={18} className="animate-bounce" /> Audit PDF Report</button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 italic uppercase font-black italic font-black">
                   <section className="bg-white p-12 rounded-[50px] border border-slate-100 shadow-xl space-y-10 relative overflow-hidden italic font-black uppercase">
                      <h4 className="text-[12px] uppercase text-[#000000] tracking-widest underline decoration-cnLightGreen decoration-2 italic font-black italic font-black italic font-black">operational cycle modifiers logic</h4>
                      <div className="space-y-10 font-black uppercase italic">
                          <div className="space-y-4"><label className="text-[10.5px] opacity-50 block italic tracking-widest font-black uppercase">Node Timeout window (SPAN_DAYS)</label> <input type="number" value={gracePeriod} onChange={e=>setGracePeriod(e.target.value)} className="w-full bg-slate-50 p-6 rounded-[35px] text-2xl outline-none italic uppercase font-black"/></div>
                          <div className="space-y-4 pt-4"><label className="text-[10.5px] opacity-50 block italic tracking-widest font-black uppercase">USD/PKR EXCHANGE LOGIC UNIT</label> <div className="bg-slate-50 flex items-center p-6 rounded-[38px]"><p className="text-xs opacity-30 mr-6 font-black uppercase italic font-black">INDEX_RATE</p><input type="number" value={marketRate} onChange={e=>setMarketRate(e.target.value)} className="flex-1 bg-transparent text-2xl outline-none font-black italic uppercase font-black"/></div></div>
                      </div>
                      <button className="w-full bg-cnLightGreen py-6 rounded-3xl font-black italic text-lg shadow-cnLightGreen/20 shadow-xl border-b-8 border-cnDarkGreen">Authorize modification</button>
                   </section>
                   <div className="space-y-8 font-black uppercase italic italic font-black italic font-black uppercase">
                      <div className="bg-white rounded-[50px] p-10 border border-slate-100 shadow-xl space-y-6">
                           <h4 className="text-[10px] uppercase underline decoration-indigo-200 font-black italic">Local Currency disburasal calculator engine</h4>
                           <div className="bg-slate-50 p-8 rounded-[40px] font-black italic uppercase italic font-black italic font-black"><p className="text-[9px] opacity-40 mb-3 italic uppercase font-black font-black uppercase italic font-black italic">USD_IDENTIFIER</p><input type="number" onChange={e=>setCalcUsd(e.target.value)} value={calcUsd} className="bg-white border p-6 rounded-3xl w-full text-3xl font-black mb-6 italic outline-none uppercase font-black font-black font-black font-black italic font-black font-black"/><div className="h-px bg-slate-200 mb-6"></div><div className="bg-cnDarkGreen text-cnLightGreen p-10 rounded-[35px] text-center font-black italic"><p className="text-[9.5px] opacity-40 mb-4 italic uppercase">YIELD OUTPUT PAKISTANI_PKR</p><p className="text-3xl font-black">{(calcUsd * marketRate).toLocaleString()}.00 PKR</p></div></div>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'projects' && (
             <div className="animate-in space-y-10 normal-case not-italic">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 normal-case not-italic mb-2">Projects</h2>
                    <h3 className="text-lg font-bold text-slate-800">Portfolio</h3>
                    <p className="text-slate-500 font-medium text-sm">Overview of all active and completed engineering initiatives</p>
                  </div>
                  <div className="flex items-center gap-4">
                     <button className="flex items-center gap-2 bg-white border px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50"><Filter size={18}/> Filter</button>
                     <button onClick={()=>setIsProjectModalOpen(true)} className="flex items-center gap-2 bg-[#4c44f2] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-[#4c44f2]/30 transition-transform active:scale-95"><Plus size={20}/> New Project</button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {filteredProjects.map(proj => (
                      <div key={proj.id} onClick={()=>{setSelectedProject(proj); setIsDetailModalOpen(true)}} className="bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group shadow-sm">
                          <div className="flex justify-between items-start mb-6">
                            <span className="bg-indigo-50 text-[#4c44f2] text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider">In Progress</span>
                            <div className="size-2 bg-slate-200 rounded-full group-hover:bg-indigo-400 transition-colors"></div>
                          </div>
                          <h4 className="text-xl font-bold text-slate-900 mb-1 leading-tight">{proj.project_name}</h4>
                          <p className="text-slate-500 text-sm mb-6 leading-relaxed opacity-80">{proj.client_name} Logic Core Interface System.</p>
                          
                          <div className="flex items-center gap-6 text-slate-400 text-[11px] font-bold mb-8 italic uppercase tracking-wider">
                            <span className="flex items-center gap-2"><User size={14}/> {employees.find(e=>e.id === proj.assigned_to)?.full_name || 'System Admin'}</span>
                            <span className="flex items-center gap-2"><Calendar size={14}/> {new Date(proj.last_report_date).toLocaleDateString()}</span>
                          </div>

                          <div className="space-y-2 mb-8">
                             <div className="flex justify-between text-[10px] font-black tracking-widest text-slate-400 uppercase"><span>Execution Progress</span><span className="text-slate-900">78%</span></div>
                             <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="bg-[#4c44f2] h-full rounded-full" style={{width: '78%'}}></div>
                             </div>
                          </div>

                          <div className="flex justify-between items-center pt-5 border-t border-slate-50">
                             <div className="flex -space-x-2">
                                {[...Array(3)].map((_, i) => <div key={i} className="size-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden"><img src={`https://i.pravatar.cc/150?u=${proj.id+i}`}/></div>)}
                             </div>
                             <div className="text-[10px] font-bold text-slate-400 italic flex items-center gap-2 tracking-wider"><Clock size={12}/> 2 hours ago</div>
                          </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

        </div>
      </main>

      {/* WORKFLOW EDIT MODAL */}
      {isTaskModalOpen && (
          <div className="fixed inset-0 bg-[#0d1629]/95 backdrop-blur-3xl z-[3000] flex items-center justify-center p-4">
               <div className="bg-[#fcfdfe] w-full max-w-lg rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in duration-300 border-4 border-white/5 font-sans normal-case not-italic">
                   <div className="bg-[#12122b] p-8 text-white flex justify-between items-center">
                       <div className="flex items-center gap-4">
                           <div className="p-3.5 bg-[#4c44f2] rounded-2xl border border-white/20 shadow-2xl shadow-indigo-600/30">
                              <Briefcase size={26}/>
                           </div>
                           <div>
                               <h3 className="text-xl font-black mb-0.5">Edit Record</h3>
                               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest opacity-60 italic">Operational ID: {selectedTask?.id || '0XD46498'}</p>
                           </div>
                       </div>
                       <X onClick={()=>setIsTaskModalOpen(false)} size={32} className="cursor-pointer text-white/30 hover:text-white transition-all"/>
                   </div>

                   <div className="p-10 space-y-10">
                       <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-3">Objective Specification</label>
                           <div className="bg-white border-2 border-slate-50 p-6 rounded-[35px] shadow-inner text-center italic min-h-[140px] flex items-center justify-center">
                               <p className="text-2xl font-black text-slate-800 leading-tight">
                                   {selectedTask?.title || "Fix memory leak in websocket"}
                               </p>
                           </div>
                       </div>

                       <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-2">Personnel Assignment</label>
                                <div className="bg-white border-2 border-slate-50 p-5 rounded-2xl flex justify-between items-center">
                                    <span className="text-[12px] font-black text-slate-700 italic truncate">{selectedTask?.assigned_to || "Elena Rodriguez (Backend)"}</span>
                                    <User size={14} className="text-slate-300"/>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-2">Lifecycle</label>
                                <div className="bg-white border-2 border-slate-50 p-5 rounded-2xl flex justify-between items-center">
                                    <span className="text-[12px] font-black text-slate-700 italic uppercase">{selectedTask?.status || "Backlog"}</span>
                                    <History size={14} className="text-slate-300"/>
                                </div>
                            </div>
                       </div>

                       <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-2">SLA Priority</label>
                           <div className="bg-slate-100/50 p-1.5 rounded-[24px] flex items-center">
                               <button className="flex-1 py-4 font-black text-[11px] text-slate-400">P2</button>
                               <button className="flex-1 py-4 font-black text-[11px] text-slate-400">P1</button>
                               <button className="flex-1 py-4 bg-red-500 rounded-2xl font-black text-[11px] text-white shadow-xl shadow-red-500/20 active:scale-95 transition-all">P0</button>
                           </div>
                       </div>

                       <div className="flex gap-4 pt-4 border-t border-slate-50">
                            <button className="flex-1 bg-[#4c44f2] text-white py-6 rounded-3xl font-black italic uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-indigo-600/30">
                               <FileCheck size={18}/> Synchronize Record
                            </button>
                            <button className="bg-white border-2 border-slate-100 p-6 rounded-3xl text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all">
                               <Trash2 size={24}/>
                            </button>
                       </div>

                       <p className="text-[8px] font-black text-center text-slate-400 opacity-50 uppercase tracking-[0.4em] italic pt-4">Secure Transaction Layer • CodeNest Workflow</p>
                   </div>
               </div>
          </div>
      )}

      {/* TEAM CONFIGURATION / MANAGEMENT MODAL */}
      {isEmpConfigOpen && selectedEmployee && (
         <div className="fixed inset-0 bg-[#0d1629]/95 backdrop-blur-3xl z-[1000] flex items-center justify-center p-4">
             <div className="bg-[#FBFCFE] w-full max-w-[480px] rounded-[38px] overflow-hidden shadow-[0_0_120px_-20px_rgba(0,0,0,0.8)] border-4 border-white/5 animate-in zoom-in duration-300 normal-case not-italic">
                 <div className="bg-gradient-to-r from-[#1E1B4B] via-[#2D167D] to-[#3B2C8D] p-10 text-white relative">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="bg-[#5A4AF2]/30 p-3.5 rounded-2xl shadow-xl shadow-black/10 backdrop-blur-md border border-white/20">
                                <UserCheck className="text-white" size={26} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight leading-none mb-1">User Configuration</h3>
                                <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em]">Node: Engineering Cluster 07</p>
                            </div>
                        </div>
                        <button onClick={() => setIsEmpConfigOpen(false)} className="hover:rotate-90 transition-all text-white/40 hover:text-white"><X size={28}/></button>
                    </div>
                 </div>

                 <div className="px-10 pb-12 -mt-10 relative">
                     <div className="flex justify-center mb-8 relative">
                         <div className="relative group">
                            <div className="size-32 bg-slate-100 rounded-[40px] border-8 border-[#FBFCFE] shadow-2xl overflow-hidden group-hover:brightness-75 transition-all">
                               <img src={`https://i.pravatar.cc/150?u=${selectedEmployee.id}`} className="size-full object-cover" />
                            </div>
                            <button className="absolute bottom-0 right-0 bg-[#121926] text-white p-2.5 rounded-xl border-4 border-[#FBFCFE] shadow-lg group-hover:scale-110 transition-transform">
                                <ImageIcon size={18}/>
                            </button>
                         </div>
                     </div>

                     <form className="space-y-6">
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-[#5244F2] uppercase tracking-[0.1em] pl-4 flex items-center gap-2">
                                <span className="size-4 border-2 border-indigo-200 rounded-full flex items-center justify-center text-[8px] font-bold">i</span> USER FULL NAME
                            </label>
                            <input disabled value={selectedEmployee.full_name} className="w-full bg-white border-2 border-slate-100/50 shadow-inner px-8 py-5 rounded-2xl text-lg font-black text-slate-800 placeholder:text-slate-200 outline-none" />
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-[#5244F2] uppercase tracking-[0.1em] pl-4 flex items-center gap-2">
                                <span className="size-4 border-2 border-indigo-200 rounded-full flex items-center justify-center"></span> ORGANIZATIONAL ROLE
                            </label>
                            <input value={selectedEmployee.role} className="w-full bg-white border-2 border-slate-100/50 shadow-inner px-8 py-5 rounded-2xl text-lg font-black text-slate-800 outline-none focus:border-indigo-400" />
                        </div>

                        <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Operational Status</label>
                             <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl">
                                 <button type="button" className={`py-3 rounded-xl font-black text-[9px] uppercase transition-all ${selectedEmployee.is_approved ? 'bg-white text-slate-900 shadow-md scale-[1.02]' : 'text-slate-400'}`}>Online</button>
                                 <button type="button" className={`py-3 rounded-xl font-black text-[9px] uppercase ${!selectedEmployee.is_approved ? 'bg-white text-slate-900 shadow-md scale-[1.02]' : 'text-slate-400'}`}>Busy</button>
                                 <button type="button" className="py-3 rounded-xl font-black text-[9px] uppercase text-slate-400">Offline</button>
                             </div>
                        </div>

                        <div className="flex gap-4 pt-10 border-t-2 border-slate-100/50 mt-10">
                            <button className="flex-1 bg-[#5244F2] text-white py-5 rounded-[22px] font-black text-xs uppercase shadow-2xl shadow-indigo-600/40 flex items-center justify-center gap-2 active:scale-95 transition-all">
                               <HardDriveDownload size={18}/> Update Credentials
                            </button>
                            <button onClick={()=>deleteEmployee(selectedEmployee.id)} type="button" className="bg-red-50 text-red-600 border border-red-100 px-8 py-5 rounded-[22px] font-black text-xs uppercase flex items-center justify-center gap-2 active:scale-95 hover:bg-red-600 hover:text-white transition-all">
                                <Trash2 size={18}/> Offboard
                            </button>
                        </div>
                     </form>
                 </div>
             </div>
         </div>
      )}

      {/* USER REGISTRATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0d1629]/90 backdrop-blur-2xl z-[1001] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-[38px] overflow-hidden border-2 border-indigo-100 shadow-2xl normal-case not-italic">
              <div className="bg-[#121926] p-8 text-white flex justify-between items-center font-black">
                <div className="flex items-center gap-3">
                    <UserPlus size={20} className="text-[#4c44f2]"/>
                    <h4 className="text-base uppercase tracking-widest italic font-black italic">Enrollment Layer</h4>
                </div>
                <X onClick={()=>setIsModalOpen(false)} size={24} className="text-white/40 cursor-pointer hover:rotate-90 transition-all"/>
              </div>
              <form onSubmit={handleAddEmployee} className="p-10 space-y-6"> 
                  <div className="space-y-4">
                      <input required placeholder="User Full Name" className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl outline-none font-bold placeholder:text-slate-300" onChange={e=>setNewEmp({...newEmp, full_name: e.target.value})}/>
                      <input required placeholder="Assign Technical Role" className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl outline-none font-bold placeholder:text-slate-300" onChange={e=>setNewEmp({...newEmp, role: e.target.value})}/>
                  </div>
                  <button className="w-full bg-[#121926] text-white py-6 rounded-[28px] font-black tracking-widest shadow-xl shadow-indigo-600/10 hover:shadow-2xl transition-all border-b-8 border-[#4c44f2] flex items-center justify-center gap-3">
                    {isSubmitting ? 'PROCESSING...' : 'INITIALIZE ACCESS'}
                  </button>
              </form>
           </div>
        </div>
      )}

      {/* CREATE NEW PROJECT MODAL */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl normal-case not-italic">
             <div className="p-8 space-y-6">
                <h4 className="text-2xl font-bold mb-2">Deploy New Core</h4>
                <form onSubmit={handleCreateProject} className="space-y-4">
                   <input required value={newProj.name} onChange={e=>setNewProj({...newProj, name: e.target.value})} placeholder="Project Name" className="w-full bg-slate-50 border p-4 rounded-xl"/>
                   <input required value={newProj.client} onChange={e=>setNewProj({...newProj, client: e.target.value})} placeholder="Client Name" className="w-full bg-slate-50 border p-4 rounded-xl"/>
                   <input required value={newProj.url} onChange={e=>setNewProj({...newProj, url: e.target.value})} placeholder="Platform URL" className="w-full bg-slate-50 border p-4 rounded-xl"/>
                   <select value={newProj.staff_id} onChange={e=>setNewProj({...newProj, staff_id: e.target.value})} className="w-full bg-slate-50 border p-4 rounded-xl">
                      <option value="">Assign Engineer...</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                   </select>
                   <div className="flex gap-4 pt-4">
                     <button type="button" onClick={()=>setIsProjectModalOpen(false)} className="flex-1 border p-4 rounded-xl font-bold">Cancel</button>
                     <button type="submit" className="flex-1 bg-black text-white p-4 rounded-xl font-bold">{isSubmitting ? 'Deploying...' : 'Start Node'}</button>
                   </div>
                </form>
             </div>
           </div>
        </div>
      )}

    </div>
  );
}

// SHARED COMPONENTS UPDATED
function NavButton({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.18em] transition-all relative
    ${active ? 'bg-[#0c3740] text-white shadow-2xl shadow-black/30 scale-[1.03] translate-x-2' : 'text-white/70 hover:bg-white/10 hover:text-white italic opacity-90'}`}>
      <span className={active ? 'bg-white/10 p-1.5 rounded-xl border border-white/10' : 'opacity-40'}>{icon}</span> {label}
      {active && <div className="absolute right-4 size-1.5 bg-cnLightGreen rounded-full animate-pulse shadow-[0_0_10px_white]"></div>}
    </button>
  );
}

function ModernCard({ label, value, icon, color, onClick }) {
  return (
    <div onClick={onClick} className="bg-white p-8 rounded-[32px] border shadow-sm hover:shadow-2xl transition-all cursor-pointer group hover:-translate-y-2 relative duration-300">
       <div className="flex justify-between w-full mb-6">
         <div className={`p-4 ${color} rounded-[22px] transition-all group-hover:scale-110 duration-500`}>{icon}</div>
         <p className="text-[8px] text-slate-300 font-black italic tracking-widest group-hover:text-black uppercase">VIEW DETAIL</p>
       </div>
       <h4 className="text-4xl text-black font-black italic uppercase leading-none">{value}</h4>
       <p className="text-[10px] text-slate-400 font-black mt-2 italic uppercase">{label}</p>
    </div>
  );
}

function WideCard({ label, value, sub, icon, color, onClick }) {
    return (
      <div onClick={onClick} className={`${color} p-8 rounded-[35px] shadow-xl flex items-center justify-between group overflow-hidden active:scale-95 transition-all cursor-pointer`}>
         <div className="relative z-10 font-black uppercase italic">
            <p className="text-[8.5px] opacity-40 mb-2 uppercase tracking-[0.2em]">{label}</p>
            <h4 className="text-2xl font-black uppercase tracking-tighter italic">{value}</h4>
            <p className="text-[9px] opacity-20 uppercase tracking-[0.4em] font-mono mt-2 italic">{sub}</p>
         </div>
         <div className="bg-white/10 p-5 rounded-full transition-all group-hover:rotate-12">{icon}</div>
      </div>
    );
}

function DetailField({ label, value, icon }) {
    return (
        <div className="space-y-3">
            <label className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{icon} {label}</label>
            <div className="w-full bg-white border-2 border-slate-50 px-6 py-4.5 rounded-[22px] shadow-sm font-bold text-slate-800 text-[15px]">{value}</div>
        </div>
    )
}

function UserPlus({ size, className }) {
    return (
        <div className={`relative ${className}`}>
            <User size={size} />
            <Plus size={size / 2} className="absolute -top-1 -right-1" />
        </div>
    )
}