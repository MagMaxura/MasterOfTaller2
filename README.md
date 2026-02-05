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
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
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
