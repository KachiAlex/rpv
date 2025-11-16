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
        },
        accent: {
          purple: '#8B5CF6',
          pink: '#EC4899',
          blue: '#3B82F6',
          teal: '#14B8A6',
          orange: '#F97316',
          amber: '#F59E0B'
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-brand': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-warm': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient-cool': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
      }
    }
  },
  plugins: []
} satisfies Config


