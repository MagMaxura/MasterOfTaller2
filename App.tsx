
import React, { useState, useEffect, useMemo } from 'react';
import { Role } from './types';
import { supabase } from './config';
import LoginScreen from './components/LoginScreen';
import TechnicianView from './components/TechnicianView';
import AdminView from './components/AdminView';
import LoadingSpinner from './components/common/LoadingSpinner';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';

declare const window: any;

// --- MAIN APP CONTENT ---
const AppContent: React.FC = () => {
    const { currentUser, loading: authLoading } = useAuth();
    const { users, viewingProfileOf, setViewingProfileOf, loading: dataLoading } = useData();

    // Find the full user object from DataContext once it's loaded.
    // Fallback to the light currentUser from AuthContext if DataContext is still loading.
    const fullCurrentUser = useMemo(() => {
        if (!currentUser) return null;
        const userFromData = users.find(u => u.id === currentUser.id);
        return userFromData || currentUser;
    }, [users, currentUser]);

    // Show a loading screen while auth OR initial data is loading.
    // The check `users.length === 0` handles the initial state before data is fetched.
    if (authLoading || (dataLoading && users.length === 0)) {
        return <LoadingSpinner />;
    }

    // If after all loading, we still don't have a user, something is wrong with auth.
    if (!fullCurrentUser) {
        return <LoadingSpinner message="Cargando perfil de usuario..." />;
    }
    
    // Use fullCurrentUser from now on
    if (viewingProfileOf) {
        // We need to find the full profile for the user being viewed as well.
        const fullViewingProfile = users.find(u => u.id === viewingProfileOf.id) || viewingProfileOf;
        return <TechnicianView user={fullViewingProfile} isAdminViewing={true} onBackToAdmin={() => setViewingProfileOf(null)} />;
    }

    if (fullCurrentUser.role === Role.TECHNICIAN) {
        return <TechnicianView user={fullCurrentUser} />;
    }

    if (fullCurrentUser.role === Role.ADMIN) {
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
    return (
        <div className="min-h-screen bg-brand-red flex items-center justify-center text-white p-4 text-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Error de Configuración de Supabase</h1>
            <p className="mb-6">No se pudieron encontrar credenciales válidas para conectar con la base de datos.</p>
            
            <div className="mt-4 text-sm bg-red-800/50 p-4 rounded-md text-left space-y-4 max-w-lg">
               <div>
                  <h2 className="font-bold mb-2">Solución para Desarrollo Local:</h2>
                  <p>
                    Abre el archivo <code className="font-mono bg-black/30 px-1 rounded">public/supabase-credentials.js</code> y asegúrate de que contiene tu <strong>URL</strong> y <strong>clave anónima (anon key)</strong> correctas de Supabase.
                  </p>
              </div>

               <div>
                  <h2 className="font-bold mb-2">Solución para Producción (Vercel, etc.):</h2>
                  <p>
                    Asegúrate de haber configurado las variables de entorno <code className="font-mono bg-black/30 px-1 rounded">SUPABASE_URL</code> y <code className="font-mono bg-black/30 px-1 rounded">SUPABASE_ANON_KEY</code> en la configuración de tu plataforma de despliegue.
                  </p>
              </div>
            </div>
          </div>
        </div>
    );
  }

  if (loading) return <LoadingSpinner />;
  
  return (
    <ToastProvider>
      {!session ? (
        <LoginScreen authError={authError} />
      ) : (
        <AuthProvider session={session}>
          <DataProvider>
            <AppContent />
          </DataProvider>
        </AuthProvider>
      )}
    </ToastProvider>
  );
};

export default App;