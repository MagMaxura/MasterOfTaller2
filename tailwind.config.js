/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#FFFFFF',       /* Background: Pure White */
        'brand-secondary': '#FAFAFA',     /* Secondary Background: Neutral 50 */
        'brand-accent': '#F0F0F0',        /* Borders: Neutral 100 */
        'brand-light': '#737373',         /* Secondary Text: Neutral 500 */
        'brand-highlight': '#171717',     /* Main Text: Neutral 900 */
        'brand-blue': '#2563EB',          /* Vibrant Blue */
        'brand-orange': '#F59E0B',        /* Vibrant Orange */
        'brand-green': '#10B981',         /* Vibrant Green */
        'brand-red': '#EF4444',           /* Vibrant Red */
        'slate-900': '#0F172A',           /* Used for Dark Modals */
        'slate-800': '#1E293B',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'premium': '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
