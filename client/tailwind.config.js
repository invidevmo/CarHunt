/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tactical: {
          dark: '#0d1117',
          card: '#161b22',
          border: '#30363d',
          accent: '#1f6feb',
          danger: '#f85149',
          success: '#2ea043',
          warning: '#d29922',
          hider: '#a371f7',
          seeker: '#38bdf8'
        }
      },
      animation: {
        'radar-sweep': 'sweep 4s linear infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.6', transform: 'scale(1.05)' },
        }
      }
    },
  },
  plugins: [],
}
