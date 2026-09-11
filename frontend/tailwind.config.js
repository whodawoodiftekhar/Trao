/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx,js,jsx,html}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Identity. Primary actions and the mark — not decoration.
        brand: {
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
          950: "#2E1065",
        },
        // Readiness only: coverage, confidence, a finished day. Never ornament.
        signal: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
        slate: {
          50: "#F8F8FA",
          100: "#F1F1F5",
          200: "#E4E4EC",
          300: "#D2D2DE",
          400: "#9B9BAB",
          500: "#6E6E80",
          600: "#53535F",
          700: "#3D3D48",
          800: "#2A2A33",
          900: "#1C1C23",
          950: "#111116",
        },
        // Semantic surfaces, so cards sit *on* something instead of floating on flat grey.
        canvas: "#F6F6F9",
        surface: "#FFFFFF",
        sunken: "#EFEFF4",
        ink: "#17161C",
        muted: "#6E6E80",
        hairline: "#E4E4EC",
      },
      boxShadow: {
        // Elevation ladder — a card and a modal must not share a shadow.
        '2xs': '0 1px 2px 0 rgb(23 22 28 / 0.04)',
        xs: '0 1px 2px 0 rgb(23 22 28 / 0.05)',
        card: '0 1px 2px -1px rgb(23 22 28 / 0.06), 0 2px 6px -1px rgb(23 22 28 / 0.04)',
        raised: '0 2px 4px -2px rgb(23 22 28 / 0.08), 0 8px 20px -6px rgb(23 22 28 / 0.10)',
        pop: '0 8px 24px -6px rgb(23 22 28 / 0.14)',
        overlay: '0 24px 60px -12px rgb(23 22 28 / 0.28)',
        nav: '0 1px 2px 0 rgb(23 22 28 / 0.20)',
        glow: '0 0 24px -6px rgb(124 58 237 / 0.35)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // A real scale rather than everything at 15px.
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.005em' }],
        xs: ['0.75rem', { lineHeight: '1.125rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.875rem', { lineHeight: '1.375rem' }],
        md: ['0.9375rem', { lineHeight: '1.5rem' }],
        lg: ['1.0625rem', { lineHeight: '1.625rem', letterSpacing: '-0.01em' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.015em' }],
        '2xl': ['1.5rem', { lineHeight: '1.95rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.9375rem', { lineHeight: '2.3rem', letterSpacing: '-0.025em' }],
        '4xl': ['2.4375rem', { lineHeight: '2.75rem', letterSpacing: '-0.03em' }],
        '5xl': ['3.0625rem', { lineHeight: '3.25rem', letterSpacing: '-0.035em' }],
      },
      borderRadius: {
        lg: '10px',
        xl: '13px',
        '2xl': '17px',
        '3xl': '22px',
      },
      maxWidth: {
        prose: '68ch',
        shell: '1400px',
      },
      keyframes: {
        'fade-rise': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'sheen': {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-rise': 'fade-rise 280ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
