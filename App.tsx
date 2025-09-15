import React, { useState, useEffect } from 'react';
import { Role } from './types';
import { supabase } from './config';
import LoginScreen from './components/LoginScreen';
import TechnicianView from './components/TechnicianView';
import AdminView from './components/AdminView';
import LoadingSpinner from './components/common/LoadingSpinner';
import { AppProvider, useAppContext } from './contexts/AppContext';

// --- MAIN APP CONTENT ---
const AppContent: React.FC = () => {
    const { currentUser, loading, viewingProfileOf, setViewingProfileOf } = useAppContext();

    if (loading) return <LoadingSpinner />;
    if (!currentUser) return <LoadingSpinner message="Cargando perfil de usuario..." />;

    if (viewingProfileOf) {
        return <TechnicianView user={viewingProfileOf} isAdminViewing={true} onBackToAdmin={() => setViewingProfileOf(null)} />;
    }

    if (currentUser.role === Role.TECHNICIAN) {
        return <TechnicianView user={currentUser} />;
    }

    if (currentUser.role === Role.ADMIN) {
        return <AdminView />;
    }

    return <LoadingSpinner message="Verificando rol..." />;
};

// --- ROOT APP COMPONENT ---
const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Auth error handling from URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const errorDescription = hashParams.get('error_description');
    if (errorDescription) {
        setAuthError(`Error: ${decodeURIComponent(errorDescription.replace(/\+/g, ' '))}`);
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (!supabase) {
    return <div className="min-h-screen bg-brand-red flex items-center justify-center text-white p-4">Error de Configuración: Revisa las variables de entorno de Supabase.</div>;
  }

  if (loading) return <LoadingSpinner />;
  
  return !session 
    ? <LoginScreen authError={authError} />
    : (
        <AppProvider session={session}>
            <AppContent />
        </AppProvider>
      );
};

export default App;