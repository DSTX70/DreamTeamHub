
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Core
        'brand-dark': 'var(--brand-dark)',
        'brand-surface': 'var(--brand-surface)',
        'brand-line': 'var(--brand-line)',
        'brand-light': 'var(--brand-light)',
        'brand-teal': 'var(--brand-teal)',
        'brand-indigo': 'var(--brand-indigo)',
        'brand-yellow': 'var(--brand-yellow)',
        'brand-magenta': 'var(--brand-magenta)',
        'brand-jade': 'var(--brand-jade)',
        'brand-orange': 'var(--brand-orange)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        // Pods
        'pod-control': 'var(--pod-control)',
        'pod-intake': 'var(--pod-intake)',
        'pod-decision': 'var(--pod-decision)',
        'pod-roster': 'var(--pod-roster)',
        'pod-ip': 'var(--pod-ip)',
        'pod-security': 'var(--pod-security)',
        'pod-product': 'var(--pod-product)',
        'pod-brand': 'var(--pod-brand)',
        'pod-marketing': 'var(--pod-marketing)',
        'pod-finance': 'var(--pod-finance)',
        'pod-rhythm': 'var(--pod-rhythm)',
      },
      backgroundImage: {
        'grad-orchestra': 'var(--grad-orchestra)',
        'grad-synapse': 'var(--grad-synapse)',
      },
      boxShadow: {
        'elev-1': 'var(--elev-1)',
        'elev-2': 'var(--elev-2)',
        'focus-ring': 'var(--ring)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      spacing: {
        1.5: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        7: 'var(--space-7)',
        8: 'var(--space-8)',
      },
      fontFamily: {
        inter: ['Inter','ui-sans-serif','system-ui'],
        grotesk: ['"Space Grotesk"','Inter','ui-sans-serif','system-ui'],
      }
    },
  },
  plugins: [],
}
