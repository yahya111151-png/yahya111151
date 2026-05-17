import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#fef6f7',
        surface: '#ffffff',
        border: '#fce7ec',
        primary: '#e8476a',    // rose/coral — Nosedive rating pink
        secondary: '#8b6ff7',  // soft purple
        accent: '#ff8fab',     // light pink
        muted: '#94a3b8',
        foreground: '#1c1b22', // dark text for light bg
        score: {
          high: '#16a34a',     // green
          mid: '#d97706',      // amber
          low: '#dc2626',      // red
        },
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'glow-primary': 'radial-gradient(ellipse at center, rgba(232,71,106,0.12) 0%, transparent 70%)',
        'glow-accent': 'radial-gradient(ellipse at center, rgba(255,143,171,0.1) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-sm': '0 2px 12px rgba(232,71,106,0.18)',
        'glow-md': '0 4px 24px rgba(232,71,106,0.25)',
        'glow-accent': '0 4px 20px rgba(255,143,171,0.25)',
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
