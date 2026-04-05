import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: '#0284c7',   // sky-600
          hover: '#0369a1',     // sky-700
          surface: '#f0f9ff',   // sky-50
          dark: '#0f172a',      // slate-900
          card: '#1e293b',      // slate-800
          cyan: '#0284c7',      // Re-map cyan variables
          purple: '#0ea5e9',    // Re-map purple
        }
      }
    },
  },
  plugins: [],
};
export default config;
