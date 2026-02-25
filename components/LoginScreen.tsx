
import React, { useState } from 'react';
import { WrenchIcon } from './Icons';
import { supabase } from '../config';

interface LoginScreenProps {
  authError?: string | null;
  onBypass?: (role: 'admin' | 'technician') => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ authError, onBypass }) => {
  const [loading, setLoading] = useState(false);

  // Combine all error/success messages into one state
  const [formMessage, setFormMessage] = useState<string | null>(authError || null);
  const [messageType, setMessageType] = useState<'error' | 'success'>(authError ? 'error' : 'success');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setFormMessage(null);
    try {
      if (!supabase) {
        throw new Error("Cliente Supabase no inicializado.");
      }
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

  return (
    <div className="min-h-screen bg-brand-primary flex flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-sm">
        <div className="inline-block bg-brand-blue p-5 rounded-3xl mb-8 shadow-xl shadow-brand-blue/20">
          <WrenchIcon className="w-16 h-16 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold text-brand-highlight tracking-tight mb-2 uppercase">Herramienta de</h1>
        <h1 className="text-2xl font-black text-brand-blue tracking-tighter mb-2">PROYECTO Y GESTION GAMIFICADA</h1>
        <p className="text-brand-light text-lg mb-10">Gestión profesional y gamificada.</p>

        <div className="bg-white shadow-soft rounded-3xl p-8 border border-brand-accent/50">
          <h2 className="text-xl font-bold text-brand-highlight mb-6">Bienvenido</h2>

          <p className="text-brand-light text-sm mb-8">Usa tu cuenta de Google para acceder a la plataforma de forma segura.</p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border border-brand-accent text-brand-highlight font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:bg-brand-secondary hover:border-brand-light/30 disabled:bg-gray-50 shadow-sm hover:shadow-md"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-t-transparent border-brand-blue rounded-full animate-spin"></div>
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.657-3.356-11.303-8H6.306C9.656 39.663 16.318 44 24 44z" />
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.846 44 30.228 44 24c0-1.341-.138-2.65-.389-3.917z" />
              </svg>
            )}
            <span className="text-lg">Continuar con Google</span>
          </button>

          {formMessage && (
            <p className={`text-center text-sm mt-6 p-4 rounded-xl font-medium ${messageType === 'error' ? 'bg-red-50 text-brand-red border border-red-100' : 'bg-green-50 text-brand-green border border-green-100'}`}>
              {formMessage}
            </p>
          )}

          <p className="mt-8 text-xs text-brand-light/60">
            Al continuar, aceptas nuestros términos de servicio y políticas de privacidad.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
