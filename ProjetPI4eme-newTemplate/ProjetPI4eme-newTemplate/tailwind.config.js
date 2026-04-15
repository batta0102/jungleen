/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f7ede2',
        primary: '#2d5757',
        secondary: '#6b7280',
        accent: '#2d5757',
        border: '#d1d5db',
        text: '#1f2937',
        light: '#f9fafb',
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
