/**
 * Dream Team Hub — Pod Rails & Glass Utilities
 * Usage:
 *   import podGlassPlugin from './tailwind.podglass.plugin';
 *   // in tailwind.config.ts:
 *   plugins: [podGlassPlugin],
 */
import plugin from 'tailwindcss/plugin';

export default plugin(function({ addUtilities }) {
  const rails = {
    '.pod-rail-control':  {'background': 'linear-gradient(135deg,var(--pod-control),var(--brand-indigo))'},
    '.pod-rail-intake':   {'background': 'linear-gradient(135deg,var(--pod-intake),var(--brand-teal))'},
    '.pod-rail-decision': {'background': 'linear-gradient(135deg,var(--pod-decision),var(--brand-yellow))'},
    '.pod-rail-roster':   {'background': 'linear-gradient(135deg,var(--pod-roster),var(--brand-magenta))'},
    '.pod-rail-ip':       {'background': 'linear-gradient(135deg,var(--pod-ip),var(--brand-indigo))'},
    '.pod-rail-security': {'background': 'linear-gradient(135deg,var(--pod-security),var(--brand-jade))'},
    '.pod-rail-product':  {'background': 'linear-gradient(135deg,var(--pod-product),var(--brand-teal))'},
    '.pod-rail-brand':    {'background': 'linear-gradient(135deg,var(--pod-brand),var(--brand-magenta))'},
    '.pod-rail-marketing':{'background': 'linear-gradient(135deg,var(--pod-marketing),var(--brand-yellow))'},
    '.pod-rail-finance':  {'background': 'linear-gradient(135deg,var(--pod-finance),var(--brand-jade))'},
    '.pod-rail-rhythm':   {'background': 'linear-gradient(135deg,var(--pod-rhythm),var(--brand-indigo))'},
  };

  const glass = {
    '.bg-glass':    {'background': 'var(--glass-bg)'},
    '.border-glass':{'border-color': 'var(--glass-border)'},
    '.shadow-glass':{'box-shadow': 'var(--elev-2)'},
    '.ring-brand':  {'box-shadow': 'var(--ring)'},
  };

  addUtilities(rails);
  addUtilities(glass);
});
