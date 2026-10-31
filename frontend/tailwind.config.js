/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        soc: {
          bg: '#070A11',
          card: '#0F172A',
          border: '#1E293B',
          muted: '#64748B',
          accent: '#06B6D4',
          accentGlow: 'rgba(6, 182, 212, 0.15)',
          critical: '#EF4444',
          high: '#F97316',
          medium: '#FBBF24',
          low: '#10B981'
        }
      }
    },
  },
  plugins: [],
}

