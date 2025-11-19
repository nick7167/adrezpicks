import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';
import { dataService } from '../services/dataService';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: () => void; // Trigger to open modal
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to unify profile fetching logic
  const fetchProfile = async (currentSession: Session) => {
    try {
      const profile = await dataService.getUserProfile(currentSession.user.id);
      if (profile) {
        setUser(profile);
      } else {
        // Fallback if profile table is empty/missing but auth exists
        setUser({
          id: currentSession.user.id,
          email: currentSession.user.email || '',
          is_admin: false,
          subscription_status: 'none'
        });
      }
    } catch (error) {
      console.error("Profile sync error:", error);
      // Fallback on error to ensure user is still logged in UI-wise
      setUser({
        id: currentSession.user.id,
        email: currentSession.user.email || '',
        is_admin: false,
        subscription_status: 'none'
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // 1. Get Session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
            setSession(initialSession);
            if (initialSession) {
                await fetchProfile(initialSession);
            }
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      console.log(`Auth Change: ${event}`);
      setSession(newSession);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (newSession) await fetchProfile(newSession);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (session) {
      await fetchProfile(session);
    }
  };

  // Placeholder since modal is controlled in App.tsx, but Context can trigger it via events if needed later
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