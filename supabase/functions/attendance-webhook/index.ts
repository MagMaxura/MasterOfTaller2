// supabase/functions/attendance-webhook/index.ts

import { createClient } from 'npm:@supabase/supabase-js@^2.44.4';

const ADMIN_ROLES = ['administrador', 'admin', 'ADMINISTRADOR', 'ADMIN', 'administrativo', 'ventas'];

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
        const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')?.trim();
        const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')?.trim();
        const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')?.trim();
        const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET')?.trim() || '';

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !WEBHOOK_SECRET) {
            return createErrorResponse('Function secrets are not configured correctly.', 500);
        }

        const payload = await req.json();
        const { userId, userName, type, timestamp, tardinessHours, earlyDepartureHours, overtimeHours, secret } = payload;

        if (secret !== WEBHOOK_SECRET) {
            return createErrorResponse('Unauthorized webhook call.', 401);
        }

        if (!userId || !type) {
            return createErrorResponse('Missing required fields.', 400);
        }

        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const eventDate = new Date(timestamp).toISOString().split('T')[0];

        // 1. OBTENER PERFIL VINCULADO
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('id, name, role')
            .eq('attendance_id', userId)
            .maybeSingle();

        if (profileError || !profile) {
            console.log(`Log ignored: No profile linked to attendance_id ${userId} (${userName})`);
            return new Response(JSON.stringify({ success: true, message: 'User not linked to main system.' }), { status: 200 });
        }

        const isEntry = type.toUpperCase() === 'IN' || type.toUpperCase() === 'ENTRADA';
        const isExit = type.toUpperCase() === 'OUT' || type.toUpperCase() === 'SALIDA';

        let actionLog = [];

        // 2. PROCESAR SEGÚN TIPO
        if (isEntry) {
            // ELIMINAR FALTA SI EXISTE
            const { error: delError } = await supabaseClient
                .from('eventos_nomina')
                .delete()
                .eq('user_id', profile.id)
                .eq('fecha_evento', eventDate)
                .eq('tipo', 'FALTA');
            
            if (!delError) actionLog.push('Falta auto-cleared');

            // REGISTRAR TARDANZA
            if (tardinessHours && tardinessHours > 0) {
                const { error: insError } = await supabaseClient
                    .from('eventos_nomina')
                    .insert({
                        user_id: profile.id,
                        tipo: 'TARDANZA',
                        monto: 0,
                        descripcion: `Tardanza: ${tardinessHours}h (Auto-registrada)`,
                        fecha_evento: eventDate
                    });
                if (!insError) actionLog.push('Tardanza recorded');
            }
        } else if (isExit) {
            // REGISTRAR SALIDA TEMPRANA
            if (earlyDepartureHours && earlyDepartureHours > 0) {
                await supabaseClient
                    .from('eventos_nomina')
                    .insert({
                        user_id: profile.id,
                        tipo: 'SALIDA_TEMPRANA',
                        monto: 0,
                        descripcion: `Salida Anticipada: ${earlyDepartureHours}h (Auto-registrada)`,
                        fecha_evento: eventDate
                    });
                actionLog.push('Salida anticipada recorded');
            }

            // REGISTRAR HORA EXTRA
            if (overtimeHours && overtimeHours > 0) {
                await supabaseClient
                    .from('eventos_nomina')
                    .insert({
                        user_id: profile.id,
                        tipo: 'HORA_EXTRA',
                        monto: 0,
                        descripcion: `Hora Extra: ${overtimeHours}h (Auto-registrada)`,
                        fecha_evento: eventDate
                    });
                actionLog.push('Hora extra recorded');
            }
        }

        // 3. ENVIAR NOTIFICACIÓN PUSH A ADMINS (Opcional pero recomendado)
        if (VAPID_SUBJECT && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
            try {
                const { data: admins } = await supabaseClient
                    .from('profiles')
                    .select('id, name, push_subscription')
                    .in('role', ADMIN_ROLES)
                    .not('push_subscription', 'is', null);

                if (admins && admins.length > 0) {
                    const webpush = (await import('npm:web-push@^3.6.7')).default;
                    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
                    
                    const title = isEntry ? '🔔 Nuevo Ingreso' : '🚪 Retiro de Usuario';
                    const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                    const notificationBody = `${profile.name} ha ${isEntry ? 'ingresado' : 'salido'} a las ${time}`;

                    await Promise.all(admins.map(async (admin) => {
                        try {
                            await webpush.sendNotification(
                                admin.push_subscription as any,
                                JSON.stringify({
                                    title,
                                    body: notificationBody,
                                    icon: '/icon-192x192.png',
                                    tag: 'attendance-notification',
                                    data: { url: '/admin' }
                                })
                            );
                        } catch (e) { console.error(`Failed push to ${admin.name}`); }
                    }));
                }
            } catch (pushErr) {
                console.error('Push notification error:', pushErr);
            }
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: `Processed ${type} for ${profile.name}`,
            actions: actionLog
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (err: any) {
        return createErrorResponse(err.message || 'Internal error', 500);
    }
});
