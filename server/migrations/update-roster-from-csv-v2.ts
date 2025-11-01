/**
 * Update Dream Team roster from comprehensive CSV v2
 * Includes all roles with complete metadata: handles, collaborators, strengths, DoD, etc.
 */
import { db } from "../db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

// Icon mapping for roles (consistent with existing data)
const ICON_MAP: Record<string, string> = {
  'Aegis': '⚖️',
  'Amani': '🤝',
  'App Development Guru': '📲',
  'Archivist': '🗂️',
  'Atlas': '🧭',
  'Avery Marlowe': '🧬',
  'Beacon': '🔭',
  'Bridge': '🧷',
  'ChieSan': '🎌',
  'Coda': '🧾',
  'CodeBlock': '🧱',
  'Conductor': '🎼',
  'Dr. Rowan Vagus': '🧠',
  'Echo': '📱',
  'English Lyricist': '🎼',
  'English Poet': '🪶',
  'Evidence Curator': '📋',
  'Forge': '🛠️',
  'Foundry': '🏗️',
  'International Counsel (EU/JP)': '🌍',
  'IP Paralegal/Docketing': '📄',
  'Izumi Takahashi': '🔤',
  'Kaoru Arai': '🎭',
  'Ledger': '📊',
  'LexiCode': '🧪',
  'Lume': '🧩',
  'Navi': '🧭',
  'Nova': '🎨',
  'OS': '🧭',
  'Patent Illustrator': '✒️',
  'Patent Search Specialist': '🔍',
  'Praetor': '📜',
  'Prism': '📣',
  'Pulse': '📈',
  'River': '📰',
  'Sentinel': '🛡️',
  'Sparkster': '✨',
  'Storybloom': '📝',
  'Technical Claims Co-Author': '⚙️',
  'Verifier': '✅'
};

// Pod color mapping (locked colors from brand system)
const POD_COLOR_MAP: Record<string, string> = {
  'Control Tower': '#3D6BFF',
  'Marketing & Comms': '#FF7A45',
  'Brand & Marketing': '#FF7A45',
  'Brand & Assets': '#FF5BCD',
  'Finance & BizOps': '#2DBE7A',
  'IP/Patent Program': '#6B1E9C',
  'IP & Patent Program': '#6B1E9C',
  'Security & Compliance': '#3B4A5A',
  'Risk, Security & Compliance': '#3B4A5A',
  'Product & Engineering': '#1F9CFF',
  'Product & Platform': '#1F9CFF',
  'Operating Rhythm': '#5A67FF',
  'Intake & Routing': '#5CE1CF',
  'Medical — Case Research': '#2DBE7A',
  'Medical — Clinical Advisory': '#2DBE7A',
  'SAB — Executive Council': '#3D6BFF'
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

function splitBulletList(text: string): string[] {
  if (!text) return [];
  return text.split('•')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function splitCommaSeparated(text: string): string[] {
  if (!text) return [];
  return text.split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function extractTags(text: string): string[] {
  if (!text) return [];
  return text.match(/#[\w-]+/g)?.map(tag => tag.substring(1)) || [];
}

function getPrimaryPod(podText: string): string {
  // Extract first pod name from text like "Control Tower, Operating Rhythm"
  // or "SAB — Executive Council; Finance & BizOps"
  const pods = podText.split(/[,;]/).map(s => s.trim());
  return pods[0] || 'General';
}

export async function updateRosterFromCSV() {
  console.log("Starting roster update from CSV v2...\n");
  
  try {
    // Read the CSV file
    const csvPath = path.join(process.cwd(), 'attached_assets', 'DTH_Roster_Profiles_v2_1761984030353.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Skip header
    const dataLines = lines.slice(1);
    console.log(`Found ${dataLines.length} roles in CSV\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const line of dataLines) {
      try {
        const cols = parseCSVLine(line);
        
        if (cols.length < 10 || !cols[0]) continue; // Skip invalid lines
        
        const name = cols[0].trim();
        const handle = cols[1].replace('@', '').trim();
        const title = cols[2].trim();
        const primaryPods = cols[3].trim();
        const collaborators = cols[4].trim();
        const coreFunctions = cols[5].trim();
        const strengths = cols[6].trim();
        const definitionOfDone = cols[7].trim();
        const tags = cols[8].trim();
        const scope = cols[9].trim();
        
        // Parse arrays
        const collaboratorsArray = splitCommaSeparated(collaborators);
        const coreFunctionsArray = splitBulletList(coreFunctions);
        const strengthsArray = splitBulletList(strengths);
        const definitionOfDoneArray = splitBulletList(definitionOfDone);
        const tagsArray = extractTags(tags);
        
        // Get primary pod and color
        const pod = getPrimaryPod(primaryPods);
        const podColor = POD_COLOR_MAP[pod] || POD_COLOR_MAP[primaryPods] || '#1F9CFF';
        const icon = ICON_MAP[name] || '';
        const contact = cols[1].trim(); // Keep @handle format
        
        // Upsert role
        await db.execute(sql`
          INSERT INTO role_cards (
            handle, title, pod, pod_color, icon, purpose,
            core_functions, responsibilities, tone_voice,
            definition_of_done, strengths, collaborators,
            contact, links, tags, updated_at
          ) VALUES (
            ${handle},
            ${title},
            ${pod},
            ${podColor},
            ${icon},
            ${scope},
            ${JSON.stringify(coreFunctionsArray)}::jsonb,
            ${JSON.stringify([])}::jsonb,
            ${null},
            ${JSON.stringify(definitionOfDoneArray)}::jsonb,
            ${JSON.stringify(strengthsArray)}::jsonb,
            ${JSON.stringify(collaboratorsArray)}::jsonb,
            ${contact},
            ${JSON.stringify([])}::jsonb,
            ${JSON.stringify(tagsArray)}::jsonb,
            ${new Date()}
          )
          ON CONFLICT (handle)
          DO UPDATE SET
            title = EXCLUDED.title,
            pod = EXCLUDED.pod,
            pod_color = EXCLUDED.pod_color,
            icon = EXCLUDED.icon,
            purpose = EXCLUDED.purpose,
            core_functions = EXCLUDED.core_functions,
            definition_of_done = EXCLUDED.definition_of_done,
            strengths = EXCLUDED.strengths,
            collaborators = EXCLUDED.collaborators,
            contact = EXCLUDED.contact,
            tags = EXCLUDED.tags,
            updated_at = EXCLUDED.updated_at
        `);
        
        successCount++;
        console.log(`✓ Upserted: ${handle} (${title})`);
        
      } catch (error: any) {
        errorCount++;
        console.error(`✗ Error processing line: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Update complete!`);
    console.log(`   Success: ${successCount} roles`);
    console.log(`   Errors: ${errorCount}`);
    
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  }
}

// Run if executed directly
(async () => {
  try {
    await updateRosterFromCSV();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
