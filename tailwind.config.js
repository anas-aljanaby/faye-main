/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#8c1c3e',
        'primary-hover': '#701631',
        'primary-light': '#fbe9ef',
        'primary-text': '#8c1c3e',
        'bg-page': '#fdfaf6',
        'bg-sidebar': '#fcf8f3',
        'bg-card': '#ffffff',
        'text-primary': '#1f2937',
        'text-secondary': '#6b7280',
      },
      fontFamily: {
        sans: ['Tajawal', 'sans-serif'],
      }
    }
  },
  plugins: [],
}

