import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Mail, Lock, User, Loader2, 
  ShieldAlert, Fingerprint, 
  ChevronRight, Layout
} from 'lucide-react';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    checkInitialSession();
  }, []);

  const checkInitialSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Logic: User is logged in, but let's check their clearance
      checkOrCreateProfile(session.user);
    }
  };

  // CORE BRAIN UPDATE: Syncs Social Auth with Sir Rabnawaz's Dashboard
  const checkOrCreateProfile = async (authUser) => {
    setLoading(true);
    try {
      // 1. Look for existing profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // 2. If no profile exists (Common with Google Login), create the node now
      if (!profile) {
        // Extract metadata provided by Google/Facebook
        const metadataName = authUser.user_metadata?.full_name || authUser.email.split('@')[0];
        
        const { error: insertError } = await supabase.from('profiles').insert([
          { 
            id: authUser.id, 
            full_name: metadataName.toUpperCase().trim(), 
            email: authUser.email.toLowerCase().trim(),
            role: 'EMPLOYEE', 
            is_approved: false // Gate locked until Rabnawaz approves
          }
        ]);
        if (insertError) throw insertError;
        setIsPendingApproval(true);
      } 
      // 3. If profile exists but not approved yet
      else if (profile && !profile.is_approved) {
        setIsPendingApproval(true);
      }
    } catch (err) {
      console.error("Auth Protocol Sync Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignup) {
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email, password,
        });
        if (authError) throw authError;

        if (authData.user) {
          const { error: profileError } = await supabase.from('profiles').insert([
            { 
              id: authData.user.id, 
              full_name: fullName.toUpperCase().trim(), 
              email: email.toLowerCase().trim(),
              role: 'EMPLOYEE', 
              is_approved: false 
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
      alert("Access Denial: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider) => {
    // Note: redirectTo ensures they come back to the current site for profile creation
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider,
      options: { redirectTo: window.location.origin }
    });
    if (error) alert("Provider Link Error: " + error.message);
  };

  // UI: SYSTEM GATED SCREEN (Wait for Sir Rabnawaz)
  if (isPendingApproval) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-[440px] bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-[0_40px_80px_-20px_rgba(15,23,42,0.1)] relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
           <div className="mb-8 flex justify-center">
             <div className="w-16 h-16 bg-amber-50 rounded-[22px] flex items-center justify-center border border-amber-100 shadow-sm animate-pulse">
               <ShieldAlert className="text-amber-500" size={32} />
             </div>
           </div>
           <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight italic">Authorization Pending</h2>
           <p className="text-slate-500 text-[11px] font-bold leading-relaxed mb-10 uppercase tracking-widest italic opacity-70">
             Your access request has been sent. <br />
             Admin <span className="text-indigo-600 font-black">Sir Rabnawaz</span> is verifying your account node.
           </p>
           <button 
             onClick={() => supabase.auth.signOut().then(() => setIsPendingApproval(false))} 
             className="w-full bg-slate-900 text-white h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl active:scale-95 italic"
           >
             Disconnect Session
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[420px] bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-12 relative transition-all duration-700">
        
        {/* LOGO & TITLE SECTION */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-14 h-14 bg-indigo-600 rounded-[20px] flex items-center justify-center shadow-lg shadow-indigo-100 mb-4 transition-transform hover:rotate-12 duration-500">
            <Layout className="text-white" size={26} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Code Nest</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 italic opacity-50 underline underline-offset-4 decoration-indigo-200">Management Node</p>
        </div>

        {/* AUTH TOGGLE COMMANDER */}
        <div className="flex bg-slate-50 p-1.5 rounded-[20px] mb-8 border border-slate-100">
          <button onClick={() => setIsSignup(false)} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest italic rounded-xl transition-all duration-300 ${!isSignup ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>System Login</button>
          <button onClick={() => setIsSignup(true)} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest italic rounded-xl transition-all duration-300 ${isSignup ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Create Account</button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignup && (
             <div className="space-y-1 animate-in slide-in-from-top-4 duration-500">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest italic">Full Node Name</label>
                <div className="relative group">
                  <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input type="text" required placeholder="IDENTIFY_SELF" value={fullName} onChange={e => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-transparent h-14 rounded-2xl pl-12 pr-4 text-xs font-bold text-slate-800 focus:border-indigo-600 focus:bg-white transition-all outline-none uppercase tracking-widest placeholder:opacity-30" />
                </div>
             </div>
          )}

          <div className="space-y-1">
             <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest italic text-right block">Identifier Email</label>
             <div className="relative group">
               <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
               <input type="email" required placeholder="name@nest.hq" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-transparent h-14 rounded-2xl pl-12 pr-4 text-xs font-bold text-slate-800 focus:border-indigo-600 focus:bg-white transition-all outline-none placeholder:opacity-30" />
             </div>
          </div>

          <div className="space-y-1">
             <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest italic">Secret Protocol // Password</label>
             <div className="relative group">
               <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
               <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-transparent h-14 rounded-2xl pl-12 pr-4 text-xs font-bold text-slate-800 focus:border-indigo-600 focus:bg-white tracking-[0.5em] transition-all outline-none" />
             </div>
          </div>

          {isSignup && (
             <div className="space-y-1 animate-in slide-in-from-top-4 duration-500">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest italic text-right block">Verify Protocol</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type="password" required placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-transparent h-14 rounded-2xl pl-12 pr-4 text-xs font-bold text-slate-800 focus:border-indigo-600 focus:bg-white tracking-[0.5em] transition-all outline-none" />
                </div>
             </div>
          )}

          <button disabled={loading} type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.3em] italic shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 mt-4 overflow-hidden group">
            {loading ? <Loader2 size={16} className="animate-spin" /> : (
              <>
                <Layout size={16} className="group-hover:scale-110 transition-transform" />
                <span>{isSignup ? "Deploy Registry" : "Execute Entry"}</span>
              </>
            )}
          </button>
        </form>

        {/* CLOUD OAUTH CONNECTORS */}
        <div className="mt-10">
           <div className="flex items-center gap-4 py-4 opacity-40">
              <div className="h-[1px] bg-slate-200 flex-1"></div>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Social Clearance</span>
              <div className="h-[1px] bg-slate-200 flex-1"></div>
           </div>

           <div className="flex gap-4">
              <button onClick={() => handleSocialAuth('google')} className="flex-1 bg-white border border-slate-100 h-14 rounded-2xl flex items-center justify-center gap-3 text-slate-700 text-[10px] font-black uppercase tracking-widest italic hover:bg-slate-50 transition-all shadow-sm group">
                <span className="text-red-500 font-black italic scale-125">G+</span>
                <span className="hidden sm:inline">Google Node</span>
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
              <button onClick={() => handleSocialAuth('facebook')} className="flex-1 bg-white border border-slate-100 h-14 rounded-2xl flex items-center justify-center gap-3 text-slate-700 text-[10px] font-black uppercase tracking-widest italic hover:bg-slate-50 transition-all shadow-sm group">
                 <span className="text-indigo-800 font-black italic scale-125">f</span>
                 <span className="hidden sm:inline">FB Node</span>
                 <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
           </div>
        </div>

        {/* SYSTEM AUDIT FOOTER */}
        <div className="mt-10 pt-6 border-t border-slate-50 flex justify-between items-center px-2">
            <div className="flex items-center gap-2">
              <Fingerprint className="text-indigo-600 opacity-40" size={14} />
              <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">RSA_4096 VALID</span>
            </div>
            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest italic">NE_HQ.V4</span>
        </div>
      </div>
    </div>
  );
}