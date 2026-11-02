/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          dark: '#070a13',
          card: 'rgba(11, 16, 32, 0.88)',
          cardBorder: 'rgba(255, 255, 255, 0.12)',
          accentCyan: '#38bdf8',
          accentGold: '#fbbf24',
          accentGreen: '#34d399',
          accentPink: '#f43f5e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        math: ['KaTeX_Math', 'Cambria Math', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(56, 189, 248, 0.4)',
        'glow-gold': '0 0 25px -5px rgba(251, 191, 36, 0.4)',
        'studio-card': '0 20px 50px rgba(0, 0, 0, 0.65)'
      }
    },
  },
  plugins: [],
}

