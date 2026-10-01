/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Global Design System Tokens
        lime: {
          DEFAULT: '#B8FF00',
          hover: '#A8EB00',
          dark: '#95D600',
          light: '#C8FF33',
        },
        dark: {
          DEFAULT: '#222222',
          surface: '#181818',
          card: '#222222',
          cardAlt: '#2A2A2A',
          border: '#333333',
          borderLight: '#444444',
        },
        charcoal: {
          DEFAULT: '#5F5F5F',
          light: '#707070',
          dark: '#3D3D3D',
        },
        muted: {
          DEFAULT: '#A0A0A0',
          dark: '#737373',
          light: '#D0D0D0',
        },
        light: {
          DEFAULT: '#F2F2F2',
          surface: '#F8F8F8',
        },
        // Alias brand to lime so any leftover brand classes adopt the lime palette
        brand: {
          50: '#F9FFE6',
          100: '#F2FFCC',
          200: '#E5FF99',
          300: '#D6FF66',
          400: '#C7FF33',
          500: '#B8FF00', // Lime Green
          600: '#A8EB00', // Hover
          700: '#8FCC00',
          800: '#75AD00',
          900: '#5C8F00',
          950: '#222222',
        },
        // Semantic surface hierarchy
        surface: {
          950: '#181818', // Deepest background
          900: '#222222', // Primary dark surface (cards, navbar, panels)
          850: '#2A2A2A', // Secondary dark surface (inputs, subpanels)
          800: '#333333', // Borders and dividers
          750: '#3D3D3D', // Muted borders
          700: '#5F5F5F', // Charcoal accent
        },
      },
      boxShadow: {
        'lime-sm': '0 2px 8px rgba(184, 255, 0, 0.15)',
        'lime-md': '0 4px 16px rgba(184, 255, 0, 0.20)',
        'lime-lg': '0 8px 24px rgba(184, 255, 0, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
