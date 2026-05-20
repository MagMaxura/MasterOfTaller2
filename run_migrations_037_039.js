const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
    host: 'aws-0-sa-east-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.npoukowwhminfidgkriq',
    password: 'estoesGRANDE333#',
    ssl: { rejectUnauthorized: false }
});

const migrations = [
    '037_add_recurring_incomes.sql',
    '038_add_customer_tracking.sql',
    '039_add_permissions_system.sql',
];

async function run() {
    await client.connect();
    console.log('Conectado a Supabase.\n');

    for (const file of migrations) {
        const sql = fs.readFileSync(`supabase/migrations/${file}`, 'utf8');
        console.log(`Ejecutando ${file}...`);
        try {
            await client.query(sql);
            console.log(`  OK\n`);
        } catch (err) {
            if (err.message.includes('already exists')) {
                console.log(`  Ya existe, omitiendo.\n`);
            } else {
                console.error(`  ERROR: ${err.message}\n`);
            }
        }
    }

    await client.end();
    console.log('Listo.');
}

run().catch(err => { console.error(err); process.exit(1); });
