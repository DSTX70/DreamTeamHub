/**
 * Migration to add new fields to role_cards and seed all Dream Team roles
 */
import { db } from "../db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

export async function migrateRosterFields() {
  console.log("Starting roster fields migration...");
  
  // Add new columns to role_cards table
  try {
    // Add icon column
    await db.execute(sql`
      ALTER TABLE role_cards 
      ADD COLUMN IF NOT EXISTS icon TEXT
    `);
    console.log("✓ Added icon column");
    
    // Add pod_color column
    await db.execute(sql`
      ALTER TABLE role_cards 
      ADD COLUMN IF NOT EXISTS pod_color TEXT
    `);
    console.log("✓ Added pod_color column");
    
    // Add strengths column
    await db.execute(sql`
      ALTER TABLE role_cards 
      ADD COLUMN IF NOT EXISTS strengths JSONB DEFAULT '[]'::jsonb
    `);
    console.log("✓ Added strengths column");
    
    // Add collaborators column
    await db.execute(sql`
      ALTER TABLE role_cards 
      ADD COLUMN IF NOT EXISTS collaborators JSONB DEFAULT '[]'::jsonb
    `);
    console.log("✓ Added collaborators column");
    
    // Add contact column
    await db.execute(sql`
      ALTER TABLE role_cards 
      ADD COLUMN IF NOT EXISTS contact TEXT
    `);
    console.log("✓ Added contact column");
    
    console.log("All new columns added successfully!");
    
  } catch (error: any) {
    console.error("Error adding columns:", error.message);
    throw error;
  }
}

export async function seedAllRoles() {
  console.log("\nSeeding all Dream Team roles...");
  
  try {
    // Read the roster JSON file
    const rosterPath = path.join(process.cwd(), 'attached_assets', 'dream_team_roster_full_1761983105024.json');
    const rosterData = JSON.parse(fs.readFileSync(rosterPath, 'utf-8'));
    
    console.log(`Found ${rosterData.length} roles to seed`);
    
    // Upsert each role
    for (const role of rosterData) {
      const roleData = {
        handle: role.handle,
        title: role.title,
        pod: role.pod,
        pod_color: role.pod_color || null,
        icon: role.icon || null,
        purpose: role.purpose,
        core_functions: JSON.stringify(role.core_functions || []),
        responsibilities: JSON.stringify(role.responsibilities || []),
        tone_voice: null, // Not in roster JSON
        definition_of_done: JSON.stringify(role.definition_of_done || []),
        strengths: JSON.stringify(role.strengths || []),
        collaborators: JSON.stringify(role.collaborators || []),
        contact: role.contact || null,
        links: JSON.stringify(role.links || []),
        tags: JSON.stringify(role.tags || []),
        updated_at: new Date(),
      };
      
      // Insert or update
      await db.execute(sql`
        INSERT INTO role_cards (
          handle, title, pod, pod_color, icon, purpose,
          core_functions, responsibilities, tone_voice,
          definition_of_done, strengths, collaborators,
          contact, links, tags, updated_at
        ) VALUES (
          ${roleData.handle},
          ${roleData.title},
          ${roleData.pod},
          ${roleData.pod_color},
          ${roleData.icon},
          ${roleData.purpose},
          ${roleData.core_functions}::jsonb,
          ${roleData.responsibilities}::jsonb,
          ${roleData.tone_voice},
          ${roleData.definition_of_done}::jsonb,
          ${roleData.strengths}::jsonb,
          ${roleData.collaborators}::jsonb,
          ${roleData.contact},
          ${roleData.links}::jsonb,
          ${roleData.tags}::jsonb,
          ${roleData.updated_at}
        )
        ON CONFLICT (handle)
        DO UPDATE SET
          title = EXCLUDED.title,
          pod = EXCLUDED.pod,
          pod_color = EXCLUDED.pod_color,
          icon = EXCLUDED.icon,
          purpose = EXCLUDED.purpose,
          core_functions = EXCLUDED.core_functions,
          responsibilities = EXCLUDED.responsibilities,
          definition_of_done = EXCLUDED.definition_of_done,
          strengths = EXCLUDED.strengths,
          collaborators = EXCLUDED.collaborators,
          contact = EXCLUDED.contact,
          links = EXCLUDED.links,
          tags = EXCLUDED.tags,
          updated_at = EXCLUDED.updated_at
      `);
      
      console.log(`✓ Upserted role: ${role.handle}`);
    }
    
    console.log(`\n✅ Successfully seeded all ${rosterData.length} roles!`);
    
  } catch (error: any) {
    console.error("Error seeding roles:", error.message);
    throw error;
  }
}

// Run migrations if executed directly
(async () => {
  try {
    await migrateRosterFields();
    await seedAllRoles();
    console.log("\n✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
})();
