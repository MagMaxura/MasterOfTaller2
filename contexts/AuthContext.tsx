import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User } from '../types';
import { supabase } from '../config';
import { api } from '../services/api';
import { transformSupabaseProfileToUser } from '../utils/dataTransformers';
import { useToast } from './ToastContext';

interface AuthContextType {
  currentUser: User | null;
  session: any;
  loading: boolean;
  handleLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ session: any; children: React.ReactNode }> = ({ session, children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchCurrentUser = useCallback(async () => {
    if (session?.user?.id) {
      try {
        const { data, error } = await api.getFullProfile(session.user.id);
        if (error) {
            // Throw a proper Error object to get a better stack trace and message.
            throw new Error(`Supabase error fetching profile: ${error.message} (Code: ${error.code})`);
        }
        setCurrentUser(transformSupabaseProfileToUser(data));
      } catch (error) {
        showToast("Error al cargar el perfil del usuario.", 'error');
        console.error("Error fetching current user:", error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [session, showToast]);

  useEffect(() => {
    setLoading(true);
    fetchCurrentUser();

    const profileListener = supabase
      .channel('public:profiles:currentUser')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${session.user.id}` },
          () => fetchCurrentUser()
      ).subscribe();
      
    return () => {
        supabase.removeChannel(profileListener);
    }

  }, [session, fetchCurrentUser]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const value = {
    currentUser,
    session,
    loading,
    handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};