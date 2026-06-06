/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#2D2D2D',
          dark: '#1A1A1A',
          light: '#3D3D3D'
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E8CC6A',
          dark: '#B8960F',
          muted: '#C9A84C'
        },
        cream: {
          DEFAULT: '#F5F0E8',
          dark: '#E8E0CE',
          muted: '#D9D0BB'
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        gold: '0 0 20px rgba(212, 175, 55, 0.3)',
        'gold-lg': '0 0 40px rgba(212, 175, 55, 0.4)'
      }
    }
  },
  plugins: []
};
