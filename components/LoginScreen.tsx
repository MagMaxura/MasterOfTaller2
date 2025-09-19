
import React, { useState, FormEvent } from 'react';
import { WrenchIcon } from './Icons';
import { supabase } from '../config';

interface LoginScreenProps {
  authError?: string | null;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ authError }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  // Combine all error/success messages into one state
  const [formMessage, setFormMessage] = useState<string | null>(authError || null);
  const [messageType, setMessageType] = useState<'error' | 'success'>(authError ? 'error' : 'success');

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormMessage(null);

    try {
        if (!supabase) {
            throw new Error("Cliente Supabase no inicializado.");
        }
        if (activeTab === 'login') {
            // FIX: Corrected to use signInWithPassword for Supabase v2 compatibility. The old `signIn` is deprecated.
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            // On success, the onAuthStateChange listener in App.tsx will handle the session.
        } else {
            const { data, error } = await supabase.auth.signUp({ 
                email, 
                password
            });
            if (error) throw error;
            
            // Handle case where user needs to confirm their email
            if (data.user && data.user.identities?.length === 0) {
                 setMessageType('error');
                 setFormMessage('Este correo ya está registrado a través de un proveedor como Google. Por favor, inicia sesión con Google.');
            } else {
                 setMessageType('success');
                 setFormMessage('¡Registro exitoso! Revisa tu bandeja de entrada para confirmar tu correo electrónico.');
            }
        }
    } catch (err: any) {
        setMessageType('error');
        setFormMessage(err.error_description || err.message || 'Ocurrió un error inesperado.');
    } finally {
        setLoading(false);
    }
  };


  const handleGoogleLogin = async () => {
    setLoading(true);
    setFormMessage(null);
    try {
      if (!supabase) {
          throw new Error("Cliente Supabase no inicializado.");
      }
      // FIX: Corrected to use signInWithOAuth for Supabase v2 compatibility. The old `signIn` with a provider is deprecated.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setMessageType('error');
      setFormMessage(err.error_description || err.message || 'No se pudo iniciar sesión con Google.');
      setLoading(false);
    }
  };
  
  const handleTabChange = (tab: 'login' | 'signup') => {
    setActiveTab(tab);
    setFormMessage(null); // Clear messages when switching tabs
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-brand-primary flex flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-sm">
        <div className="inline-block bg-brand-blue p-4 rounded-full mb-4">
          <WrenchIcon className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-brand-highlight tracking-tight">Maestros del Taller</h1>
        <p className="text-brand-light mt-2 text-lg mb-8">La plataforma para los héroes del taller.</p>
        
        {/* IMPORTANT: Add a note about enabling the email provider */}
        {!authError?.includes('Google') && <p className="text-xs text-brand-accent mb-4">Asegúrate de habilitar el proveedor "Email" en la configuración de autenticación de tu proyecto Supabase.</p>}


        <div className="bg-brand-secondary shadow-2xl rounded-lg p-8">
          <div className="flex border-b border-brand-accent mb-6">
            <button onClick={() => handleTabChange('login')} className={`flex-1 font-semibold py-2 transition-colors ${activeTab === 'login' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-brand-light hover:text-white'}`}>
              Iniciar Sesión
            </button>
            <button onClick={() => handleTabChange('signup')} className={`flex-1 font-semibold py-2 transition-colors ${activeTab === 'signup' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-brand-light hover:text-white'}`}>
              Registrarse
            </button>
          </div>
          
          <form onSubmit={handleEmailAuth} className="space-y-4">
              <input 
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-brand-primary p-3 rounded border border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <input 
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-brand-primary p-3 rounded border border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-brand-blue text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-brand-accent"
              >
                {loading && <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                {activeTab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </button>
          </form>

          {formMessage && (
            <p className={`text-center text-sm mt-4 ${messageType === 'error' ? 'text-brand-red' : 'text-brand-green'}`}>
                {formMessage}
            </p>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-accent"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-brand-secondary text-brand-light">O</span>
            </div>
          </div>
          
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-gray-700 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-all hover:bg-gray-200 disabled:bg-gray-400"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.657-3.356-11.303-8H6.306C9.656 39.663 16.318 44 24 44z" />
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.846 44 30.228 44 24c0-1.341-.138-2.65-.389-3.917z" />
              </svg>
            )}
            Continuar con Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
