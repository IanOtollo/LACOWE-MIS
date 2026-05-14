/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#1A1A2E',
        'accent-hover': '#16213E',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'bg-base': '#F8F9FA',
        'bg-surface': '#FFFFFF',
        border: '#E5E7EB',
        success: '#16A34A',
        danger: '#DC2626',
        warning: '#D97706',
        info: '#2563EB',
      },
      borderRadius: {
        card: '6px',
        input: '4px',
        badge: '3px',
      },
    },
  },
  plugins: [],
}
