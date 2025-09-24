/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dnd-gold': '#D4AF37',
        'dnd-red': '#8B0000',
        'dnd-dark': '#1a1a1a',
        'dnd-darker': '#0d0d0d',
      },
      fontFamily: {
        'fantasy': ['Cinzel', 'serif'],
      },
    },
  },
  plugins: [],
}




