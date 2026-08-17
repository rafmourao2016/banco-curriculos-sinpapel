import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fbf4ed',
          100: '#f1dfd6',
          600: '#6b3b31',
          700: '#4a2924',
        },
        paper: '#fbf4ed',
        sinred: '#ef2f3a',
        singreen: '#6b3b31',
      },
    },
  },
  plugins: [],
};
export default config;
