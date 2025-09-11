/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      gridTemplateColumns: {
        'auto-fit-minmax-45px': 'repeat(auto-fit, minmax(45px, 1fr))',
      }
    },
  },
  plugins: [],
  darkMode: 'class', // add this line
}

