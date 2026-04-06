import psycopg2
import sys

connection_string = "postgresql://postgres.npoukowwhminfidgkriq:estoesGRANDE333#@aws-0-sa-east-1.pooler.supabase.co:5432/postgres"

sql = "SELECT id, fecha_inicio_periodo, fecha_fin_periodo, estado, monto_final_a_pagar, fecha_pago FROM public.periodos_pago ORDER BY fecha_inicio_periodo DESC LIMIT 10;"

try:
    conn = psycopg2.connect(connection_string)
    cur = conn.cursor()
    cur.execute(sql)
    rows = cur.fetchall()
    
    print("Recent Payment Periods:")
    print("ID | Start | End | Status | Final $ | Paid Date")
    print("-" * 80)
    for row in rows:
        print(f"{row[0]} | {row[1]} | {row[2]} | {row[3]} | {row[4]} | {row[5]}")
    
    cur.close()
    conn.close()
except psycopg2.Error as e:
    print(f"PostgreSQL error: {e}")
except Exception as e:
    print(f"Error: {e}")
