import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#07070f',
        surface: '#0f0f1a',
        border: '#1e1e30',
        primary: '#c084fc',    // neon purple
        secondary: '#38bdf8',  // neon cyan
        accent: '#f472b6',     // neon pink
        muted: '#6b7280',
        score: {
          high: '#34d399',     // emerald
          mid: '#fbbf24',      // amber
          low: '#f87171',      // red
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'glow-primary': 'radial-gradient(ellipse at center, rgba(192,132,252,0.15) 0%, transparent 70%)',
        'glow-accent': 'radial-gradient(ellipse at center, rgba(244,114,182,0.1) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(192,132,252,0.3)',
        'glow-md': '0 0 20px rgba(192,132,252,0.4)',
        'glow-accent': '0 0 20px rgba(244,114,182,0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}

export default config
