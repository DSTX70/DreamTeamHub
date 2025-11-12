import fs from 'fs';
import path from 'path';

const CFG_PATH = path.resolve(process.cwd(), 'server/config/uploader.config.json');

export type UploaderConfig = { backend:'local'|'drive'|'s3'; allowlist:string; maxMb:number };

export function getConfig(): UploaderConfig {
  if (!fs.existsSync(CFG_PATH)){
    fs.mkdirSync(path.dirname(CFG_PATH), { recursive: true });
    fs.writeFileSync(CFG_PATH, JSON.stringify({ backend:'local', allowlist:'json,csv,zip,webp,png,svg,txt,md', maxMb:25 }, null, 2));
  }
  return JSON.parse(fs.readFileSync(CFG_PATH, 'utf-8'));
}

export function saveConfig(cfg: UploaderConfig){
  fs.mkdirSync(path.dirname(CFG_PATH), { recursive: true });
  fs.writeFileSync(CFG_PATH, JSON.stringify(cfg, null, 2));
}
