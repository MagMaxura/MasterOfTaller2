
import React, { useState } from 'react';
import { WrenchIcon } from './Icons';
import { supabase } from '../config';

interface LoginScreenProps {
  authError?: string | null;
  onBypass?: (role: 'admin' | 'technician') => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ authError, onBypass }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormMessage(null);
    try {
      if (!supabase) throw new Error("Cliente Supabase no inicializado.");

      let error;
      if (isRegistering) {
        const res = await supabase.auth.signUp({ email, password });
        error = res.error;
        if (!error && res.data.user) {
          setMessageType('success');
          setFormMessage('Registro exitoso. Es posible que debas confirmar tu correo.');
          setLoading(false);
          return;
        }
      } else {
        const res = await supabase.auth.signInWithPassword({ email, password });
        error = res.error;
      }

      if (error) throw error;
    } catch (err: any) {
      setMessageType('error');
      setFormMessage(err.message || (isRegistering ? 'Error al registrarse.' : 'Credenciales inválidas.'));
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

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white border border-brand-accent text-brand-highlight font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:bg-brand-secondary hover:border-brand-light/30 disabled:bg-gray-50 shadow-sm hover:shadow-md"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-t-transparent border-brand-blue rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.657-3.356-11.303-8H6.306C9.656 39.663 16.318 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.846 44 30.228 44 24c0-1.341-.138-2.65-.389-3.917z" />
                </svg>
              )}
              <span className="text-base">Continuar con Google</span>
            </button>

            <div className="flex items-center gap-4 my-6">
              <div className="h-px bg-brand-accent/50 flex-1"></div>
              <span className="text-[10px] uppercase font-black text-brand-light tracking-widest">o con tu email</span>
              <div className="h-px bg-brand-accent/50 flex-1"></div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                className="w-full bg-brand-secondary border border-brand-accent p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Contraseña"
                className="w-full bg-brand-secondary border border-brand-accent p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-blue text-white font-black py-3 rounded-xl shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? (isRegistering ? 'Registrando...' : 'Iniciando...') : (isRegistering ? 'Registrarse' : 'Iniciar Sesión')}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setFormMessage(null);
                }}
                className="text-xs font-bold text-brand-blue hover:text-brand-highlight transition-colors"
              >
                {isRegistering ? '¿Ya tienes una cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
              </button>
            </div>
          </div>

          {formMessage && (
            <p className={`text-center text-xs mt-6 p-3 rounded-xl font-bold uppercase tracking-tight ${messageType === 'error' ? 'bg-red-50 text-brand-red border border-red-100' : 'bg-green-50 text-brand-green border border-green-100'}`}>
              {formMessage}
            </p>
          )}

          <p className="mt-8 text-[10px] text-brand-light/60 font-medium uppercase tracking-wider">
            Al continuar, aceptas nuestros términos de servicio y políticas de privacidad.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
