/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './apps/mini-app/src/**/*.{js,ts,jsx,tsx}',
    './packages/ui-components/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        vendy: {
          primary: '#FF7403',
          'primary-hover': '#E66800',
          'primary-light': '#FF9A4D',
          bg: '#000000',
          'bg-elevated': '#1C1C1E',
          'bg-secondary': '#2C2C2E',
          'text-primary': '#FFFFFF',
          'text-secondary': '#8E8E93',
          'text-tertiary': '#48484A',
          success: '#34C759',
          danger: '#FF3B30',
          warning: '#FF9500',
          info: '#0A84FF',
          border: '#38383A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'vendy-card': '12px',
        'vendy-button': '8px',
        'vendy-input': '8px',
      },
      spacing: {
        'vendy-card': '16px',
        'vendy-gap': '8px',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
