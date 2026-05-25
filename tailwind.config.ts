import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0d0823',         // very dark purple background
        surface: '#1a1035',    // dark card surface
        border: '#2d2052',     // subtle purple border
        primary: '#FFD700',    // gold — Lens brand accent
        secondary: '#2D1B69',  // deep brand purple
        accent: '#a78bfa',     // light purple for secondary text/icons
        muted: '#9ca3af',
        foreground: '#e5e7eb', // light text for dark bg
        score: {
          high: '#34d399',     // emerald green
          mid: '#fbbf24',      // amber
          low: '#f87171',      // red
        },
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'glow-primary': 'radial-gradient(ellipse at center, rgba(255,215,0,0.10) 0%, transparent 70%)',
        'glow-accent':  'radial-gradient(ellipse at center, rgba(167,139,250,0.10) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-sm':    '0 2px 12px rgba(255,215,0,0.18)',
        'glow-md':    '0 4px 24px rgba(255,215,0,0.28)',
        'glow-accent':'0 4px 20px rgba(167,139,250,0.22)',
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
