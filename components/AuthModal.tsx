import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        // AuthProvider will pick up the session change automatically
        onSuccess();
        onClose();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        alert('Registration successful! Please check your email to verify your account.');
        setIsLogin(true);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      // More user friendly error mapping
      let msg = err.message;
      if (msg.includes("Invalid login credentials")) msg = "Incorrect email or password.";
      
      setError(msg || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-vegas-card border border-neutral-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-full transition-colors z-10"
        >
            <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="mb-8 text-center">
             <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                {isLogin ? 'Welcome Back' : 'Create Account'}
             </h3>
             <p className="text-neutral-400 text-sm">
                {isLogin ? 'Enter your credentials to access your vault.' : 'Start beating the books today.'}
             </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-vegas-green transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg p-3 pl-10 text-white focus:border-vegas-green focus:bg-neutral-900 outline-none transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between ml-1">
                 <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Password</label>
                 {isLogin && <a href="#" className="text-xs text-neutral-400 hover:text-vegas-green">Forgot?</a>}
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-vegas-green transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg p-3 pl-10 text-white focus:border-vegas-green focus:bg-neutral-900 outline-none transition-all"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-black font-bold uppercase tracking-wider py-3.5 rounded-lg hover:bg-neutral-200 transition-all flex items-center justify-center group mt-2"
            >
              {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-neutral-800 pt-6">
            <p className="text-neutral-500 text-sm">
              {isLogin ? "New to VegasVault? " : "Already a member? "}
              <button 
                onClick={() => { setError(null); setIsLogin(!isLogin); }}
                className="text-white hover:text-vegas-green font-bold transition-colors"
              >
                {isLogin ? 'Join Now' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;