const { Client } = require('pg');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const getEnv = (key) => {
    const match = env.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const projectRef = supabaseUrl.match(/https:\/\/(.*)\.supabase\.co/)[1];
const dbPassword = 'estoesGRANDE333#';

const connectionString = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function fixStorage() {
    try {
        await client.connect();
        console.log("Conectado a la base de datos...");

        const queries = [
            `INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO UPDATE SET public = true;`,
            `INSERT INTO storage.buckets (id, name, public) VALUES ('public-assets', 'public-assets', true) ON CONFLICT (id) DO UPDATE SET public = true;`,
            `INSERT INTO storage.buckets (id, name, public) VALUES ('iconos-equipamiento', 'iconos-equipamiento', true) ON CONFLICT (id) DO UPDATE SET public = true;`,
            `INSERT INTO storage.buckets (id, name, public) VALUES ('milestone_photos', 'milestone_photos', true) ON CONFLICT (id) DO UPDATE SET public = true;`,
        ];

        for (const bucket of ['avatars', 'public-assets', 'iconos-equipamiento', 'milestone_photos']) {
            queries.push(`
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_policies WHERE policyname = 'Public Access ${bucket}' AND tablename = 'objects' AND schemaname = 'storage'
                    ) THEN
                        CREATE POLICY "Public Access ${bucket}" ON storage.objects FOR SELECT USING (bucket_id = '${bucket}');
                    END IF;
                    
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_policies WHERE policyname = 'Auth Upload ${bucket}' AND tablename = 'objects' AND schemaname = 'storage'
                    ) THEN
                        CREATE POLICY "Auth Upload ${bucket}" ON storage.objects FOR INSERT WITH CHECK (bucket_id = '${bucket}' AND auth.role() = 'authenticated');
                    END IF;
                    
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_policies WHERE policyname = 'Auth Update ${bucket}' AND tablename = 'objects' AND schemaname = 'storage'
                    ) THEN
                        CREATE POLICY "Auth Update ${bucket}" ON storage.objects FOR UPDATE USING (bucket_id = '${bucket}' AND auth.role() = 'authenticated');
                    END IF;
                    
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_policies WHERE policyname = 'Auth Delete ${bucket}' AND tablename = 'objects' AND schemaname = 'storage'
                    ) THEN
                        CREATE POLICY "Auth Delete ${bucket}" ON storage.objects FOR DELETE USING (bucket_id = '${bucket}' AND auth.role() = 'authenticated');
                    END IF;
                END
                $$;
            `);
        }

        for (const q of queries) {
            await client.query(q);
        }

        console.log("✅ Storage buckets and policies created/updated successfully.");
    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await client.end();
    }
}

fixStorage();
