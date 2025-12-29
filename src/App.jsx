import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { ShieldCheck, LogOut, Loader2 } from 'lucide-react';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';

function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // CORE ROLE FETCH PROTOCOL
  const fetchRole = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, is_approved')
        .eq('id', userId)
        .single();

      if (error) {
        // Fallback for missing profile row
        setRole('employee'); 
      } else {
        const dbRole = data?.role?.toLowerCase();
        // SIR RABNAWAZ AUTHORIZATION GATE
        if (dbRole !== 'admin' && data?.is_approved === false) {
           setRole('pending'); 
        } else {
           setRole(dbRole);
        }
      }
    } catch (err) {
      setRole('employee');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. SESSION INITIALIZATION
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. REAL-TIME AUTH STATE LISTENER
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchRole(session.user.id);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    // 3. FORCE-TIMEOUT SAFETY (Stops Infinite Sync screen after 3 seconds)
    const safetyHalt = setTimeout(() => {
      if (loading) setLoading(false);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyHalt);
    };
  }, [fetchRole]);

  // TERMINAL LOGOUT LOGIC
  const terminateSession = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setRole(null);
    setSession(null);
    setLoading(false);
  };

  // SYNC LOADING SCREEN (BOLD-ITALIC-UPPERCASE PROTOCOL)
  if (loading) return (
    <div className="min-h-screen bg-[#0c3740] flex flex-col items-center justify-center font-sans overflow-hidden">
       <div className="flex flex-col items-center gap-6">
          <div className="size-16 border-t-4 border-l-4 border-[#2b945f] rounded-full animate-spin"></div>
          <div className="text-white text-xl font-black uppercase tracking-[0.4em] italic animate-pulse">Code Nest Synchronizing...</div>
       </div>
       <p className="mt-10 text-[8px] text-white/20 font-black italic tracking-widest uppercase">Encryption standard Tier-4 Handshake in Progress</p>
    </div>
  );

  // AUTHENTICATION GATE
  if (!session) return <Login />;

  // PENDING AUTHORIZATION HUB
  if (role === 'pending') return (
    <div className="min-h-screen bg-[#0c3740] flex flex-col items-center justify-center p-6 text-center font-sans selection:bg-[#2b945f] selection:text-white">
       <div className="bg-white w-full max-w-[340px] rounded-[45px] p-10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] border-4 border-white/5 animate-in zoom-in duration-500" style={{ zoom: '0.8' }}>
          <div className="size-20 bg-[#2b945f]/10 text-[#2b945f] rounded-[24px] flex items-center justify-center mx-auto mb-8 border border-[#2b945f]/20 animate-bounce">
             <ShieldCheck size={40} />
          </div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-[#0c3740] mb-4 leading-tight">Access Restricted</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-relaxed italic mb-10">
            Node Identity Detected. Sir Rabnawaz has been notified of your presence. Terminal will activate automatically upon personnel ID Authorization.
          </p>
          <button 
            onClick={terminateSession} 
            className="w-full py-5 bg-[#0c3740] text-white rounded-[22px] font-black uppercase text-[10px] tracking-[0.2em] italic shadow-xl shadow-[#0c3740]/30 hover:bg-[#2b945f] transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <LogOut size={16}/> Terminate Link
          </button>
       </div>
       <p className="mt-8 text-[8px] font-black text-white/20 uppercase tracking-[0.4em] italic">Code Nest Remote Security Terminal</p>
    </div>
  );

  // CORE NAVIGATION ROUTING
  return (
    <>
      {role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />}
    </>
  );
}

export default App;