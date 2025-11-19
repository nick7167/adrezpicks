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
      // 2-second timeout specifically for profile fetch to prevent secondary hang
      const profilePromise = dataService.getUserProfile(currentSession.user.id);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
      
      const profile = await Promise.race([profilePromise, timeoutPromise]);

      if (profile) {
        setUser(profile);
      } else {
        // Fallback if profile table is empty/missing/slow
        // Check if the session is actually valid, if not, user might be null
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

    // FAIL-SAFE: Force app to load after 3 seconds even if DB is sleeping
    const safetyTimer = setTimeout(() => {
        if (mounted && loading) {
            console.warn("Auth initialization timed out. Forcing guest mode.");
            setLoading(false);
        }
    }, 3000);

    const initAuth = async () => {
      try {
        // 1. Get Session with error handling for corrupt tokens
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error("Detected corrupt session/token. clearing storage.", error);
            // Critical: If the token is bad, sign out to clear localStorage so the user isn't stuck loop
            await supabase.auth.signOut();
            if (mounted) setLoading(false);
            return;
        }
        
        const initialSession = data.session;
        
        if (mounted) {
            setSession(initialSession);
            if (initialSession) {
                await fetchProfile(initialSession);
            }
        }
      } catch (error) {
        console.error("Auth initialization failed unexpectedly:", error);
        // Last resort: try to clear session if something exploded
        await supabase.auth.signOut(); 
      } finally {
        if (mounted) {
            setLoading(false);
            clearTimeout(safetyTimer); // Clear the safety timer if we finished successfully
        }
      }
    };

    initAuth();

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      // console.log(`Auth Change: ${event}`);
      setSession(newSession);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (newSession) await fetchProfile(newSession);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        // Optional: Clear sensitive data from memory if needed
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
        await supabase.auth.signOut();
    } catch (e) {
        console.error("Error signing out:", e);
    } finally {
        // Always reset state even if API fails
        setUser(null);
        setSession(null);
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