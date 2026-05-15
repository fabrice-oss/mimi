/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pearl: '#FFFAFB',
        blush: {
          50:  '#FFF0F3',
          100: '#FFE4EE',
          200: '#FFD6E7',
          300: '#FFB3C6',
          400: '#FF8FAB',
          500: '#FF6B8E',
          600: '#FF4D6D',
          700: '#E63355',
        },
        petal: {
          50:  '#FDF4FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
        },
        gold: {
          50:  '#FFFBEB',
          100: '#FDF0C0',
          200: '#F7D060',
          300: '#F0B429',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
      },
      boxShadow: {
        'glass':    '0 8px 32px rgba(255,143,171,0.12), inset 0 1px 0 rgba(255,255,255,0.7)',
        'glass-lg': '0 20px 60px rgba(255,143,171,0.18), inset 0 1px 0 rgba(255,255,255,0.8)',
        'glass-xl': '0 32px 80px rgba(255,143,171,0.22), inset 0 1px 0 rgba(255,255,255,0.9)',
        'rose-sm':  '0 4px 16px rgba(255,107,142,0.2)',
        'rose-md':  '0 8px 32px rgba(255,107,142,0.25)',
      },
      backdropBlur: {
        xs: '4px',
      },
      animation: {
        'float':       'float 7s ease-in-out infinite',
        'float-slow':  'float 10s ease-in-out infinite',
        'float-fast':  'float 5s ease-in-out infinite',
        'shimmer':     'shimmer 2.5s linear infinite',
        'pulse-soft':  'pulseSoft 3s ease-in-out infinite',
        'slide-up':    'slideUp 0.5s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':     'fadeIn 0.4s ease',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%':     { transform: 'translateY(-18px) rotate(1deg)' },
          '66%':     { transform: 'translateY(-8px) rotate(-1deg)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        pulseSoft: {
          '0%,100%': { opacity: '0.5' },
          '50%':     { opacity: '0.9' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
