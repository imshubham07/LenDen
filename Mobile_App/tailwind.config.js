/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: '#061B35',
        leaf: '#84EA2F',
        sky: '#14A8F5',
        paper: '#F6FAF4',
      },
    },
  },
  plugins: [],
};
