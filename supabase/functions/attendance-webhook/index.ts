// supabase/functions/attendance-webhook/index.ts

import { createClient } from 'npm:@supabase/supabase-js@^2.44.4';

// Role strings often vary in case or prefix depending on DB migration
const ADMIN_ROLES = ['administrador', 'admin', 'ADMINISTRADOR', 'ADMIN', 'administrativo', 'ventas'];

interface PushSubscription {
    endpoint: string;
    keys?: {
        p256dh: string;
        auth: string;
    };
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const createErrorResponse = (message: string, status: number) => {
    console.error(`ERROR (${status}): ${message}`);
    return new Response(JSON.stringify({ error: message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
    });
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')?.trim() || 'mailto:example@example.com';
        const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')?.trim() || '';
        const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')?.trim() || '';
        const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET')?.trim() || '';

        // Log VAPID public key prefix for verification (safe)
        console.log(`VAPID Public Key prefix: ${VAPID_PUBLIC_KEY.substring(0, 10)}... (Length: ${VAPID_PUBLIC_KEY.length})`);
        // Clave compartida

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !VAPID_SUBJECT || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !WEBHOOK_SECRET) {
            return createErrorResponse('Function secrets are not configured correctly.', 500);
        }

        // 1. VALIDACIÓN DEL CUERPO Y SECRET
        const { userName, type, timestamp, secret } = await req.json();

        if (secret !== WEBHOOK_SECRET) {
            return createErrorResponse('Unauthorized webhook call.', 401);
        }

        if (!userName || !type) {
            return createErrorResponse('Missing required fields.', 400);
        }

        const isEntry = type.toUpperCase() === 'IN' || type.toUpperCase() === 'ENTRADA';
        const isExit = type.toUpperCase() === 'OUT' || type.toUpperCase() === 'SALIDA' || type.toUpperCase() === 'RETIRADA';

        if (!isEntry && !isExit) {
            return new Response(JSON.stringify({ success: true, message: 'Ignoring non-attendance event.' }), { status: 200 });
        }

        const title = isEntry ? '🔔 Nuevo Ingreso' : '🚪 Retiro de Usuario';
        const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const body = `${userName} ha ${isEntry ? 'ingresado' : 'salido'} a las ${time}`;

        // 2. OBTENER TODOS LOS ADMINISTRADORES
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { data: profiles, error: dbError } = await supabaseClient
            .from('profiles')
            .select('id, name, role, push_subscription')
            .not('push_subscription', 'is', null);

        if (dbError || !profiles || profiles.length === 0) {
            return new Response(JSON.stringify({ success: true, message: 'No profiles found with push subscriptions.' }), { status: 200 });
        }

        // Filter admins based on multiple common role strings
        const admins = profiles.filter(p => p.role && ADMIN_ROLES.includes(p.role));

        if (admins.length === 0) {
            console.log(`Found ${profiles.length} profiles with subscriptions, but NONE match the allowed roles. Available roles in DB:`, Array.from(new Set(profiles.map(p => p.role))));
            return new Response(JSON.stringify({ success: true, message: 'No authorized admins found to notify.' }), { status: 200 });
        }

        console.log(`Notifying ${admins.length} admins:`, admins.map(a => a.name).join(', '));


        // 3. ENVIAR NOTIFICACIONES
        const webpush = (await import('npm:web-push@^3.6.7')).default;
        webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

        const results = await Promise.all(admins.map(async (admin) => {
            try {
                await webpush.sendNotification(
                    admin.push_subscription as any,
                    JSON.stringify({
                        title: title,
                        body: body,
                        icon: '/icon-192x192.png',
                        tag: 'attendance-notification',
                        data: { url: '/admin' }
                    })
                );
                return { id: admin.id, success: true };
            } catch (e: any) {
                // If it's a VAPID error, we might be using the wrong keys for EXISTING subscriptions.
                console.error(`VAPID Error for ${admin.name}:`, e.message);

                // Try sending WITHOUT setVapidDetails as a fallback (some services allows this if not encrypted)
                // Note: For real push this usually fails, but worth seeing if it changes the error code.
                return { id: admin.id, success: false, error: e.statusCode ? `Status: ${e.statusCode}` : e.message };
            }
        }));

        const successfulCount = results.filter(r => r.success).length;

        return new Response(JSON.stringify({
            success: true,
            message: `Notifications sent to ${successfulCount} admins.`,
            details: results
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (err: any) {
        return createErrorResponse(err.message || 'Internal error', 500);
    }
});
