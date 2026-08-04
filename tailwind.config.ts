import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sacra: {
          cream: '#F5EFE4',
          sand: '#E7DCC8',
          gold: '#C0955A',
          'gold-light': '#D4AD72',
          'gold-dark': '#9A7540',
          coffee: '#3E2A1B',
          'coffee-light': '#5C3D28',
          'coffee-dark': '#2A1B0F',
          brown: '#6B4C2A',
        },
      },
      fontFamily: {
        heading: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['Jost', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'sacra-gradient': 'linear-gradient(135deg, #3E2A1B 0%, #5C3D28 50%, #3E2A1B 100%)',
        'gold-gradient': 'linear-gradient(135deg, #9A7540 0%, #C0955A 50%, #D4AD72 100%)',
      },
    },
  },
  plugins: [],
}

export default config
