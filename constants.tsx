// =====================================================================================
// !! CONFIGURACIÓN DE VARIABLES DE ENTORNO (VITE) !!
// =====================================================================================
// Los valores reales se encuentran en el archivo .env (local) o en los secretos
// de tu plataforma de despliegue.

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Credenciales para la base de datos secundaria de asistencia
export const ATTENDANCE_SUPABASE_URL = import.meta.env.VITE_ATTENDANCE_SUPABASE_URL;
export const ATTENDANCE_SUPABASE_ANON_KEY = import.meta.env.VITE_ATTENDANCE_SUPABASE_ANON_KEY;

// Esta es una clave pública, por lo que es seguro tenerla aquí.
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
