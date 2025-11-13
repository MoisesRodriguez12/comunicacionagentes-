/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta de Rojos - Color Principal Dominante
        red: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Negro Profesional
        black: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#3d3d3d',
          950: '#000000',
        },
        // Blanco y Grises Claros
        white: {
          50: '#ffffff',
          100: '#fefefe',
          200: '#fefefe',
          300: '#fdfdfd',
          400: '#fcfcfc',
          500: '#fafafa',
          600: '#f5f5f5',
          700: '#f0f0f0',
          800: '#e5e5e5',
          900: '#d4d4d4',
        },
        // Grises para Contraste
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
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        'red': '0 4px 14px 0 rgba(220, 38, 38, 0.2)',
        'red-lg': '0 10px 25px -3px rgba(220, 38, 38, 0.3), 0 4px 6px -2px rgba(220, 38, 38, 0.2)',
        'black': '0 4px 14px 0 rgba(0, 0, 0, 0.15)',
        'black-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'premium': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      backgroundImage: {
        'red-gradient': 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        'black-gradient': 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        'red-black-gradient': 'linear-gradient(135deg, #dc2626 0%, #1f2937 100%)',
      },
    },
  },
  plugins: [],
}

