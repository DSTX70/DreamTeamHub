import fs from "fs";
import path from "path";
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const LOG_FILE = path.join(DATA_DIR, "ops_logs.csv");
let counters = { errors: 0, events: 0 };
function ensure() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, "ts,kind,message,meta\n");
}
export function append(kind: "error"|"event", message: string, meta?: Record<string, any>) {
  ensure();
  const ts = new Date().toISOString();
  const metaStr = meta ? JSON.stringify(meta).replace(/\n/g, " ").replace(/,/g, ";") : "";
  const line = `${ts},${kind},"${(message||"").replace(/"/g,'\"')}",${metaStr}\n`;
  fs.appendFileSync(LOG_FILE, line);
  if (kind === "error") counters.errors += 1; else counters.events += 1;
}
export function getCounters(){ return { ...counters }; }
export function logEvent(m: string, meta?: Record<string, any>){ append("event", m, meta); }
export function logError(m: string, meta?: Record<string, any>){ append("error", m, meta); }
export function logFilePath(){ ensure(); return LOG_FILE; }
