import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f6ff',
          100: '#dbeafe',
          600: '#116dff',
          700: '#0b56cc',
        },
        paper: '#fcf7f0',
        sinred: '#d10606',
        singreen: '#36633c',
      },
    },
  },
  plugins: [],
};
export default config;
