# Dream Team Hub - Database Backup Configuration

**Last Updated:** 2025-11-06  
**Status:** Production Requirement  
**Platform:** Replit PostgreSQL (Neon-backed)

---

## Overview

Dream Team Hub uses **Replit PostgreSQL** for persistent storage. Replit provides built-in **point-in-time restore** capabilities with configurable retention periods.

---

## Backup Strategy

### Replit Point-in-Time Restore

Replit PostgreSQL offers continuous backup with point-in-time recovery (PITR).

**How it works:**
- Continuous backup of database changes
- Restore to any point within retention period
- No manual backup schedules required

**Retention Period:**
- Configurable in Database tool settings
- **Requirement:** Set to **14 days minimum** for production

---

## Configuration Steps

### 1. Access Database Settings

1. Open your Repl in Replit workspace
2. Click **Tools** in left sidebar
3. Select **Database**
4. Click **Settings** (gear icon)

### 2. Configure History Retention

**Required Setting:**
- **History Retention:** Select **14 days** or higher
- **Recommended:** 30 days for production systems

**Steps:**
1. In Database Settings, locate "History Retention"
2. Select retention period from dropdown
3. Click **Save**

**Available Options:**
- 7 days (minimum)
- 14 days ✅ **Required**
- 30 days (recommended)
- 90 days (enterprise)

### 3. Verify Configuration

**Check current retention:**
```sql
-- This setting is managed by Replit infrastructure
-- No SQL query available to verify retention period
```

**Manual verification:**
1. Database Settings → History Retention
2. Confirm setting shows "14 days" or higher
3. Take screenshot for audit trail

---

## Restore Procedures

### Point-in-Time Restore

**When to use:**
- Data corruption detected
- Accidental deletion
- Need to recover to specific timestamp
- Rollback after failed migration

**Steps:**

1. **Identify Restore Point**
   - Determine exact timestamp to restore to
   - Example: `2025-11-06 14:30:00 UTC`
   - **IMPORTANT:** All data after this point will be lost

2. **Initiate Restore**
   - Open Database tool
   - Click **Settings**
   - Select **Restore**
   - Choose restore point (date + time)
   - Click **Confirm Restore**

3. **Verify Restoration**
   ```sql
   -- Check recent data timestamps
   SELECT MAX(created_at) FROM operations_events;
   SELECT COUNT(*) FROM work_orders;
   SELECT COUNT(*) FROM agents;
   ```

4. **Test Application**
   - Navigate to key pages: `/`, `/projects`, `/copilot`
   - Verify data integrity
   - Check for missing records

### Restore from Staging Snapshot (Alternative)

If point-in-time restore is unavailable, use staging refresh backups:

**Pre-requisite:** Staging environment must be configured with weekly automated refreshes

**Steps:**
1. Identify latest staging snapshot (weekly refresh)
2. Export schema + data from staging:
   ```bash
   pg_dump -h $STAGING_DB_HOST -U $STAGING_DB_USER -d $STAGING_DB_NAME \
     --schema-only --no-owner --no-acl > schema.sql
   
   pg_dump -h $STAGING_DB_HOST -U $STAGING_DB_USER -d $STAGING_DB_NAME \
     --data-only --no-owner --no-acl > data.sql
   ```
3. Apply to production (CAUTION):
   ```bash
   psql -h $PROD_DB_HOST -U $PROD_DB_USER -d $PROD_DB_NAME < schema.sql
   psql -h $PROD_DB_HOST -U $PROD_DB_USER -d $PROD_DB_NAME < data.sql
   ```

**IMPORTANT:** This restores to weekly snapshot, not precise point-in-time

---

## Backup Validation

### Weekly Validation Checklist

**Every Monday:**
- [ ] Verify History Retention still set to 14+ days
- [ ] Confirm database is accessible
- [ ] Run backup test restore (staging environment)
- [ ] Document validation in operations log

### Test Restore Procedure (Staging Only)

**Monthly drill:**
1. Create test database or use staging
2. Perform point-in-time restore to yesterday
3. Verify data integrity:
   ```sql
   -- Row counts should match expected values
   SELECT 
     'agents' as table_name, COUNT(*) FROM agents
   UNION ALL
   SELECT 'work_orders', COUNT(*) FROM work_orders
   UNION ALL
   SELECT 'operations_events', COUNT(*) FROM operations_events
   UNION ALL
   SELECT 'published_knowledge', COUNT(*) FROM published_knowledge;
   ```
4. Document results
5. Delete test database

---

## Disaster Recovery Plan

### Recovery Time Objective (RTO)

**Target:** < 1 hour from incident detection to service restoration

**Steps:**
1. Detect issue (0-15 min)
2. Identify restore point (15-20 min)
3. Initiate restore (20-35 min)
4. Verify + test (35-50 min)
5. Resume service (50-60 min)

