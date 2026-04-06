import React, { createContext, useContext, useMemo } from 'react';
import { supabase } from '../config';
import { User as AuthUser } from '@supabase/supabase-js';

interface AuthContextType {
  session: any;
  user: AuthUser | null;
  handleLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ session: any; children: React.ReactNode }> = ({ session, children }) => {
  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    handleLogout,
  }), [session]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};