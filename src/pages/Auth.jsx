import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Mail, Lock, User, Loader2, 
  ShieldAlert, Fingerprint, 
  ChevronRight, Layout, XCircle
} from 'lucide-react';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [isDenied, setIsDenied] = useState(false); // NEW: Denied State logic
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) checkOrCreateProfile(session.user);
    });
    checkInitialSession();
    return () => subscription.unsubscribe();
  }, []);

  const checkInitialSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) checkOrCreateProfile(session.user);
  };

  const checkOrCreateProfile = async (authUser) => {
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // CASE A: NEW SOCIAL USER (Create Pending Node)
      if (!profile) {
        const metadataName = authUser.user_metadata?.full_name || authUser.email.split('@')[0];
        const { error: insertError } = await supabase.from('profiles').insert([
          { 
            id: authUser.id, 
            full_name: metadataName.toUpperCase().trim(), 
            email: authUser.email.toLowerCase().trim(),
            role: 'EMPLOYEE', 
            is_approved: false,
            is_active: true
          }
        ]);
        if (insertError) throw insertError;
        setIsPendingApproval(true);
      } 
      
      // CASE B: USER IS FLAT-OUT DENIED BY ADMIN
      else if (profile && profile.is_active === false) {
        setIsDenied(true);
        setIsPendingApproval(false);
      }

      // CASE C: PENDING APPROVAL (Wait for Rabnawaz)
      else if (profile && !profile.is_approved) {
        setIsPendingApproval(true);
        setIsDenied(false);
      }

      // CASE D: AUTHORIZED (Application proceeds normally)
      else if (profile && profile.is_approved) {
        setIsPendingApproval(false);
        setIsDenied(false);
      }

    } catch (err) {
      console.error("Critical Auth Sync Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignup) {
        if (password !== confirmPassword) throw new Error("Security Key mismatch.");
        
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;

        if (authData.user) {
          const { error: profileError } = await supabase.from('profiles').insert([
            { 
              id: authData.user.id, 
              full_name: fullName.toUpperCase().trim(), 
              email: email.toLowerCase().trim(),
              role: 'EMPLOYEE', 
              is_approved: false,
              is_active: true 
            }
          ]);
          if (profileError) throw profileError;
          setIsPendingApproval(true);
        }
      } else {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        if (data.user) checkOrCreateProfile(data.user);
      }
    } catch (err) {
      alert("Terminal Rejection: " + err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider,
      options: { redirectTo: window.location.origin }
    });
    if (error) alert("Provider Link Error: " + error.message);
  };

  const disconnectSession = () => {
    supabase.auth.signOut().then(() => {
        setIsPendingApproval(false);
        setIsDenied(false);
        window.location.reload();
    });
  };

  // UI: DENIED SCREEN
  if (isDenied) {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
          <div className="w-full max-w-[400px] bg-red-50/30 rounded-[35px] p-12 text-center border-2 border-red-100 shadow-2xl relative">
             <div className="mb-8 flex justify-center">
                <XCircle className="text-red-500 animate-pulse" size={54} />
             </div>
             <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tighter italic leading-tight">Access Prohibited</h2>
             <p className="text-slate-500 text-[11px] font-black leading-relaxed mb-10 uppercase tracking-widest italic opacity-80">
               SORRY, YOU ARE NOT ALLOWED ACCESS <br />
               TO THE NEST MANAGEMENT TERMINALS. <br />
               <span className="text-red-600 block mt-2">ACCOUNT DISABLED BY HQ</span>
             </p>
             <button onClick={disconnectSession} className="w-full bg-slate-900 text-white h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] italic shadow-xl">Abort Attempt</button>
          </div>
        </div>
      );
  }

  // UI: PENDING SCREEN
  if (isPendingApproval) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-[440px] bg-white rounded-[40px] p-14 text-center border border-slate-100 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
           <div className="mb-10 flex justify-center">
             <div className="w-20 h-20 bg-amber-50 rounded-[28px] flex items-center justify-center border border-amber-100 animate-pulse shadow-sm">
               <ShieldAlert className="text-amber-500" size={38} />
             </div>
           </div>
           <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight italic leading-tight">Identity Pending</h2>
           <p className="text-slate-500 text-[11px] font-bold leading-relaxed mb-10 uppercase tracking-widest italic opacity-60">
             Your request is sent to Admin <span className="text-indigo-600 font-black">Sir Rabnawaz</span>. <br /> 
             As he allows you, then you can login.
           </p>
           <button onClick={disconnectSession} className="w-full bg-slate-900 text-white h-15 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl active:scale-95 italic">
             Log out Protocol
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[420px] bg-white rounded-[35px] border border-slate-100 shadow-[0_40px_100px_rgba(0,0,0,0.04)] p-14 relative transition-all">
        
        {/* LOGO & TITLE SECTION */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-[22px] flex items-center justify-center shadow-2xl shadow-indigo-100 mb-6 group cursor-help transition-all duration-700 hover:scale-110">
            <Layout className="text-white group-hover:rotate-[360deg] transition-all duration-700" size={30} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Code Nest</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3 italic opacity-40">Matrix Hub Access</p>
        </div>

        {/* COMMAND CENTER TOGGLE */}
        <div className="flex bg-slate-50 p-1.5 rounded-3xl mb-10 border border-slate-100 shadow-inner">
          <button onClick={() => setIsSignup(false)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest italic rounded-2xl transition-all ${!isSignup ? 'bg-white shadow-xl text-indigo-600' : 'text-slate-400'}`}>Verify Entry</button>
          <button onClick={() => setIsSignup(true)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest italic rounded-2xl transition-all ${isSignup ? 'bg-white shadow-xl text-indigo-600' : 'text-slate-400'}`}>Create ID</button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignup && (
             <div className="animate-in slide-in-from-top-4 duration-500">
                <div className="relative group">
                  <User size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input type="text" required placeholder="SUBJECT FULL NAME" value={fullName} onChange={e => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border-none h-14 rounded-2xl pl-12 pr-4 text-xs font-bold text-slate-800 focus:bg-white shadow-sm ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-100 outline-none uppercase tracking-widest transition-all" />
                </div>
             </div>
          )}

          <div className="relative group">
            <Mail size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
            <input type="email" required placeholder="NEST_IDENTIFIER@HQ.COM" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-50 border-none h-14 rounded-2xl pl-12 pr-4 text-xs font-bold text-slate-800 focus:bg-white ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-100 outline-none transition-all uppercase placeholder:italic" />
          </div>

          <div className="relative group">
            <Lock size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
            <input type="password" required placeholder="ALPHA CIPHER" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-50 border-none h-14 rounded-2xl pl-12 pr-4 text-xs font-bold text-slate-800 focus:bg-white ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-100 tracking-[0.5em] transition-all outline-none" />
          </div>

          {isSignup && (
             <div className="animate-in slide-in-from-top-4 duration-500">
                <div className="relative">
                  <Lock size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type="password" required placeholder="VERIFY ALPHA CIPHER" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border-none h-14 rounded-2xl pl-12 pr-4 text-xs font-bold text-slate-800 focus:bg-white ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-100 tracking-[0.5em] transition-all outline-none" />
                </div>
             </div>
          )}

          <button disabled={loading} type="submit" 
            className="w-full bg-indigo-600 hover:bg-black h-15 rounded-[22px] text-white font-black text-[12px] uppercase tracking-[0.4em] italic shadow-2xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 mt-6 group">
            {loading ? <Loader2 size={18} className="animate-spin" /> : (
              <>
                <Fingerprint size={18} className="group-hover:rotate-12 transition-transform" />
                <span>{isSignup ? "Deploy Hub Registry" : "Execute Authorization"}</span>
              </>
            )}
          </button>
        </form>

        {/* SOCIAL LAYER */}
        <div className="mt-12">
           <div className="flex items-center gap-4 py-4 opacity-40">
              <div className="h-[1px] bg-slate-100 flex-1"></div>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic leading-none">Cloud Providers</span>
              <div className="h-[1px] bg-slate-100 flex-1"></div>
           </div>

           <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => handleSocialAuth('google')} className="flex-1 bg-white border-2 border-slate-50 h-14 rounded-2xl flex items-center justify-center gap-4 text-slate-800 text-[10px] font-black uppercase tracking-widest italic hover:bg-slate-50 transition-all shadow-sm group">
                <div className="flex gap-0.5"><span className="text-blue-500">G</span><span className="text-red-500">o</span><span className="text-amber-500">o</span></div>
                Google Hub Access
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 translate-x-2 transition-all" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}