### Recovery Point Objective (RPO)

**Target:** < 5 minutes of data loss

With continuous PITR backups:
- Restore to any second within retention period
- Typical data loss: 0-30 seconds

### Escalation

**Database restore authority:**
- **L1:** Operations team (can initiate staging restores)
- **L2:** Platform team (can initiate production restores)
- **L3:** Replit support (if restore fails)

**Contact Replit Support:**
- https://replit.com/support
- Include: Repl ID, timestamp, error message

---

## Monitoring & Alerts

### Health Checks

**Automated monitoring:**
```sql
-- Run daily (automated task)
CREATE OR REPLACE FUNCTION check_backup_health() RETURNS TABLE(
  check_name text,
  status text,
  details jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'database_size'::text,
    CASE WHEN pg_database_size(current_database()) > 0 
      THEN 'OK' ELSE 'ERROR' END,
    jsonb_build_object(
      'size_bytes', pg_database_size(current_database()),
      'size_mb', ROUND(pg_database_size(current_database())::numeric / 1024 / 1024, 2)
    );
END;
$$ LANGUAGE plpgsql;

SELECT * FROM check_backup_health();
```

### Alert Triggers

**Configure alerts for:**
- Database size >90% of quota
- Connection failures >3 in 5 minutes
- Slow query performance (>5s average)

**Alert destinations:**
- Operations team Slack channel
- PagerDuty (production incidents)
- Email (non-critical warnings)

---

## Compliance & Audit

### Retention Policy Documentation

**Regulatory requirements:**
- **GDPR:** Right to erasure (deleted data must be purged from backups)
- **Data retention:** 14 days minimum for operational recovery
- **Audit logs:** 90 days retention (operations_events table)

**Compliance notes:**
- Point-in-time restore includes deleted data
- To fully purge data: Wait 14 days after deletion
- For immediate purge: Contact Replit support

### Audit Trail

**Document all restore operations:**
```sql
-- Create event after each restore
INSERT INTO operations_events (kind, message, owner_type, actor, meta)
VALUES (
  'DATABASE_RESTORE',
  'Point-in-time restore executed',
  'system',
  'ops-team@example.com',
  jsonb_build_object(
    'restorePoint', '2025-11-06T14:30:00Z',
    'reason', 'Data corruption recovery',
    'approver', 'director@example.com',
    'durationMinutes', 45
  )
);
```

---

## Additional Backup Strategies

### Export Key Data (Supplemental)

**Weekly exports for critical tables:**
```bash
# Export agents, projects, work orders
pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE \
  -t agents -t projects -t work_orders \
  --data-only --column-inserts > weekly_backup_$(date +%Y%m%d).sql
```

**Store exports:**
- Google Drive (encrypted)
- S3 bucket (versioned)
- Local secure storage

**Retention:** 90 days

### Schema Version Control

**Store schema in Git:**
```bash
# Export schema only
pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE \
  --schema-only --no-owner --no-acl > schema_$(date +%Y%m%d).sql

# Commit to repository
git add schema_$(date +%Y%m%d).sql
git commit -m "Database schema backup $(date +%Y%m%d)"
git push
```

**Benefits:**
- Schema change history
- Easy rollback for DDL changes
- Documentation of database structure

---

## Pre-Production Checklist

Before launching Dream Team Hub to production:

- [ ] **Database Settings**
  - [ ] History Retention set to 14 days minimum
  - [ ] Screenshot taken for audit trail
  - [ ] Setting verified by two team members

- [ ] **Test Restore**
  - [ ] Staging restore test completed successfully
  - [ ] Data integrity verified
  - [ ] Restore time < 1 hour RTO

- [ ] **Documentation**
  - [ ] Disaster recovery plan reviewed
  - [ ] Team trained on restore procedures
  - [ ] Escalation contacts documented

- [ ] **Monitoring**
  - [ ] Database health checks configured
  - [ ] Alerts configured for failures
  - [ ] Weekly validation schedule created

- [ ] **Supplemental Backups**
  - [ ] Weekly export script tested
  - [ ] Schema version control configured
  - [ ] Backup storage location secured

---

## Support & Resources

**Replit Documentation:**
- PostgreSQL Overview: https://docs.replit.com/hosting/databases/postgresql
- Point-in-Time Restore: Check Database Settings → History Retention

**Internal Resources:**
- Go-Live Environment Variables: `docs/GO_LIVE_ENV_VARS.md`
- Publish Incident Runbook: `docs/RUNBOOK_PUBLISH_INCIDENT.md`
- Work Orders Runbook: `docs/RUNBOOK_WORK_ORDERS.md`

**Emergency Contacts:**
- Platform Team: See `replit.md`
- Replit Support: https://replit.com/support
