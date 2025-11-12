
-- migrations/002_work_orders_link.sql
-- Link work_items to work_orders (varchar IDs like 'WO-001') and expose a view for WO-level file lists.

-- 1) Add optional link from work_items → work_orders
ALTER TABLE work_items
  ADD COLUMN IF NOT EXISTS work_order_id TEXT NULL;

-- 2) Optional FK if work_orders.id is TEXT and available
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='work_items' AND constraint_name='work_items_work_order_fk'
  ) THEN
    BEGIN
      ALTER TABLE work_items
        ADD CONSTRAINT work_items_work_order_fk
        FOREIGN KEY (work_order_id)
        REFERENCES work_orders(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skipping FK creation for work_items.work_order_id';
    END;
  END IF;
END $$;

-- 3) Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_work_items_work_order_id ON work_items(work_order_id);

-- 4) View: aggregate files for a given work order
CREATE OR REPLACE VIEW work_order_files AS
SELECT
  wi.work_order_id,
  wf.id         AS file_id,
  wf.work_item_id,
  wf.name,
  wf.mime,
  wf.size_bytes,
  wf.visible_to,
  wf.storage_uri,
  wf.created_at
FROM work_item_files wf
JOIN work_items wi ON wi.id = wf.work_item_id
WHERE wi.work_order_id IS NOT NULL;
