
/*
 * Este archivo contiene la configuración para la integración con Supabase.
 * Para un despliegue de producción real (como Cloud Run), estas claves DEBEN ser
 * reemplazadas por variables de entorno seguras.
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// --- PARA DESARROLLO Y DEMOSTRACIÓN ---
// Estas claves están hardcodeadas para que la aplicación funcione en este entorno de vista previa.
// NO SUBAS ESTAS CLAVES A UN REPOSITORIO PÚBLICO.
const supabaseUrl = "https://npoukowwhminfidgkriq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wb3Vrb3d3aG1pbmZpZGdrcmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MjAyOTEsImV4cCI6MjA2ODE5NjI5MX0.3EbO9Fg3Pj5fgEDixZbIGqe6rriAZhX7CjnrYBSceaM";


// En producción, la configuración se tomaría de variables de entorno, así:
// const supabaseUrl = process.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// La aplicación mostrará una pantalla de error si estas variables no están configuradas.
// Esta lógica se encuentra en el componente `App.tsx`.
export const supabase = supabaseUrl && supabaseAnonKey ? createClient<Database>(supabaseUrl, supabaseAnonKey) : null;


// Constantes de gamificación
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000];
export const EARLY_COMPLETION_BONUS_XP = 25;
