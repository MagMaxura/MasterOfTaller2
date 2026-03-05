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
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigration() {
    try {
        await client.connect();
        console.log("Conectado a la base de datos...");

        // 1. Listar todas las tablas en 'public'
        console.log("Listando tablas en el esquema 'public'...");
        const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log("Tablas encontradas:", tables.rows.map(r => r.table_name).join(', '));

        const tableExists = tables.rows.some(r => r.table_name === 'lunch_confirmations');

        if (!tableExists) {
            console.log("⚠️ La tabla 'lunch_confirmations' NO existe. Creándola...");
            await client.query(`
        CREATE TABLE public.lunch_confirmations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at TIMESTAMPTZ DEFAULT now(),
          user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          confirmed BOOLEAN DEFAULT false,
          UNIQUE(user_id, date)
        );
      `);
            console.log("✅ Tabla 'lunch_confirmations' creada con éxito.");
        } else {
            console.log("ℹ️ La tabla 'lunch_confirmations' ya existe.");

            // Intentar agregar el FK si no existe (por si acaso)
            console.log("Verificando restricción de clave foránea...");
            const checkConstraint = await client.query(`
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lunch_confirmations_user_id_fkey'
      `);

            if (checkConstraint.rowCount === 0) {
                await client.query(`
          ALTER TABLE public.lunch_confirmations
          ADD CONSTRAINT lunch_confirmations_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES profiles(id)
          ON DELETE CASCADE
        `);
                console.log("✅ Restricción de clave foránea añadida.");
            } else {
                console.log("ℹ️ La restricción ya existe.");
            }
        }

        // 3. Verificar tipo 'user_role'
        console.log("Verificando valor 'limpieza' en 'user_role'...");
        await client.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'limpieza'");
        console.log("✅ Rol 'limpieza' verificado.");

        console.log("🚀 Migración finalizada.");
    } catch (err) {
        console.error("❌ Error durante la migración:", err.message);
    } finally {
        await client.end();
    }
}

runMigration();
