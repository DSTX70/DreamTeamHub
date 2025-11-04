#!/usr/bin/env node
/**
 * Regenerate roles_manifest.jsonl from JSON cards in 00_Canonical/roles.
 * Usage:
 *   node tools/regenerate_roles_manifest.js
 */
import fs from 'fs';
import path from 'path';
import process from 'process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ROLES_DIR = path.join(ROOT, '00_Canonical', 'roles');
const MANIFEST = path.join(ROLES_DIR, 'roles_manifest.jsonl');

function isRoleFile(f){ return f.endsWith('.json') && f !== 'roles_manifest.jsonl'; }

function main(){
  if (!fs.existsSync(ROLES_DIR)) {
    console.error('Roles dir not found:', ROLES_DIR);
    process.exit(2);
  }
  const files = fs.readdirSync(ROLES_DIR).filter(isRoleFile).sort();
  let count = 0;
  const lines = [];
  for (const file of files){
    const p = path.join(ROLES_DIR, file);
    try{
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if (!data.key || !data.title) {
        console.error('Skip', file, ': missing key/title');
        continue;
      }
      const entry = {
        key: data.key,
        title: data.title,
        short_title: data.short_title,
        autonomy_level: data.autonomy_level,
        path: `/Agent-Lab/00_Canonical/roles/${file}`,
        effective_date: data.effective_date
      };
      lines.push(JSON.stringify(entry));
      count++;
    }catch(e){
      console.error('Skip', file, ':', e.message);
    }
  }
  fs.writeFileSync(MANIFEST, lines.join('\n') + (lines.length?'\n':''), 'utf-8');
  console.log(`Wrote ${count} entries to ${MANIFEST}`);
}
main();
