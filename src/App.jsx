import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from "./supabaseClient";
import { ShieldCheck, LogOut, Cpu } from 'lucide-react';

// IMPORTING MODULAR PAGES
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/admin/index'; 

function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // CORE ROLE FETCH PROTOCOL: THE HQ HANDSHAKE
  const fetchRole = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, is_approved')
        .eq('id', userId)
        .single();

      if (error || !data) {
        // Fallback for missing profile row: Personnel Hub Registry Entry Required
        setRole('employee'); 
      } else {
        const dbRole = data?.role?.toLowerCase() || 'employee';
        
        /* 
           THE GATEKEEPER LOGIC:
           1. Admins skip approval (Root Auth).
           2. Employees/PMs must have is_approved: true to pass.
        */
        if (dbRole !== 'admin' && data?.is_approved === false) {
           setRole('pending'); 
        } else {
           setRole(dbRole);
        }
      }
    } catch (err) {
      console.error("GATEKEEPER_CRITICAL_FAIL:", err);
      setRole('employee');
    } finally {
      // Small delay for psychological high-tech initialization
      setTimeout(() => setLoading(false), 1200);
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

    return () => {
      subscription.unsubscribe();
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

  // SYNC LOADING SCREEN (0.8 DENSITY PROTOCOL)
  if (loading) return (
    <div className="min-h-screen bg-[#0c3740] flex flex-col items-center justify-center font-black italic uppercase overflow-hidden">
       <div className="flex flex-col items-center gap-8 animate-in fade-in duration-1000">
          <div className="relative">
             <Cpu size={80} className="text-[#2b945f] animate-pulse" />
             <div className="absolute inset-0 border-t-4 border-[#2b945f] rounded-full animate-spin"></div>
          </div>
          <div className="text-white text-3xl tracking-[0.5em]">
            Code Nest <span className="text-[#2b945f]">Syncing...</span>
          </div>
       </div>
       <p className="mt-16 text-[10px] text-white/20 tracking-[0.8em]">
          Initializing Node-Linkage • Terminal 1.04 • Root Active
       </p>
    </div>
  );

  // 1. LOGIN GATE
  if (!session) return <Login />;

  // 2. THE HANDSHAKE SCREEN (RESTRICTED ACCESS)
  if (role === 'pending') return (
    <div className="min-h-screen bg-[#0c3740] flex flex-col items-center justify-center p-6 text-center font-black italic uppercase">
       <div className="bg-white w-full max-w-[420px] rounded-[40px] p-16 shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-b-[12px] border-[#2b945f] transition-transform hover:scale-105" style={{ zoom: '0.8' }}>
          <div className="size-24 bg-red-600/10 text-red-600 rounded-[30px] flex items-center justify-center mx-auto mb-10 border-4 border-slate-50">
             <ShieldCheck size={48} className="animate-bounce" />
          </div>
          <h2 className="text-4xl text-[#0c3740] mb-8 leading-tight tracking-tighter">Identity Pending</h2>
          <p className="text-[12px] text-slate-400 tracking-[0.2em] leading-loose mb-12">
            Entrance is gated by Root Administrator. Sir Rabnawaz has received your signal. Access granted upon Hub clearance.
          </p>
          <button 
            onClick={terminateSession} 
            className="w-full py-6 bg-red-600 text-white rounded-[20px] text-[12px] tracking-[0.3em] shadow-xl hover:brightness-110 active:translate-y-2 transition-all flex items-center justify-center gap-4"
          >
            <LogOut size={18}/> Kill Session
          </button>
       </div>
    </div>
  );

  // 3. CORE NAVIGATION (ROUTING LAYER)
  return (
    <>
      {role === 'admin' ? (
        <AdminDashboard /> 
      ) : (
        <EmployeeDashboard session={session} terminateSession={terminateSession} />
      )}
    </>
  );
}

export default App;