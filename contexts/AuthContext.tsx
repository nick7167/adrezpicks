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
    let safetyTimer: ReturnType<typeof setTimeout>;

    const initializeAuth = async () => {
      try {
        // 1. Set a fail-safe timeout. If Supabase hangs for 3s, force the app to load.
        safetyTimer = setTimeout(() => {
            if (mounted.current && loading) {
                console.warn("Auth timed out. Forcing application load.");
                setLoading(false);
            }
        }, 3000);

        // 2. Check for an active session immediately
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (mounted.current) {
            if (initialSession) {
                setSession(initialSession);
                // Await profile to prevent UI flicker, but rely on safetyTimer if it hangs
                await fetchProfile(initialSession);
            }
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        // If session is corrupt, clear it to prevent infinite loops
        if (mounted.current) {
             await supabase.auth.signOut().catch(() => {});
             setSession(null);
             setUser(null);
        }
      } finally {
        if (mounted.current) {
            setLoading(false);
            clearTimeout(safetyTimer);
        }
      }
    };

    initializeAuth();

    // 3. Listen for live auth changes (Login, Logout, Auto-Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted.current) return;
      
      setSession(newSession);

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (newSession) {
            await fetchProfile(newSession);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
      } else if (event === 'TOKEN_REFRESHED') {
        // Token refreshed, usually profile data hasn't changed, so we skip fetching
        // to avoid race conditions, unless we somehow lost the user state.
        if (newSession && !user) {
            await fetchProfile(newSession);
        }
      }
      
      // Always ensure loading is false after an event is processed
      setLoading(false);
    });

    return () => {
      mounted.current = false;
      if (safetyTimer) clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [fetchProfile]); // user/session omitted to prevent re-running subscription

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