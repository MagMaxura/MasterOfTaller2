
/*
 * Este archivo contiene la configuración para la integración con Supabase.
 * Para un despliegue de producción real (como Cloud Run), estas claves DEBEN ser
 * reemplazadas por variables de entorno seguras.
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// The execution environment is expected to provide environment variables via process.env.
// For this to work in a browser environment, a build tool must replace these variables.
declare const process: any;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// La aplicación mostrará una pantalla de error si estas variables no están configuradas.
// Esta lógica se encuentra en el componente `App.tsx`.
export const supabase = supabaseUrl && supabaseAnonKey ? createClient<Database>(supabaseUrl, supabaseAnonKey) : null;


// Constantes de gamificación
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000];
export const EARLY_COMPLETION_BONUS_XP = 25;
