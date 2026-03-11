import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

function getEnv() {
    try {
        const envFile = fs.readFileSync('.env', 'utf8');
        const env: any = {};
        envFile.split('\n').forEach(line => {
            const [key, ...values] = line.split('=');
            if (key && values.length > 0) {
                env[key.trim()] = values.join('=').trim().replace(/['"]/g, '');
            }
        });
        return env;
    } catch (e) {
        return {};
    }
}

const env = getEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log("No supabase config found");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
    console.log("Checking buckets...");
    const { data: buckets, error: getError } = await supabase.storage.listBuckets();

    if (getError) {
        console.error("Error listing buckets:", getError?.message || getError);
        return;
    }

    console.log("Existing buckets:", buckets.map((b: any) => b.name));

    const bucketNames = ['avatars', 'public-assets', 'iconos-equipamiento', 'milestone_photos'];

    for (const name of bucketNames) {
        if (!buckets.some((b: any) => b.name === name)) {
            console.log(`Creating bucket ${name}...`);
            const { error: createError } = await supabase.storage.createBucket(name, { public: true });
            if (createError) {
                console.error(`Error creating bucket ${name}:`, createError?.message || createError);
            } else {
                console.log(`Bucket ${name} created successfully.`);
            }
        } else {
            // Ensure public
            await supabase.storage.updateBucket(name, { public: true });
            console.log(`Bucket ${name} already exists and is updated to public.`);
        }
    }
}

checkStorage();
