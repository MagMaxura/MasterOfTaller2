const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const getEnv = (key) => {
    const match = env.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testSql() {
    const queries = [
        { name: 'exec_sql', params: { sql_query: "SELECT 1" } },
        { name: 'run_sql', params: { sql: "SELECT 1" } },
        { name: 'execute_sql', params: { query: "SELECT 1" } }
    ];

    for (const q of queries) {
        console.log(`Testing RPC '${q.name}'...`);
        const { data, error } = await supabase.rpc(q.name, q.params);
        if (error) {
            console.log(`  FAILED: ${error.message}`);
        } else {
            console.log(`  SUCCESS! RPC '${q.name}' works.`);
            console.log(`  Data:`, data);
            return;
        }
    }
    console.log("No common SQL execution RPC found.");
}

testSql();
