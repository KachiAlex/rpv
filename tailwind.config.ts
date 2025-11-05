import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#111827',
          50: '#F5F7FF',
          100: '#EAEFFF',
          200: '#CDD9FF',
          300: '#A9BEFF',
          400: '#7D98FF',
          500: '#4C6BFF',
          600: '#2E4DDB',
          700: '#223BB0',
          800: '#1B2F8A',
          900: '#16266E'
        }
      }
    }
  },
  plugins: []
} satisfies Config


