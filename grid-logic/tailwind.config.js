/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bgStart: 'rgb(var(--bg-start) / <alpha-value>)', 
        bgEnd: 'rgb(var(--bg-end) / <alpha-value>)', 
        surface: 'rgb(var(--surface) / <alpha-value>)', 
        surfaceAlt: 'rgb(var(--surface-alt) / <alpha-value>)', 
        primary: 'rgb(var(--primary) / <alpha-value>)', 
        primaryDark: 'rgb(var(--primary-dark) / <alpha-value>)', 
        primaryGlow: 'rgb(var(--primary) / 0.4)',
        danger: 'rgb(var(--danger) / <alpha-value>)', 
        dangerDark: 'rgb(var(--danger-dark) / <alpha-value>)', 
        textMain: '#f8fafc',
        textMuted: '#a1a1aa', 
      },
      animation: {
        'pop': 'pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shake': 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-2px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(3px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-5px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(5px, 0, 0)' }
        }
      }
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide')
  ],
}
