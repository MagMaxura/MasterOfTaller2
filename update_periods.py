import psycopg2
import sys

connection_string = "postgresql://postgres.npoukowwhminfidgkriq:estoesGRANDE333#@aws-0-sa-east-1.pooler.supabase.co:5432/postgres"

sql = "UPDATE public.periodos_pago SET estado = 'PAGADO', fecha_pago = NOW() WHERE fecha_inicio_periodo = '2026-03-21' AND fecha_fin_periodo = '2026-04-05' AND estado = 'CALCULADO';"

try:
    conn = psycopg2.connect(connection_string)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(sql)
    print(f"Updated {cur.rowcount} records.")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
