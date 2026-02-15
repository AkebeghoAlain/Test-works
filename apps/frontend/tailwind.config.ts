import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#008751',
          600: '#006b41',
          accent: '#f9a825'
        }
      }
    }
  },
  plugins: []
} satisfies Config;
