/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        soc: {
          bg: '#070A11',
          panel: '#0B0F19',
          card: '#0F172A',
          cardHover: '#162036',
          border: '#1E293B',
          borderSubtle: '#152033',
          muted: '#64748B',
          accent: '#06B6D4',
          accentGlow: 'rgba(6, 182, 212, 0.15)',
          critical: '#EF4444',
          high: '#F97316',
          medium: '#FBBF24',
          low: '#10B981'
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.25)',
        'glow-red': '0 0 30px -5px rgba(239, 68, 68, 0.3)',
        'panel': '0 4px 20px -2px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}

