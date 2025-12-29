import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Lock, Building2, ShieldAlert, UserPlus, KeyRound, User, Loader2 } from 'lucide-react';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false); 
  const [identifier, setIdentifier] = useState(''); 
  const [fullName, setFullName] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // AUTH HANDSHAKE PROTOCOL: Optimized for Sir Rabnawaz's Registry
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    // SECURITY NORMALIZATION: Standardizing node identification
    const cleanId = identifier.trim().toLowerCase();
    const formattedEmail = cleanId.includes('@') 
      ? cleanId 
      : `${cleanId}@codenest.com`;

    try {
      if (isSignup) {
        // --- 1. HQ ENROLLMENT PHASE ---
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formattedEmail,
          password: password,
        });

        if (authError) throw authError;

        if (authData.user) {
          // --- 2. REGISTRY INJECTION: Mapping new node for Admin review ---
          const { error: profileError } = await supabase.from('profiles').insert([
            { 
              id: authData.user.id, 
              full_name: fullName.toUpperCase().trim(), 
              role: 'employee', 
              is_approved: false // NODE GATED: WAITING FOR SIR RABNAWAZ
            }
          ]);

          if (profileError) throw profileError;

          alert("TRANSMISSION SUCCESS: Personnel node logged. Wait for Sir Rabnawaz to authorize access via HQ Dashboard.");
          setIsSignup(false);
          setFullName('');
          setIdentifier('');
        }
      } else {
        // --- 3. TERMINAL ACCESS PHASE ---
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ 
          email: formattedEmail, 
          password: password 
        });

        if (loginError) {
          const message = loginError.message === "Invalid login credentials" 
            ? "IDENTIFIER OR CIPHER MISMATCH. RE-CHECK NODE ID." 
            : loginError.message.toUpperCase();
          throw new Error(message);
        }
      }
    } catch (error) {
      alert("TERMINAL ERROR: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 h-screen w-screen bg-[#0c3740] flex flex-col items-center justify-center font-sans selection:bg-[#2b945f] selection:text-white overflow-hidden select-none m-0 p-0 border-none relative">
      
      {/* TECHNICAL BACKGROUND GRID */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(#2b945f 1px, transparent 1px)`, backgroundSize: '24px 24px' }}></div>
      
      {/* 80% SCALE MODULE BOX (HIGH-DENSITY WRAPPER) */}
      <div className="w-full max-w-[380px] animate-in fade-in zoom-in-95 duration-1000 p-4" style={{ zoom: '0.8' }}>
        
        {/* HARDWARE MODULE CONTAINER */}
        <div className="bg-[#0c3740]/90 backdrop-blur-xl rounded-[4px] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.9),0_0_20px_rgba(43,148,95,0.15)] overflow-hidden border border-[#2b945f]/20 relative z-10">
            
            {/* TERMINAL HEADER */}
            <div className={`p-8 text-center text-white relative transition-all duration-700 border-b border-[#2b945f]/20 ${isSignup ? 'bg-gradient-to-b from-[#0c3740] to-black/20' : 'bg-gradient-to-b from-[#2b945f]/20 to-transparent'}`}>
                {/* FLOATING DECOR */}
                <div className="absolute top-2 left-2 flex gap-1.5 opacity-30">
                  <div className="w-1.5 h-1.5 bg-[#2b945f] rounded-full animate-pulse"></div>
                  <div className="w-8 h-[1px] bg-[#2b945f]/50 self-center"></div>
                </div>
                
                <div className="flex justify-center mb-5 relative z-10">
                    <div className="bg-[#0c3740] p-4 rounded-none border border-[#2b945f] shadow-[0_0_15px_rgba(43,148,95,0.4)] transform rotate-45 group hover:rotate-90 transition-transform duration-500">
                       <div className="-rotate-45 group-hover:-rotate-90 transition-transform">
                        {isSignup ? <KeyRound size={28} className="text-[#2b945f]" /> : <Building2 size={28} className="text-[#2b945f]" />}
                       </div>
                    </div>
                </div>
                
                <h1 className="text-3xl font-black italic uppercase tracking-[0.2em] leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                    {isSignup ? "Register" : "Code Nest"}
                </h1>
                <p className="text-[10px] font-bold text-[#2b945f] mt-3 uppercase tracking-[0.5em] italic border-t border-[#2b945f]/20 pt-3 inline-block">
                    {isSignup ? "Personnel Enrollment Node" : "Authorized Access Only"}
                </p>
            </div>

            {/* DATA INPUT LAYER (TECHNICAL DARK SURFACE) */}
            <div className="p-7 bg-[#0c3740]/40">
                <form onSubmit={handleAuth} className="space-y-3">
                    
                    {/* NODE FULL NAME (REGISTRY ONLY) */}
                    {isSignup && (
                        <div className="animate-in slide-in-from-left-4 duration-500">
                            <label className="block text-[10px] font-black text-[#2b945f] mb-1.5 uppercase tracking-widest italic opacity-80">Full Name String // Profile ID</label>
                            <div className="relative group">
                                <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2b945f]/40 group-focus-within:text-[#2b945f] transition-all" />
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="ENTRY NODE NAME"
                                    className="w-full bg-black/40 border border-[#2b945f]/10 pl-11 p-4 rounded-none text-[11px] font-black italic text-white outline-none focus:border-[#2b945f] focus:ring-1 focus:ring-[#2b945f]/50 transition-all uppercase placeholder:opacity-10 tracking-[0.1em]" 
                                    onChange={(e) => setFullName(e.target.value)} 
                                    value={fullName}
                                />
                            </div>
                        </div>
                    )}

                    {/* TERMINAL IDENTIFIER */}
                    <div className="transition-all duration-300">
                        <label className="block text-[10px] font-black text-[#2b945f] mb-1.5 uppercase tracking-widest italic opacity-80">Encryption Node // ID</label>
                        <div className="relative group">
                            <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2b945f]/40 group-focus-within:text-[#2b945f] transition-all" />
                            <input 
                                type="text" 
                                required 
                                placeholder={isSignup ? "SET_NODE_IDENTIFIER" : "INPUT_HQ_CREDENTIALS"}
                                className="w-full bg-black/40 border border-[#2b945f]/10 pl-11 p-4 rounded-none text-[11px] font-black italic text-white outline-none focus:border-[#2b945f] focus:ring-1 focus:ring-[#2b945f]/50 transition-all uppercase placeholder:opacity-10 tracking-[0.1em]" 
                                onChange={(e) => setIdentifier(e.target.value)} 
                                value={identifier}
                            />
                        </div>
                    </div>

                    {/* SECURITY CIPHER */}
                    <div className="transition-all duration-300">
                        <label className="block text-[10px] font-black text-[#2b945f] mb-1.5 uppercase tracking-widest italic opacity-80">Alpha Cipher Key</label>
                        <div className="relative group">
                            <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2b945f]/40 group-focus-within:text-[#2b945f] transition-all" />
                            <input 
                                type="password" 
                                required 
                                placeholder="••••••••"
                                className="w-full bg-black/40 border border-[#2b945f]/10 pl-11 p-4 rounded-none text-[11px] font-black italic text-[#2b945f] outline-none focus:border-[#2b945f] focus:ring-1 focus:ring-[#2b945f]/50 transition-all tracking-[0.4em]" 
                                onChange={(e) => setPassword(e.target.value)} 
                                value={password}
                            />
                        </div>
                    </div>

                    {/* HQ COMMAND BUTTON */}
                    <div className="pt-5">
                        <button 
                            disabled={loading} 
                            className={`w-full font-black py-4 rounded-none transition-all duration-300 text-[12px] uppercase tracking-[0.3em] active:scale-[0.98] italic flex items-center justify-center gap-3 overflow-hidden group relative
                            ${isSignup 
                              ? 'bg-transparent border border-[#2b945f] text-[#2b945f] hover:bg-[#2b945f] hover:text-[#0c3740]' 
                              : 'bg-[#2b945f] text-[#0c3740] hover:bg-[#34b474] shadow-[0_0_20px_rgba(43,148,95,0.3)] hover:shadow-[0_0_30px_rgba(43,148,95,0.5)]'}`}
                        >
                            {loading ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <>
                                <span>{isSignup ? "Submit Enrollment" : "Initiate Connection"}</span>
                                <div className="absolute right-[-10px] top-0 bottom-0 w-8 bg-white/20 skew-x-[30deg] translate-x-[-300px] group-hover:translate-x-[400px] transition-transform duration-1000"></div>
                              </>
                            )}
                        </button>
                    </div>
                </form>

                {/* PROTOCOL MODE TOGGLE */}
                <div className="mt-6 pt-5 border-t border-[#2b945f]/10 text-center">
                    <button 
                        onClick={() => { setIsSignup(!isSignup); setIdentifier(''); setPassword(''); }}
                        className="text-[10px] font-black uppercase tracking-[0.25em] text-[#2b945f]/60 hover:text-[#2b945f] transition-colors italic relative group"
                    >
                        {isSignup ? "Existing Personnel >> Log In" : "Request Node Access >> Register"}
                        <span className="absolute bottom-[-4px] left-0 w-0 h-[1px] bg-[#2b945f] transition-all group-hover:w-full"></span>
                    </button>
                </div>
            </div>
        </div>

        {/* METADATA TAGS */}
        <div className="mt-8 flex justify-between items-center px-2 opacity-40">
           <div className="space-y-1">
             <p className="text-[10px] font-black text-[#2b945f] uppercase tracking-[0.4em] italic">Code Nest ERP Alpha</p>
             <p className="text-[8px] font-bold text-white uppercase tracking-[0.3em] italic">Node Ref: MAHK-1.0.4</p>
           </div>
           <div className="text-right">
             <ShieldAlert size={14} className="text-[#2b945f] ml-auto mb-1" />
             <p className="text-[8px] font-bold text-white uppercase tracking-[0.1em] italic">SEC_ENCR_ACTIVE</p>
           </div>
        </div>
      </div>
    </div>
  );
}