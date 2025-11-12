/**
 * Audit Trail Monitor
 * Utility to verify ops_settings_audit trigger behavior and monitor configuration changes
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

export interface AuditRecord {
  id: number;
  setting_key: string;
  old_value: any;
  new_value: any;
  changed_by: string;
  changed_at: Date;
}

export interface AuditDiff {
  field: string;
  oldValue: any;
  newValue: any;
}

/**
 * Get recent audit trail entries for a specific setting
 */
export async function getAuditTrail(
  settingKey: string,
  limit: number = 10
): Promise<AuditRecord[]> {
  const result = await db.execute(sql`
    SELECT 
      id,
      setting_key,
      old_value,
      new_value,
      changed_by,
      changed_at
    FROM ops_settings_audit
    WHERE setting_key = ${settingKey}
    ORDER BY changed_at DESC
    LIMIT ${limit}
  `);

  return result.rows.map((row: any) => ({
    id: row.id,
    setting_key: row.setting_key,
    old_value: typeof row.old_value === 'string' ? JSON.parse(row.old_value) : row.old_value,
    new_value: typeof row.new_value === 'string' ? JSON.parse(row.new_value) : row.new_value,
    changed_by: row.changed_by,
    changed_at: new Date(row.changed_at),
  }));
}

/**
 * Get all audit trail entries (for monitoring dashboard)
 */
export async function getAllAuditTrail(limit: number = 50): Promise<AuditRecord[]> {
  const result = await db.execute(sql`
    SELECT 
      id,
      setting_key,
      old_value,
      new_value,
      changed_by,
      changed_at
    FROM ops_settings_audit
    ORDER BY changed_at DESC
    LIMIT ${limit}
  `);

  return result.rows.map((row: any) => ({
    id: row.id,
    setting_key: row.setting_key,
    old_value: typeof row.old_value === 'string' ? JSON.parse(row.old_value) : row.old_value,
    new_value: typeof row.new_value === 'string' ? JSON.parse(row.new_value) : row.new_value,
    changed_by: row.changed_by,
    changed_at: new Date(row.changed_at),
  }));
}

/**
 * Compute diff between old and new values
 */
export function computeDiff(oldValue: any, newValue: any): AuditDiff[] {
  const diffs: AuditDiff[] = [];
  
  if (!oldValue && newValue) {
    // Initial creation
    return Object.keys(newValue).map((key) => ({
      field: key,
      oldValue: null,
      newValue: newValue[key],
    }));
  }

  if (!newValue) return [];

  // Compare each field
  const allKeys = new Set([
    ...Object.keys(oldValue || {}),
    ...Object.keys(newValue || {}),
  ]);

  for (const key of allKeys) {
    const oldVal = oldValue?.[key];
    const newVal = newValue?.[key];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diffs.push({
        field: key,
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }

  return diffs;
}

/**
 * Verify audit trigger is working correctly
 * Returns { ok: true } if working, { ok: false, error: string } if not
 */
export async function verifyAuditTrigger(): Promise<{ ok: boolean; error?: string; details?: any }> {
  try {
    // 1. Check if audit table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ops_settings_audit'
      ) as exists
    `);

    if (!tableCheck.rows[0]?.exists) {
      return { ok: false, error: 'ops_settings_audit table does not exist' };
    }

    // 2. Check if trigger exists
    const triggerCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND event_object_table = 'ops_settings'
        AND trigger_name = 'audit_ops_settings_changes'
      ) as exists
    `);

    if (!triggerCheck.rows[0]?.exists) {
      return { ok: false, error: 'audit_ops_settings_changes trigger does not exist' };
    }

    // 3. Check if audit records exist (trigger has fired at least once)
    const auditCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM ops_settings_audit
    `);

    const count = parseInt(auditCount.rows[0]?.count || '0', 10);

    // 4. Get most recent audit entry
    const recentAudit = await db.execute(sql`
      SELECT 
        setting_key,
        changed_by,
        changed_at,
        new_value
      FROM ops_settings_audit
      ORDER BY changed_at DESC
      LIMIT 1
    `);

    return {
      ok: true,
      details: {
        auditRecordCount: count,
        mostRecent: recentAudit.rows[0] || null,
        triggerActive: true,
      },
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message || 'Unknown error during audit trigger verification',
    };
  }
}

/**
 * Get audit trail summary statistics
 */
export async function getAuditSummary() {
  const totalChanges = await db.execute(sql`
    SELECT COUNT(*) as count FROM ops_settings_audit
  `);

  const changesByUser = await db.execute(sql`
    SELECT 
      changed_by,
      COUNT(*) as change_count
    FROM ops_settings_audit
    GROUP BY changed_by
    ORDER BY change_count DESC
    LIMIT 10
  `);

  const changesBySetting = await db.execute(sql`
    SELECT 
      setting_key,
      COUNT(*) as change_count
    FROM ops_settings_audit
    GROUP BY setting_key
    ORDER BY change_count DESC
  `);

  const recentChanges = await db.execute(sql`
    SELECT 
      setting_key,
      changed_by,
      changed_at
    FROM ops_settings_audit
    ORDER BY changed_at DESC
    LIMIT 5
  `);

  return {
    totalChanges: parseInt(totalChanges.rows[0]?.count || '0', 10),
    changesByUser: changesByUser.rows,
    changesBySetting: changesBySetting.rows,
    recentChanges: recentChanges.rows.map((r: any) => ({
      ...r,
      changed_at: new Date(r.changed_at),
    })),
  };
}

/**
 * Format audit record for display
 */
export function formatAuditRecord(record: AuditRecord): string {
  const diffs = computeDiff(record.old_value, record.new_value);
  const timestamp = record.changed_at.toISOString();
  
  let output = `[${timestamp}] ${record.setting_key} changed by ${record.changed_by}\n`;
  
  if (diffs.length === 0) {
    output += '  (No changes detected)\n';
  } else {
    diffs.forEach((diff) => {
      output += `  ${diff.field}: ${JSON.stringify(diff.oldValue)} → ${JSON.stringify(diff.newValue)}\n`;
    });
  }
  
  return output;
}

/**
 * CLI utility to print audit trail
 */
export async function printAuditTrail(settingKey?: string, limit: number = 10) {
  console.log('=== Ops Settings Audit Trail ===\n');

  // Verify trigger is working
  const verification = await verifyAuditTrigger();
  if (!verification.ok) {
    console.error(`❌ Audit trigger verification failed: ${verification.error}`);
    return;
  }

  console.log('✅ Audit trigger is active');
  console.log(`📊 Total audit records: ${verification.details?.auditRecordCount}\n`);

  // Get audit trail
  const records = settingKey 
    ? await getAuditTrail(settingKey, limit)
    : await getAllAuditTrail(limit);

  if (records.length === 0) {
    console.log('No audit records found.');
    return;
  }

  console.log(`Showing ${records.length} most recent changes:\n`);
  records.forEach((record) => {
    console.log(formatAuditRecord(record));
  });

  // Print summary
  const summary = await getAuditSummary();
  console.log('\n=== Summary ===');
  console.log(`Total changes: ${summary.totalChanges}`);
  console.log('\nChanges by setting:');
  summary.changesBySetting.forEach((row: any) => {
    console.log(`  ${row.setting_key}: ${row.change_count} changes`);
  });
  console.log('\nChanges by user:');
  summary.changesByUser.forEach((row: any) => {
    console.log(`  ${row.changed_by}: ${row.change_count} changes`);
  });
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const settingKey = process.argv[2];
  const limit = parseInt(process.argv[3] || '10', 10);
  
  printAuditTrail(settingKey, limit)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}
