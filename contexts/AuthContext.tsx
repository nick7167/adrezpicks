import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

  // robust profile fetcher that handles missing rows gracefully
  const fetchAndSetProfile = useCallback(async (currentSession: Session) => {
    try {
      const profileData = await dataService.getUserProfile(currentSession.user.id);
      
      if (profileData) {
        setUser(profileData);
      } else {
        // Fallback if profile row is missing in DB but Auth exists
        setUser({
          id: currentSession.user.id,
          email: currentSession.user.email || '',
          is_admin: false,
          subscription_status: 'none'
        });
      }
    } catch (error) {
      console.error("Profile sync error:", error);
      // Even on error, valid session means we are logged in, just with basic info
      setUser({
        id: currentSession.user.id,
        email: currentSession.user.email || '',
        is_admin: false,
        subscription_status: 'none'
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // 1. Check active session immediately
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
            if (initialSession) {
                setSession(initialSession);
                await fetchAndSetProfile(initialSession);
            }
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // 2. Set up the single source of truth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      // console.log("Auth Event:", event); // Debugging

      if (newSession) {
        setSession(newSession);
        // Only refetch profile on sign-in or initial load to save bandwidth
        // Token refresh shouldn't necessarily trigger a profile refetch unless needed
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
             await fetchAndSetProfile(newSession);
        } else if (!user) {
            // If we have a session but no user in state (rare edge case), fetch it
            await fetchAndSetProfile(newSession);
        }
      } else {
        // Explicitly handle logout
        setSession(null);
        setUser(null);
      }
      
      // Ensure loading is false after any auth event
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchAndSetProfile, user]);

  const signOut = async () => {
    try {
        setLoading(true);
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
    } catch (error) {
        console.error("Sign out error:", error);
    } finally {
        setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (session) {
      await fetchAndSetProfile(session);
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