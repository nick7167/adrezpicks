import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';
import { dataService } from '../services/dataService';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: () => void; 
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);
  const initialized = useRef(false); // Track if auth listener has successfully fired

  // Retry logic for profile fetching
  const fetchProfile = useCallback(async (currentSession: Session) => {
    try {
      const profileData = await dataService.getUserProfile(currentSession.user.id);
      
      if (!mounted.current) return;

      if (profileData) {
        setUser(profileData);
      } else {
        // Fallback: User exists in Auth but not in 'profiles' table yet
        setUser({
          id: currentSession.user.id,
          email: currentSession.user.email || '',
          is_admin: false,
          subscription_status: 'none'
        });
      }
    } catch (error) {
      console.error("Profile sync error:", error);
      if (mounted.current) {
        // Graceful degradation: Log them in with basic rights rather than crashing
        setUser({
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            is_admin: false,
            subscription_status: 'none'
        });
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;

    // 1. Setup Listener immediately
    // This is the primary source of truth. If this fires, we are connected.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted.current) return;
      
      // Mark as initialized so we don't aggressively wipe tokens in the timeout block
      initialized.current = true;
      
      setSession(newSession);

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (newSession) {
             // Only fetch profile if we don't have it or it changed (optimization)
             if (!user || user.id !== newSession.user.id) {
                 await fetchProfile(newSession);
             }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
      } else if (event === 'TOKEN_REFRESHED') {
        if (newSession && !user) {
            await fetchProfile(newSession);
        }
      }
      
      setLoading(false);
    });

    // 2. Run safety check/initialization
    const initializeAuth = async () => {
      try {
        // Race condition: If Supabase takes > 5s, we assume it's stuck (common with stale local storage)
        // and we abort waiting. This prevents the white screen of death.
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Auth Init Timeout")), 5000)
        );

        // @ts-ignore
        const { data, error } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (error) throw error;

        if (mounted.current && data?.session) {
            // Listener usually handles this, but we ensure consistency here
            if (!user) await fetchProfile(data.session);
        }
      } catch (error) {
        console.warn("Auth initialization interrupted:", error);
        
        // CRITICAL FIX: Only clear localStorage if we have NOT heard from the listener (initialized.current === false)
        // This prevents logging out valid users on slow connections.
        if (mounted.current && !initialized.current) {
             try {
                 console.log("Wiping stale auth tokens due to complete auth freeze...");
                 Object.keys(localStorage).forEach((key) => {
                     if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                         localStorage.removeItem(key);
                     }
                 });
             } catch (e) {
                 console.error("Error clearing stale auth:", e);
             }
             
             setSession(null);
             setUser(null);
        }
      } finally {
        if (mounted.current) {
            setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    try {
        setLoading(true);
        await supabase.auth.signOut();
        if (mounted.current) {
            setUser(null);
            setSession(null);
        }
    } catch (error) {
        console.error("Sign out error:", error);
    } finally {
        if (mounted.current) setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (session) {
      await fetchProfile(session);
    }
  };

  const signIn = () => {}; 

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};