'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextProps {
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps>({
  session: null,
  loading: true,
});

export function AuthProvider({ children, session }: { children: ReactNode; session: Session | null }) {
  const [authSession, setAuthSession] = useState<Session | null>(session);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Set the session on the supabase client
    if (session !== null) {
      supabase.auth.setSession(session);
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session);
      if (session !== null) {
        supabase.auth.setSession(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [session]);

  useEffect(() => {
    setLoading(false);
  }, [authSession]);

  return (
    <AuthContext.Provider value={{ session: authSession, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};