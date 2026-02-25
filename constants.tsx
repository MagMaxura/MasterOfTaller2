// =====================================================================================
// !! ATENCIÓN: POSIBLE ERROR DE CONFIGURACIÓN DE SUPABASE !!
// =====================================================================================
// La aplicación está fallando al conectarse a Supabase. La causa más probable es
// que la URL del proyecto a continuación sea incorrecta o el proyecto esté pausado.
//
// POR FAVOR, VERIFICA que los siguientes valores coincidan EXACTAMENTE con los de
// tu panel de Supabase en "Configuración del Proyecto > API".
// =====================================================================================

export const SUPABASE_URL = 'https://npoukowwhminfidgkriq.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wb3Vrb3d3aG1pbmZpZGdrcmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MjAyOTEsImV4cCI6MjA2ODE5NjI5MX0.3EbO9Fg3Pj5fgEDixZbIGqe6rriAZhX7CjnrYBSceaM';

// Credenciales para la base de datos secundaria de asistencia
export const ATTENDANCE_SUPABASE_URL = 'https://aamxydvzgwadhhrqxkkr.supabase.co';
export const ATTENDANCE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhbXh5ZHZ6Z3dhZGhocnF4a2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzI1MzUsImV4cCI6MjA4NzQ0ODUzNX0.no13RPUAx5ospdfKXujc1a8Q7ij7JZfO4va1h9Tky3k';

// Esta es una clave pública, por lo que es seguro tenerla aquí.
// Debe coincidir con la que está en `supabase/functions/send-notification/index.ts`.
export const VAPID_PUBLIC_KEY = 'BNwGnpUSIkrptf7RZtl-HTeZ9fimzqTtZMyRwVWj8mLVYcj7Di0-QCUBxCQqSLcy3LyMkQavAzt6WcWJT4oIyEE';
