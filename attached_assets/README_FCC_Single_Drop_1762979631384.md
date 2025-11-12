## Fab Card Co — Single Drop (v1)
Generated: 2025-11-12T20:31:57.704581Z

Install:
1) Add files to repo.
2) Import after global tokens:
import '@/styles/brands/fcc.tokens.css';
import '@/styles/brands/fcc.css';
3) Wrap FCC pages with BrandScope.
4) Merge Tailwind snippet from snippets/tailwind.fcc.extend.ts.
Regenerate vars if tokens change:
node scripts/tokens_to_css.mjs ./app/design/fabcardco.tokens.json ./app/styles/brands/fcc.tokens.css
