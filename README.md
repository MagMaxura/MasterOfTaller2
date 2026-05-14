<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/18DpiBjm2EKSuSke6b4G-r28K_9_UNbFt

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `VITE_GEMINI_API_KEY` in your `.env`/`.env.local` to your Gemini API key
3. Run the app:
   `npm run dev`

## Contexto de Despliegue y Acceso
*Referencia para el Asistente AI*

Este proyecto tiene las siguientes características de infraestructura:
*   **Despliegue:** Automático en **Vercel** conectado al repositorio de GitHub.
*   **Repositorio:** GitHub (Sincronizado via local git push).
*   **Base de Datos:** Supabase.
*   **Acceso del Asistente:**
    *   **Código:** Acceso completo local + push a GitHub.
    *   **Supabase:** Credenciales públicas (Anon Key) disponibles en `config.ts` / `constants.tsx`. NO hay acceso directo a SQL (Service Role Key no disponible), por lo que las migraciones o correcciones de datos deben hacerse vía Frontend (autenticado como Admin) o Scripts manuales del usuario.

**Nota:** Cualquier cambio subido a GitHub (`git push`) disparará un nuevo deploy en Vercel, lo cual puede tomar unos minutos en reflejarse en producción.

## Reglas de Negocio — Asistencia y Nómina

### Períodos de Pago (Quincenas)
- **Quincena 1:** del día **6 al 20** de cada mes.
- **Quincena 2:** del día **21 al 5** del mes siguiente.

### Regla de Falta por Ausencia
Un día hábil se descuenta como **Falta** cuando se cumplen TODAS estas condiciones:
1. El día ya transcurrió (nunca se descuentan días futuros).
2. El usuario no registró ningún ingreso en el sistema de asistencia.
3. La hora de corte ya pasó:
   - **Corte por defecto: 13:00 hs.** — si el usuario no fichó ingreso antes de las 13:00, el día se marca como falta.
   - **Excepción:** si el horario de inicio configurado para el usuario es posterior a las 13:00, se usa ese horario como corte en lugar del predeterminado.
4. El día no es fin de semana, feriado ni vacación aprobada.

### Lógica de Generación Automática
- **Frontend (`reconcilePeriodAttendance`):** Al sincronizar un período, cruza logs del sistema de asistencia con eventos de nómina. Nunca procesa fechas futuras ni la fecha actual antes de las 13:00.
- **Cron SQL (`generate_daily_absences`):** Se ejecuta a las 00:01 AM UTC procesando el día **anterior** (`CURRENT_DATE - 1`). Genera faltas como placeholder; el reconciliador del frontend las corrige contra los logs reales.
