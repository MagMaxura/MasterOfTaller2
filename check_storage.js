import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Need service role key to manage buckets
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
    console.log("Checking buckets...");
    const { data: buckets, error: getError } = await supabase.storage.listBuckets();

    if (getError) {
        console.error("Error listing buckets:", getError?.message || getError);
        return;
    }

    console.log("Existing buckets:", buckets.map(b => b.name));

    const bucketNames = ['avatars', 'public-assets', 'iconos-equipamiento', 'milestone_photos'];

    for (const name of bucketNames) {
        if (!buckets.some(b => b.name === name)) {
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
