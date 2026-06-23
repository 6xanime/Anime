import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile 
} from 'firebase/auth';
import { Mail, Lock, User, X, Flame, ShieldAlert, AlertCircle, Check } from 'lucide-react';
import { auth, googleProvider } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string, displayName: string) => void;
  initialMode?: 'login' | 'register';
  pendingAction?: string;
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialMode = 'login',
  pendingAction = 'watch content'
}: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user.email) {
        setSuccess('Successfully authorized with Google!');
        
        // Sync profile definition with backend db
        const syncRes = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: user.email, 
            displayName: user.displayName || user.email.split('@')[0], 
            avatarUrl: user.photoURL || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100`
          })
        });
        
        const profileData = await syncRes.json();
        
        // Check if banned
        if (profileData.isBanned) {
          setError('Access Denied: This account has been suspended by administrators.');
          auth.signOut();
          setLoading(false);
          return;
        }

        // track activity
        await fetch('/api/admin/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            action: 'sign_in_google'
          })
        });

        setTimeout(() => {
          onSuccess(user.email!, profileData.displayName);
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to authorize with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all credentials.');
      return;
    }
    if (tab === 'register') {
      if (!username.trim()) {
        setError('Please choose a username.');
        return;
      }
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters.');
        return;
      }
    }

    setLoading(true);
    try {
      if (tab === 'register') {
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = result.user;
        
        // set layout display name
        await updateProfile(user, { displayName: username.trim() });

        setSuccess('Account created successfully! Synchronizing system profile...');

        // Sync with backend db
        const syncRes = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: user.email, 
            displayName: username.trim(), 
            avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100`
          })
        });
        
        const profileData = await syncRes.json();

        // Log active registration activity
        await fetch('/api/admin/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            action: 'sign_up'
          })
        });

        setTimeout(() => {
          onSuccess(user.email!, profileData.displayName);
          onClose();
        }, 1200);
      } else {
        const result = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = result.user;
        
        setSuccess('Successfully logged in!');

        // Sync with backend db
        const syncRes = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: user.email, 
            displayName: user.displayName || user.email!.split('@')[0]
          })
        });
        const profileData = await syncRes.json();

        // Check if banned
        if (profileData.isBanned) {
          setError('Access Denied: This account has been suspended by administrators.');
          auth.signOut();
          setLoading(false);
          return;
        }

        // Log login activity
        await fetch('/api/admin/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            action: 'sign_in_password'
          })
        });

        setTimeout(() => {
          onSuccess(user.email!, profileData.displayName);
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Incorrect email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already registered.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Authentication operation failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-[#050708]/90 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-[#090d0e]/95 border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow Spots */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-amber-500/10 blur-[60px]" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-rose-500/10 blur-[60px]" />
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-1.5 rounded-full hover:bg-white/[0.04] transition cursor-pointer z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Title */}
        <div className="text-center space-y-2 mb-6 relative">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
            <Flame className="h-5 w-5 animate-pulse" />
          </div>
          <h2 className="text-2xl font-serif text-white tracking-tight font-medium">Join to Start Watching</h2>
          <p className="text-xs text-stone-400 font-sans max-w-sm mx-auto leading-relaxed">
            Create a free account or sign in to watch anime and donghua, save your watchlist, rate content and sync progress seamlessly.
          </p>
          {pendingAction && (
            <span className="inline-block bg-white/[0.04] text-stone-300 border border-white/[0.05] text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full mt-2">
              Required to: {pendingAction}
            </span>
          )}
        </div>

        {/* Success / Error Messages */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl flex items-start gap-2 animate-shake">
            <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-normal">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/15 text-emerald-300 text-xs font-semibold rounded-xl flex items-start gap-2">
            <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-normal">{success}</p>
          </div>
        )}

        {/* Tabs switcher */}
        <div className="bg-white/[0.02] border border-white/10 rounded-full p-1 flex items-center gap-1 mb-5 relative">
          <button
            onClick={() => { setTab('login'); setError(null); }}
            className={`flex-1 text-center py-2 text-xs font-semibold rounded-full transition ${tab === 'login' ? 'bg-white text-black font-bold' : 'text-stone-400 hover:text-white'}`}
          >
            Login
          </button>
          <button
            onClick={() => { setTab('register'); setError(null); }}
            className={`flex-1 text-center py-2 text-xs font-semibold rounded-full transition ${tab === 'register' ? 'bg-white text-black font-bold' : 'text-stone-400 hover:text-white'}`}
          >
            Sign Up
          </button>
        </div>

        {/* LogIn/Register Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4 relative">
          {tab === 'register' && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider font-bold">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-stone-500"><User className="h-4 w-4" /></span>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_\-]/g, ''))}
                  placeholder="e.g. tanvirgod6"
                  className="w-full bg-[#050708] border border-white/10 rounded-xl px-9 py-2 text-xs outline-none focus:border-white/20 text-stone-300"
                />
              </div>
              <p className="text-[10px] text-stone-500 font-sans pl-1">Unique handle with no spaces (lowercase, numbers, _ or - only)</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider font-bold">Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-stone-500"><Mail className="h-4 w-4" /></span>
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full bg-[#050708] border border-white/10 rounded-xl px-9 py-2 text-xs outline-none focus:border-white/20 text-stone-300"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider font-bold animate-fade-in">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-stone-500"><Lock className="h-4 w-4" /></span>
              <input
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-[#050708] border border-white/10 rounded-xl px-9 py-2 text-xs outline-none focus:border-white/20 text-stone-300"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-white text-black hover:bg-stone-200 text-xs font-semibold rounded-full flex items-center justify-center transition disabled:opacity-50 cursor-pointer text-center"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-3.5 w-3.5 text-black" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : tab === 'login' ? 'Login' : 'Create Free Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 font-bold">Or authorize via</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* Google Continue login button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
          className="w-full h-10 bg-white/[0.03] border border-white/10 text-stone-200 hover:bg-white/[0.06] hover:border-white/20 text-xs font-semibold rounded-full flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
        >
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        {/* Cancel/Dismiss */}
        <div className="mt-4 text-center">
          <button 
            type="button"
            onClick={onClose}
            className="text-[10px] uppercase font-mono tracking-wider font-bold text-stone-500 hover:text-stone-300 transition cursor-pointer"
          >
            Cancel and Browse
          </button>
        </div>
      </div>
    </div>
  );
}
