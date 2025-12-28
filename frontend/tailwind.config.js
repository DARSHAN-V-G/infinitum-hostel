/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        // Theme primary colors (purple/pink gradient)
        'theme': {
          'purple-primary': '#9333ea',    // purple-600
          'purple-light': '#d8b4fe',      // purple-300  
          'purple-dark': '#581c87',       // purple-900
          'pink-primary': '#eb1bba72',      // pink-500
          'pink-light': '#f9a8d4',        // pink-300
          'pink-dark': '#831843',         // pink-900
        },
        // Background colors
        'theme-bg': {
          'primary': '#111827',           // gray-900
          'secondary': '#1f2937',         // gray-800
        },
      },
    },
  },
  plugins: [],
}