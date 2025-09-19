/*
 * Este archivo contiene la configuración para la integración con Supabase.
 * IMPORTANTE: Estos valores están hardcodeados para desarrollo y deben ser
 * reemplazados por variables de entorno seguras en producción.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// --- Inicialización Directa (Temporal para Desarrollo) ---
const supabaseUrl = 'https://npoukowwhminfidgkriq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wb3Vrb3d3aG1pbmZpZGdrcmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MjAyOTEsImV4cCI6MjA2ODE5NjI5MX0.3EbO9Fg3Pj5fgEDixZbIGqe6rriAZhX7CjnrYBSceaM';

// Se inicializa el cliente de Supabase directamente con los valores.
// Nota: La variable 'supabase' ahora se exporta como 'const' porque ya no necesita ser reinicializada.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Constantes de gamificación
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000];
export const EARLY_COMPLETION_BONUS_XP = 25;