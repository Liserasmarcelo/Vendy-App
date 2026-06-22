/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        vendy: {
          primary: '#FF7403',
          'primary-dark': '#E56800',
          black: '#000000',
          'dark-1': '#1c1c1e',
          'dark-2': '#2c2c2e',
          white: '#ffffff',
          'gray-1': '#8e8e93',
          'gray-2': '#636366',
          success: '#34c759',
          danger: '#ff3b30',
          warning: '#ff9500',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'telegram': '12px',
        'button': '8px',
      },
    },
  },
  plugins: [],
};
