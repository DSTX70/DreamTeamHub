
# DTH Pod Color Coding — vNext 2025 Q4

Files:
- pod-colors.css
- pod-colors.json
- tailwind.podcolors.plugin.js
- RoleCard.example.tsx

Install:
1) Copy to `/ui/pod-colors/`
2) In tailwind.config.js:  plugins: [ require('./ui/pod-colors/tailwind.podcolors.plugin.js') ]
3) Import CSS in your app entry:  import './ui/pod-colors/pod-colors.css';
4) Use either data attributes or utility classes.

Adding pods: update pod-colors.json and restart Tailwind.
