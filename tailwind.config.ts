import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}'
  ],
  theme: {
    screens: {
      // Mobile-first breakpoints (min-width approach)
      'xs': '320px',   // Mobile small
      'sm': '480px',   // Mobile large  
      'md': '768px',   // Tablet portrait
      'lg': '1024px',  // Tablet landscape/Desktop
      'xl': '1280px',  // Desktop large
      '2xl': '1440px', // Desktop ultra-wide
      'ultrawide': '1600px',
      
      // Max-width breakpoints for mobile-first design
      'max-xs': {'max': '479px'},   // Mobile small only
      'max-sm': {'max': '767px'},   // Mobile only
      'max-md': {'max': '1023px'},  // Tablet and below
      'max-lg': {'max': '1279px'},  // Desktop small and below
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '2.5rem',
        '2xl': '3rem',
      },
      screens: {
        sm: '100%',
        md: '95%',
        lg: '90%',
        xl: '90%',
        '2xl': '1600px',
      },
    },
    extend: {
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
        '38': '9.5rem',
        // Mobile-optimized spacing
        '11': '2.75rem',  // 44px - minimum touch target
        '13': '3.25rem',  // 52px - comfortable touch target
        '15': '3.75rem',  // 60px - large touch target
        // Responsive spacing scale for consistent proportions
        'responsive-xs': 'clamp(0.5rem, 2vw, 1rem)',
        'responsive-sm': 'clamp(0.75rem, 3vw, 1.25rem)',
        'responsive-md': 'clamp(1rem, 4vw, 1.5rem)',
        'responsive-lg': 'clamp(1.5rem, 5vw, 2rem)',
        'responsive-xl': 'clamp(2rem, 6vw, 2.5rem)',
        'responsive-2xl': 'clamp(2.5rem, 7vw, 3rem)',
      },
      minHeight: {
        'touch': '44px',      // Minimum touch target height
        'touch-lg': '48px',   // Large touch target height
        'touch-xl': '52px',   // Extra large touch target height
      },
      minWidth: {
        'touch': '44px',      // Minimum touch target width
        'touch-lg': '48px',   // Large touch target width
        'touch-xl': '52px',   // Extra large touch target width
      },
      maxWidth: {
        'container': '1600px',
        'container-desktop': '1200px',
        'container-ultrawide': '1600px',
        '8xl': '88rem',
        '9xl': '96rem',
      },
      gridTemplateColumns: {
        'auto-fit-cards': 'repeat(auto-fit, minmax(280px, 1fr))',
        'auto-fit-cards-lg': 'repeat(auto-fit, minmax(320px, 1fr))',
        'responsive-auto': 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
      },
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
      width: {
        'responsive-container': 'clamp(100%, 90vw, 1600px)',
        'responsive-desktop': 'clamp(100%, 90vw, 1200px)',
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


