/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#0055D4',
        'brand-secondary': '#F0F5FF',
        'neutral-900': '#111827',
        'neutral-700': '#374151',
        'neutral-500': '#6B7280',
        'neutral-300': '#D1D5DB',
        'neutral-100': '#F3F4F6',
        'neutral-50': '#F9FAFB',
        'error-red': '#EF4444',
        'warning-yellow': '#F59E0B',
      },
      boxShadow: {
        'subtle': '0 4px 12px rgba(0, 0, 0, 0.05)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};