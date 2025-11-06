// supabase/functions/send-notification/index.ts

/*
 * =====================================================================================
 * !! IMPORTANTE: CONFIGURACIÓN FINAL DE SECRETS EN SUPABASE !!
 * =====================================================================================
 * Para que esto funcione, DEBES configurar los siguientes "Secrets" en tu panel de Supabase.
 *
 * CÓMO HACERLO:
 * Ve a tu proyecto de Supabase -> Edge Functions -> send-notification -> Settings -> Secrets
 *
 * Y configura los siguientes 5 secrets con tus valores:
 *
 * 1. SUPABASE_URL: La URL de tu proyecto de Supabase.
 *    (Ej: https://npoukowwhminfidgkriq.supabase.co)
 *
 * 2. SUPABASE_SERVICE_ROLE_KEY: La clave de servicio (service_role) de tu proyecto.
 *
 * 3. VAPID_PUBLIC_KEY: (La que generaste en tu terminal)
 *    BNwGnpUSIkrptf7RZtl-HTeZ9fimzqTtZMyRwVWj8mLVYcj7Di0-QCUBxCQqSLcy3LyMkQavAzt6wcWJT4oiYEE
 *
 * 4. VAPID_PRIVATE_KEY: (La que generaste en tu terminal)
 *    u9a518AQkNXHq55YKNvJzy2YHZDiF2nVbJOFVFUzD9E
 *
 * 5. VAPID_SUBJECT: (Usa tu email de contacto, SIN comillas)
 *    mailto:maxiuranga5@gmail.com
 *
 * ¡Asegúrate de que no haya espacios en blanco al copiar y pegar las claves!
 * =====================================================================================
 */
declare const Deno: any;

import { createClient } from 'npm:@supabase/supabase-js@^2.44.4';

// Enum de rol para autocontención
enum Role {
  ADMIN = 'administrador',
}

// Interfaz mínima para la suscripción
interface PushSubscription {
  endpoint: string;
  keys?: {
    p256dh: string;
    auth: string;
  };
}

// Cabeceras CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Helper para respuestas de error
const createErrorResponse = (message: string, status: number) => {
    console.error(`ERROR (${status}): ${message}`);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    });
};

// --- FUNCIÓN DE SERVIDOR PRINCIPAL ---
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- 1. VERIFICACIÓN DE SECRETS ---
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT');
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !VAPID_SUBJECT || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        return createErrorResponse('Function secrets are not configured correctly. Please check your Supabase Function settings.', 500);
    }

    // --- 2. AUTORIZACIÓN DEL USUARIO QUE LLAMA ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Missing Authorization header.', 401);
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
    });

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return createErrorResponse('Authorization failed. Invalid JWT.', 401);
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles').select('role').eq('id', user.id).single();

    if (profileError || !profile || profile.role !== Role.ADMIN) {
      return createErrorResponse('Permission denied. Only administrators can send notifications.', 403);
    }
    
    // --- 3. VALIDACIÓN DEL CUERPO ---
    const { technician_id, title, body } = await req.json();
    if (!technician_id || !title || !body) {
      return createErrorResponse('Missing required fields: technician_id, title, or body.', 400);
    }

    // --- 4. OBTENER SUSCRIPCIÓN DEL DESTINATARIO ---
    const { data: targetProfile, error: dbError } = await supabaseClient
      .from('profiles').select('push_subscription').eq('id', technician_id).single();

    if (dbError || !targetProfile?.push_subscription) {
      return createErrorResponse(`Subscription not found for technician ${technician_id}.`, 404);
    }

    const subscription = targetProfile.push_subscription as PushSubscription;
    if (!subscription.endpoint) {
      return createErrorResponse(`Subscription for technician ${technician_id} is malformed.`, 400);
    }

    // --- 5. ENVIAR NOTIFICACIÓN ---
    const webpush = (await import('npm:web-push@^3.6.7')).default;
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const payload = JSON.stringify({ 
      title, 
      body, 
      icon: 'https://npoukowwhminfidgkriq.supabase.co/storage/v1/object/public/iconos-equipamiento/cazco.png' 
    });
    
    await webpush.sendNotification(subscription, payload);

    return new Response(JSON.stringify({ success: true, message: 'Notification sent.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    let detailedError = 'An unexpected error occurred.';
    let status = 500;

    if (err && err.statusCode) { // Error de web-push
      status = err.statusCode;
      detailedError = `Push Service Error (${status}): ${err.body || 'No details'}`;
      if (status === 410) detailedError = 'The push subscription has expired or is no longer valid (410 Gone).';
      if (status === 403) detailedError += ' - This often means your VAPID keys are incorrect or mismatched in the Supabase secrets.';
    } else if (err instanceof SyntaxError) {
      status = 400;
      detailedError = "Invalid JSON in request body.";
    }
    
    return createErrorResponse(detailedError, status);
  }
});
