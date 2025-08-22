/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // アプリ専用カスタムカラー
        'app-primary': {
          DEFAULT: '#3B82F6', // Blue-500
          light: '#DBEAFE', // Blue-100
          dark: '#1E40AF', // Blue-800
        },
        'app-success': {
          DEFAULT: '#10B981', // Green-500
          light: '#D1FAE5', // Green-100
          dark: '#059669', // Green-600
        },
        'app-warning': {
          DEFAULT: '#F59E0B', // Amber-500
          light: '#FEF3C7', // Amber-100
          dark: '#D97706', // Amber-600
        },
        'app-danger': {
          DEFAULT: '#EF4444', // Red-500
          light: '#FEE2E2', // Red-100
          dark: '#DC2626', // Red-600
        },
        'app-info': {
          DEFAULT: '#6366F1', // Indigo-500
          light: '#E0E7FF', // Indigo-100
          dark: '#4338CA', // Indigo-700
        },
        'app-purple': {
          DEFAULT: '#8B5CF6', // Purple-500
          light: '#EDE9FE', // Purple-100
          dark: '#7C3AED', // Purple-600
        },
        'app-orange': {
          DEFAULT: '#F97316', // Orange-500
          light: '#FED7AA', // Orange-100
          dark: '#EA580C', // Orange-600
        },
        'app-yellow': {
          DEFAULT: '#EAB308', // Yellow-500
          light: '#FEF3C7', // Yellow-100
          dark: '#CA8A04', // Yellow-600
        },
        // ニュートラルカラー
        'app-neutral': {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
    },
  },
  plugins: [],
};
