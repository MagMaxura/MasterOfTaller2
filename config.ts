
/*
 * Este archivo contiene la configuración para la integración con Supabase.
 * Para un despliegue de producción real (como Cloud Run), estas claves DEBEN ser
 * reemplazadas por variables de entorno seguras.
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// La ejecución del entorno espera variables de entorno via process.env.
// Para desarrollo local, un archivo puede proveer un fallback via el objeto window.
declare const process: any;
declare const window: any;

// --- Lógica de credenciales ---

// Función auxiliar para obtener las credenciales, priorizando el entorno.
const getSupabaseCredentials = () => {
    // Prioridad 1: Variables de entorno (para Vercel/producción).
    // Esta comprobación es más segura para entornos donde 'process' podría no estar definido.
    const envUrl = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_URL : undefined;
    const envKey = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_ANON_KEY : undefined;

    // Si las variables de entorno existen Y NO están vacías, úsalas.
    if (envUrl && envKey) {
        console.log("Usando credenciales de entorno (producción).");
        return { supabaseUrl: envUrl, supabaseAnonKey: envKey };
    }

    // Prioridad 2: Archivo de credenciales locales (para desarrollo).
    // Este archivo es cargado por index.html y no debe ser subido a Git.
    if (window.SUPABASE_LOCAL_CREDENTIALS) {
        console.warn("Usando credenciales locales de Supabase. Asegúrate de que esto no suceda en producción.");
        const localUrl = window.SUPABASE_LOCAL_CREDENTIALS.url;
        const localKey = window.SUPABASE_LOCAL_CREDENTIALS.key;
        
        // Validar que las claves del archivo local no sean los placeholders.
        if (localUrl && localKey && !localUrl.includes('xxxxxxxxxx') && !localKey.includes('eyxxxxxxxx')) {
            return { supabaseUrl: localUrl, supabaseAnonKey: localKey };
        } else {
            console.error("Las credenciales locales en 'public/supabase-credentials.js' no han sido configuradas o son inválidas.");
        }
    }

    // Si no se encuentra ninguna credencial válida
    return { supabaseUrl: null, supabaseAnonKey: null };
};

const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();


// La aplicación mostrará una pantalla de error si estas variables no están configuradas.
// Esta lógica se encuentra en el componente `App.tsx`.
export const supabase = supabaseUrl && supabaseAnonKey ? createClient<Database>(supabaseUrl, supabaseAnonKey) : null;


// Constantes de gamificación
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000];
export const EARLY_COMPLETION_BONUS_XP = 25;