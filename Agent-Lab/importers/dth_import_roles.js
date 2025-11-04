#!/usr/bin/env node
/**
 * DTH Roles Importer (Node.js)
 * 
 * Usage:
 *   node dth_import_roles.js --manifest ../00_Canonical/roles/roles_manifest.jsonl --category "Agent Lab / Added Specialists" --dry-run
 * 
 * Environment Variables:
 *   DTH_API_BASE - Base URL for DTH API (e.g., https://your-dth.example.com/api)
 *   DTH_API_TOKEN - API token for authentication
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const args = {
    manifest: '../00_Canonical/roles/roles_manifest.jsonl',
    category: 'Agent Lab / Added Specialists',
    dryRun: false
  };

  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--manifest' && i + 1 < process.argv.length) {
      args.manifest = process.argv[++i];
    } else if (process.argv[i] === '--category' && i + 1 < process.argv.length) {
      args.category = process.argv[++i];
    } else if (process.argv[i] === '--dry-run') {
      args.dryRun = true;
    }
  }

  return args;
}

function loadRoleJson(entry, manifestPath) {
  const manifestDir = path.dirname(manifestPath);
  
  const tryPaths = [
    path.resolve(manifestDir, entry.path.replace(/^\/Agent-Lab\/00_Canonical\/roles\//, '')),
    path.resolve(manifestDir, entry.path.replace(/^\//, '')),
    path.resolve(manifestDir, '.' + entry.path),
  ];

  for (const tryPath of tryPaths) {
    if (fs.existsSync(tryPath)) {
      const content = fs.readFileSync(tryPath, 'utf-8');
      return JSON.parse(content);
    }
  }

  throw new Error(`Role JSON not found for key=${entry.key}: tried ${tryPaths.join(', ')}`);
}

async function upsertRole(entry, manifestPath, apiBase, apiToken, category, dryRun) {
  const role = loadRoleJson(entry, manifestPath);
  role.category = category;

  const getUrl = `${apiBase}/roles/by-handle/${entry.key}`;
  const headers = {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json'
  };

  if (dryRun) {
    console.log(`[DRY-RUN] Would GET ${getUrl}`);
    return true;
  }

  try {
    const getResponse = await fetch(getUrl, { headers });

    if (getResponse.ok) {
      const putUrl = getUrl;
      const putResponse = await fetch(putUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(role)
      });

      if (putResponse.ok) {
        console.log(`Updated: ${entry.key}`);
        return true;
      } else {
        const errorText = await putResponse.text();
        console.error(`PUT failed: ${entry.key} -> ${putResponse.status} ${errorText}`);
        return false;
      }
    } else if (getResponse.status === 404) {
      const postUrl = `${apiBase}/roles`;
      const postResponse = await fetch(postUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(role)
      });

      if (postResponse.ok) {
        console.log(`Created: ${entry.key}`);
        return true;
      } else {
        const errorText = await postResponse.text();
        console.error(`POST failed: ${entry.key} -> ${postResponse.status} ${errorText}`);
        return false;
      }
    } else {
      const errorText = await getResponse.text();
      console.error(`GET failed: ${entry.key} -> ${getResponse.status} ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error(`Error upserting ${entry.key}:`, error.message);
    return false;
  }
}

async function main() {
  const args = parseArgs();

  const apiBase = process.env.DTH_API_BASE;
  const apiToken = process.env.DTH_API_TOKEN;

  if (!apiBase || !apiToken) {
    console.error('Missing environment variables: DTH_API_BASE and/or DTH_API_TOKEN');
    process.exit(2);
  }

  const manifestPath = path.resolve(__dirname, args.manifest);

  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest file not found: ${manifestPath}`);
    process.exit(2);
  }

  const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  const lines = manifestContent.split('\n').filter(line => line.trim());

  let ok = 0;
  let fail = 0;

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      
      if (args.dryRun) {
        console.log(`[DRY-RUN] Validate ${entry.key} (${entry.title || ''})`);
      }

      const success = await upsertRole(entry, manifestPath, apiBase, apiToken, args.category, args.dryRun);
      if (success) {
        ok++;
      } else {
        fail++;
      }
    } catch (error) {
      console.error(`Error processing line: ${line}`, error.message);
      fail++;
    }
  }

  console.log(`\nDone. OK=${ok} FAIL=${fail}`);
  if (fail > 0) {
    process.exit(1);
  }
}

main();
