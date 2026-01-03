import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Mail, Lock, User, Loader2, Sparkles, 
  ShieldAlert, Fingerprint, Command,
  AlertCircle, ChevronRight, Globe
} from 'lucide-react';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  
  // Input Matrix
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // SESSION SECURITY CHECK (Triggered on mount and after Auth changes)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        checkUserRegistry(session.user);
      }
    });

    checkInitialStatus();
    
    return () => subscription.unsubscribe();
  }, []);

  const checkInitialStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) checkUserRegistry(session.user);
  };

  const checkUserRegistry = async (user) => {
    // 1. Check if profile exists
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // 2. If it's a new Google user with no profile, create a pending one
    if (!profile && !error) {
      const { data: newProfile } = await supabase.from('profiles').insert([
        { 
          id: user.id, 
          full_name: user.user_metadata.full_name || 'NEW GOOGLE USER', 
          email: user.email,
          role: 'Employee', 
          is_approved: false,
          is_active: true
        }
      ]).select().single();
      profile = newProfile;
    }

    // 3. ENFORCEMENT: If not approved, show the popup and keep them locked
    if (profile && !profile.is_approved) {
      setIsPendingApproval(true);
    } else if (profile && profile.is_approved) {
        setIsPendingApproval(false);
        // Page will naturally redirect to Dashboard if your App.jsx routes are set up correctly
    }
  };

  // ALPHA AUTH FLOW
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignup) {
        if (password !== confirmPassword) throw new Error("Passwords mismatch in security buffer.");
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email, password,
        });
        if (authError) throw authError;

        if (authData.user) {
          // Create the "Unapproved" profile entry immediately
          const { error: profileError } = await supabase.from('profiles').insert([
            { 
              id: authData.user.id, 
              full_name: fullName.toUpperCase(), 
              email: email,
              role: 'Employee', 
              is_approved: false,
              is_active: true
            }
          ]);
          if (profileError) throw profileError;
          setIsPendingApproval(true);
        }
      } else {
        // LOGIN PHASE
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        if (data.user) checkUserRegistry(data.user);
      }
    } catch (err) {
      alert("SYSTEM ACCESS DENIED: " + err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  // GOOGLE ENTRANCE PROTOCOL
  const handleSocialAuth = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({ 
        provider,
        options: {
            redirectTo: window.location.origin
        }
    });
    if (error) alert("OAUTH INTERFACE ERROR: " + error.message);
  };

  // UI STATE: THE "WAITING ROOM" (BLOCKER)
  if (isPendingApproval) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="w-full max-w-[500px] bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-700">
           <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
           <div className="mb-8 flex justify-center">
             <div className="w-24 h-24 bg-amber-50 rounded-[28px] flex items-center justify-center border border-amber-100">
               <ShieldAlert className="text-amber-500 animate-pulse" size={44} />
             </div>
           </div>
           <h2 className="text-2xl font-black italic text-slate-900 uppercase tracking-tighter mb-4">Verification Required</h2>
           <p className="text-slate-600 text-[13px] font-bold uppercase leading-relaxed tracking-tight mb-8">
             Your request is sent to <span className="text-indigo-600">Admin Sir Rabnawaz</span>. 
             <br />As he allows you, then you can login and access the management system.
             <br /><span className="text-[10px] text-slate-300 mt-4 block italic">NODE STATUS: WAITING FOR AUTHORIZATION</span>
           </p>
           <button 
             onClick={() => supabase.auth.signOut().then(() => {
                setIsPendingApproval(false);
                window.location.reload();
             })} 
             className="w-full bg-slate-900 text-white h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] italic flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl">
             Sign Out Protocol
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[480px] bg-white rounded-[35px] border border-slate-100 shadow-[0_30px_70px_rgba(15,23,42,0.08)] p-10 md:p-14 relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        
        {/* TOP STATUS ROW */}
        <div className="flex justify-between items-center mb-10">
          <div className="w-12 h-12 bg-indigo-600 rounded-[18px] flex items-center justify-center shadow-lg shadow-indigo-100 group cursor-help transition-all duration-500 hover:rotate-[10deg]">
            <Command className="text-white" size={24} />
          </div>
          <button onClick={() => setIsSignup(!isSignup)} className="text-[10px] font-black uppercase text-indigo-500 hover:text-indigo-700 tracking-[0.2em] italic border-b-2 border-transparent hover:border-indigo-600 transition-all">
            {isSignup ? "Return to Log In" : "Request New Node"}
          </button>
        </div>

        {/* LOGO AREA */}
        <div className="mb-10">
           <h1 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter leading-none mb-2">Code Nest</h1>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-60 flex items-center gap-2">
             <Globe size={10} /> Authorized HQ Interface
           </p>
        </div>

        {/* FORM GRID */}
        <form onSubmit={handleAuth} className="space-y-6">
          {isSignup && (
             <div className="animate-in slide-in-from-top-4 duration-300">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 block italic">Subject Full Name</label>
                <div className="relative group">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input type="text" required placeholder="ENTRANCE NAME" value={fullName} onChange={e => setFullName(e.target.value)}
                    className="w-full bg-slate-50 h-14 rounded-2xl pl-12 pr-4 border-none text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-600/10 placeholder:text-slate-300 tracking-[0.1em] uppercase transition-all" />
                </div>
             </div>
          )}

          <div>
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 block italic">System Identifier // Email</label>
             <div className="relative group">
               <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
               <input type="email" required placeholder="SYSTEM_IDENTIFIER@NEST.COM" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 h-14 rounded-2xl pl-12 pr-4 border-none text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-600/10 placeholder:text-slate-300 transition-all" />
             </div>
          </div>

          <div className={`grid gap-4 ${isSignup ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 block italic">Alpha Cipher</label>
               <div className="relative group">
                 <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                 <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 h-14 rounded-2xl pl-12 pr-4 border-none text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-600/10 tracking-[0.4em] transition-all" />
               </div>
            </div>
            {isSignup && (
              <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 block italic">Confirm Key</label>
                 <div className="relative group">
                   <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                   <input type="password" required placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 h-14 rounded-2xl pl-12 pr-4 border-none text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-600/10 tracking-[0.4em] transition-all" />
                 </div>
              </div>
            )}
          </div>

          <button disabled={loading} type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl text-white font-black text-[12px] uppercase tracking-[0.3em] shadow-xl shadow-indigo-100 italic transition-all active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group">
            {loading ? <Loader2 size={18} className="animate-spin text-white/50" /> : (
              <>
                <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                <span>{isSignup ? "Initialize Signup" : "Verify Entrance"}</span>
              </>
            )}
          </button>
        </form>

        {/* SOCIAL LAYER */}
        <div className="mt-12">
           <div className="flex items-center gap-4 mb-8">
              <div className="h-[1px] bg-slate-100 flex-1"></div>
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] italic">Cloud Provider Node Access</span>
              <div className="h-[1px] bg-slate-100 flex-1"></div>
           </div>

           <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => handleSocialAuth('google')} className="flex-1 bg-white border border-slate-100 h-14 rounded-2xl flex items-center justify-center gap-3 text-slate-800 text-[10px] font-black uppercase tracking-widest hover:border-indigo-400 hover:bg-indigo-50/20 transition-all shadow-sm group">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign In with Google
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </button>
           </div>
        </div>

        {/* SYSTEM STATUS LABELS */}
        <div className="mt-12 flex justify-between opacity-30 px-2">
           <div className="flex items-center gap-2">
             <Fingerprint size={12} className="text-slate-500" />
             <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Nest Core Ready</span>
           </div>
           <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Ver-A.2.0 // Secured by Supabase</span>
        </div>

      </div>
    </div>
  );
}