import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  LogOut, Briefcase, DollarSign, Globe, CheckCircle2, 
  Clock, ShieldCheck, Lock, User, RefreshCcw, AlertTriangle,
  ClipboardList, PlayCircle, CheckCircle, Zap
} from 'lucide-react';

export default function EmployeeDashboard() {
  const [profile, setProfile] = useState(null);
  const [myProjects, setMyProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]); // Brain for the "Task Terminal" missions
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [updatingTask, setUpdatingTask] = useState(null);

  useEffect(() => {
    fetchMyData();

    // REAL-TIME HANDSHAKE: Listen for new tasks from Rabnawaz
    const channel = supabase
      .channel('employee-node-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchMyData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchMyData() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Authentication failed");

      // 1. Profile Verification
      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profError) throw new Error("Profile not found in system.");
      
      // SECURITY GATE: Redirect unapproved users even if they land here
      if (!prof.is_approved) {
        window.location.reload(); 
        return;
      }
      setProfile(prof);

      // 2. Fetch Assigned Projects (Static Matrix)
      const { data: projs } = await supabase.from('projects').select('*').eq('assigned_to', user.id);
      setMyProjects(projs || []);

      // 3. Fetch Personal Missions (Direct tasks from Rabnawaz)
      const { data: tks } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });
      setMyTasks(tks || []);

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Update mission status (Feed the Admin Resolution Ledger)
  const updateMissionStatus = async (taskId, newStatus) => {
    setUpdatingTask(taskId);
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);
    
    if (error) alert("Logic Error: Mission update failed.");
    else fetchMyData();
    setUpdatingTask(null);
  };

  const handleLogout = () => supabase.auth.signOut().then(() => window.location.reload());

  if (loading) return (
    <div className="min-h-screen bg-cnDarkGreen flex flex-col items-center justify-center p-10">
        <RefreshCcw size={40} className="text-cnLightGreen animate-spin mb-4" />
        <div className="text-white text-[12px] font-black uppercase tracking-[0.5em] animate-pulse">Establishing Node Sync...</div>
    </div>
  );

  if (errorMsg) return (
    <div className="min-h-screen bg-[#FDFDFF] flex flex-col items-center justify-center p-10 text-center">
        <AlertTriangle size={60} className="text-red-500 mb-6" />
        <h2 className="text-2xl font-black text-cnDarkGreen uppercase italic mb-2 tracking-tighter">Terminal Error</h2>
        <p className="text-cnGrey text-sm mb-8 font-bold italic">{errorMsg}</p>
        <button onClick={handleLogout} className="bg-cnDarkGreen text-white px-10 py-5 rounded-3xl font-black uppercase text-xs tracking-widest">Return to Base</button>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#FDFDFF] font-sans overflow-hidden">
      
      {/* SIDEBAR (DESIGN MAINTAINED) */}
      <aside className="w-64 bg-cnDarkGreen text-white flex flex-col shadow-2xl z-50 shrink-0 border-r border-white/5">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3">
             <div className="p-1.5 bg-cnLightGreen rounded-lg shadow-lg"><Globe size={18} className="text-cnDarkGreen"/></div>
             <h1 className="text-lg font-black italic uppercase tracking-tighter">Code Nest</h1>
          </div>
          <p className="text-[9px] font-black text-cnLightGreen mt-2 tracking-[0.3em] opacity-40 uppercase">Emp Node // V.2</p>
        </div>
        
        <nav className="flex-1 px-4 mt-8 space-y-4">
          <div className="p-4 bg-cnLightGreen/10 border border-cnLightGreen/20 rounded-2xl flex items-center gap-4 text-cnLightGreen shadow-xl shadow-cnLightGreen/5 italic">
             <Zap size={18}/> 
             <span className="text-[11px] font-black uppercase tracking-widest leading-none">Operational Deck</span>
          </div>
        </nav>

        <div className="p-6">
           <button onClick={() => setIsPassModalOpen(true)} className="flex items-center gap-4 w-full p-4 hover:bg-white/5 text-white/40 hover:text-white transition-all rounded-2xl mb-2 italic border border-white/5 group">
             <Lock size={14} className="group-hover:text-cnLightGreen" /> 
             <span className="text-[9px] font-black uppercase tracking-widest">Update Cipher</span>
           </button>
           <button onClick={handleLogout} className="flex items-center gap-4 w-full p-4 bg-red-500/10 text-red-400 border border-red-500/5 rounded-2xl hover:bg-red-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-[0.2em] italic">
            <LogOut size={16}/> <span>Close Connection</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#f9fbfc] relative custom-scrollbar">
        <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex justify-between items-center px-12 sticky top-0 z-30 shadow-sm">
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-cnDarkGreen leading-none">Deployment Center</h2>
            <div className="flex items-center gap-4 mt-3">
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] italic leading-none">Status: Authorization Granted</p>
               <span className="h-1 w-1 bg-cnLightGreen rounded-full animate-ping"></span>
            </div>
          </div>
          <div className="flex items-center gap-5">
             <div className="text-right leading-none">
                <p className="text-[12px] font-black text-cnDarkGreen uppercase">{profile?.full_name}</p>
                <p className="text-[8px] font-black text-cnLightGreen uppercase mt-1 italic tracking-widest bg-cnDarkGreen/10 px-2 py-0.5 rounded-full">{profile?.role}</p>
             </div>
             <div className="w-12 h-12 bg-cnDarkGreen text-cnLightGreen border-2 border-white rounded-[18px] shadow-2xl shadow-cnDarkGreen/20 flex items-center justify-center font-black text-2xl italic">{profile?.full_name?.charAt(0)}</div>
          </div>
        </header>

        <div className="p-10 max-w-6xl mx-auto space-y-8 pb-32">
          {/* TOP METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatBox label="Assigned Projects" value={myProjects.length} color="text-cnDarkGreen" icon={<Briefcase size={20}/>}/>
            <StatBox label="Active Missions" value={myTasks.filter(t => t.status !== 'Done').length} color="text-indigo-600" icon={<ClipboardList size={20}/>}/>
            <StatBox label="Security Access" value="Approved" color="text-cnLightGreen" icon={<ShieldCheck size={20}/>}/>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* MISSIONS SECTION (TASK TERMINAL FROM RABNAWAZ) */}
            <section className="bg-white rounded-[45px] border border-slate-100 p-8 shadow-sm">
               <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-6">
                 <div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-indigo-600 italic">Mission Terminals</h3>
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-tighter mt-1 opacity-60">Tasks assigned by HQ</p>
                 </div>
                 <div className="size-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center animate-bounce"><Zap size={14} /></div>
               </div>

               <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {myTasks.map((task) => (
                    <div key={task.id} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-50 group hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/30 transition-all duration-300">
                       <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1 font-mono italic">TaskID: {task.id.slice(0,8)}</p>
                            <h4 className={`text-sm font-black italic uppercase tracking-tighter ${task.status === 'Done' ? 'text-slate-400 line-through decoration-cnLightGreen/50 decoration-2' : 'text-slate-800'}`}>{task.title}</h4>
                            <div className={`text-[8px] font-black px-2 py-0.5 rounded-full inline-block mt-3 tracking-widest ${task.status === 'Todo' ? 'bg-amber-100 text-amber-600' : task.status === 'Progress' ? 'bg-indigo-100 text-indigo-600' : 'bg-cnLightGreen/20 text-cnLightGreen'}`}>{task.status.toUpperCase()}</div>
                          </div>
                          
                          {task.status !== 'Done' && (
                             <div className="flex gap-2">
                               {task.status === 'Todo' ? (
                                  <button onClick={() => updateMissionStatus(task.id, 'Progress')} className="p-3 bg-white text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                    <PlayCircle size={16} />
                                  </button>
                               ) : (
                                  <button onClick={() => updateMissionStatus(task.id, 'Done')} className="p-3 bg-white text-cnLightGreen rounded-xl hover:bg-cnLightGreen hover:text-cnDarkGreen transition-all shadow-sm">
                                    <CheckCircle size={16} />
                                  </button>
                               )}
                             </div>
                          )}
                       </div>
                    </div>
                  ))}
                  {myTasks.length === 0 && (
                     <div className="py-20 text-center text-slate-200 uppercase font-black italic text-[10px] tracking-[0.3em] opacity-40">Static Airwaves // No Directives</div>
                  )}
               </div>
            </section>

            {/* PROJECTS SECTION (UNCHANGED IN FUNCTION) */}
            <section className="bg-white rounded-[45px] border border-slate-100 p-8 shadow-sm h-fit">
              <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-6">
                 <div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-cnDarkGreen italic">Operation Folders</h3>
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-tighter mt-1 opacity-60">Legacy client matrix</p>
                 </div>
                 <span className="text-[9px] font-bold text-slate-400 px-3 py-1 bg-slate-50 rounded-full">{myProjects.length} Active</span>
               </div>
               
               <div className="space-y-4">
                  {myProjects.map(proj => (
                    <div key={proj.id} className="p-5 border-b border-slate-50 last:border-none flex items-center justify-between hover:bg-slate-50 transition-all rounded-2xl group">
                       <p className="text-xs font-black uppercase italic text-cnDarkGreen tracking-tighter group-hover:translate-x-1 transition-transform">{proj.project_name}</p>
                       <Clock size={14} className="text-slate-200 group-hover:text-cnLightGreen"/>
                    </div>
                  ))}
               </div>
            </section>
          </div>
        </div>
      </main>

      {/* SECURITY MODAL (PASSWORD BRAIN) */}
      {isPassModalOpen && (
           <div className="fixed inset-0 bg-cnDarkGreen/80 backdrop-blur-xl z-[999] flex items-center justify-center p-6 animate-in">
              <div className="bg-white w-full max-w-sm rounded-[60px] overflow-hidden p-12 border-4 border-white shadow-2xl">
                 <h4 className="text-2xl font-black italic uppercase tracking-tighter text-cnDarkGreen mb-4 underline decoration-cnLightGreen decoration-8 underline-offset-4">Reset Key</h4>
                 <p className="text-[9px] font-bold text-slate-400 uppercase mb-8 tracking-widest opacity-60">Update Alpha Private Key Credentials</p>
                 <form onSubmit={async (e) => {
                    e.preventDefault();
                    if(newPass.length < 6) return alert("Key must be 6+ chars.");
                    const { error } = await supabase.auth.updateUser({ password: newPass });
                    if (error) alert(error.message);
                    else { alert("Mission Success: Root Cipher Synchronized."); setIsPassModalOpen(false); }
                 }} className="space-y-6">
                    <div className="relative">
                      <Lock size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input type="password" required className="w-full bg-slate-100 border-none py-6 pl-14 pr-6 rounded-[28px] text-cnDarkGreen font-black italic tracking-widest outline-none shadow-inner" placeholder="NEW KEY 0000" onChange={e => setNewPass(e.target.value)}/>
                    </div>
                    <button className="w-full bg-cnDarkGreen text-cnWhite py-8 rounded-[40px] font-black uppercase text-[12px] italic tracking-widest shadow-2xl shadow-cnDarkGreen/40 hover:bg-cnLightGreen transition-all active:scale-95 border-t-[8px] border-cnLightGreen/20">Apply Logic Protocol</button>
                    <button type="button" onClick={() => setIsPassModalOpen(false)} className="w-full text-[9px] font-black uppercase tracking-[0.4em] text-slate-200 mt-2">Abort Override</button>
                 </form>
              </div>
           </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </div>
  );
}

function StatBox({label, value, color, icon}) {
  return (
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 group hover:-translate-y-1 transition-all flex items-center gap-6 shadow-[0_15px_60px_rgba(0,0,0,0.01)]">
       <div className={`p-4 bg-slate-50 rounded-[18px] group-hover:bg-cnDarkGreen group-hover:text-cnLightGreen transition-all ${color}`}>{icon}</div>
       <div>
         <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 italic font-mono">{label}</p>
         <h4 className={`text-2xl font-black italic tracking-tighter text-cnDarkGreen leading-none uppercase`}>{value}</h4>
       </div>
    </div>
  );
}