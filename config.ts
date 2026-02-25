/*
 * Este archivo contiene la configuración para la integración con Supabase.
 * IMPORTANTE: Estos valores se gestionan ahora centralmente en `constants.ts`.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    ATTENDANCE_SUPABASE_URL,
    ATTENDANCE_SUPABASE_ANON_KEY
} from './constants';

// Se obtienen las credenciales del archivo de constantes.
const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

// Verificación para asegurar que las constantes están definidas.
if (!supabaseUrl || !supabaseAnonKey || !ATTENDANCE_SUPABASE_URL || !ATTENDANCE_SUPABASE_ANON_KEY) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'background: #ff476f; color: white; padding: 20px; text-align: center; font-family: sans-serif;';
    errorDiv.innerHTML = '<h1>Error de Configuración</h1><p>Las credenciales de Supabase no están definidas. Por favor, revisa el archivo <code>constants.tsx</code> y asegúrate de que todas las claves de Supabase estén correctamente configuradas.</p>';
    document.body.innerHTML = '';
    document.body.appendChild(errorDiv);
    throw new Error("Las credenciales de Supabase no están definidas en constants.tsx");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Cliente para la base de datos de asistencia
// IMPORTANTE: Se deshabilita la persistencia de sesión para evitar conflictos con el cliente principal.
// Ambos comparten el mismo localStorage por defecto si no se configura.
export const supabaseAttendance = createClient(ATTENDANCE_SUPABASE_URL, ATTENDANCE_SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

/**
 * Construye una URL pública para un archivo en Supabase Storage.
 * @param bucket - El nombre del bucket (ej: 'iconos-equipamiento').
 * @param path - La ruta del archivo dentro del bucket.
 * @returns La URL pública completa del archivo.
 */
export const getStorageUrl = (bucket: string, path: string): string => {
    // Asegurarse de que el path no tenga un slash al principio
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
};


// Constantes de gamificación
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000];
export const EARLY_COMPLETION_BONUS_XP = 25;
