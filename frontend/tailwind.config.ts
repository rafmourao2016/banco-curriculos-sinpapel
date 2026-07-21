import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          600: '#4338ca',
          700: '#3730a3',
        },
      },
    },
  },
  plugins: [],
};
export default config;
