// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        colors: {
          border: 'hsl(var(--border))',
          background: 'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
        },
        animation: {
          'spin-slow': 'spin 2s linear infinite',
          'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }
      },
    },
    plugins: [],
  }