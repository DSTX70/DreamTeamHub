#!/usr/bin/env node
import fs from 'node:fs'; import path from 'node:path';
function toVarName(keys){return '--'+keys.join('-').replace(/[^a-z0-9-]/gi,'-').replace(/-+/g,'-').toLowerCase();}
function flatten(obj,prefix=[]){const out=[];for(const [k,v] of Object.entries(obj||{})){const kp=[...prefix,k];
 if(v&&typeof v==='object'&&!('value'in v)&&!('hex'in v)){out.push(...flatten(v,kp));}
 else{let val=v;if(v&&typeof v==='object'){if('hex'in v)val=v.hex;else if('value'in v)val=v.value;}
 out.push({name:toVarName(kp),value:String(val)})}}return out}
function emitCSS(vars){return [':root {',...vars.map(({name,value})=>`  ${name}: ${value};`),'}'].join('\n')+'\n'}
const [,,inFile,outFile]=process.argv;if(!inFile||!outFile){console.error('Usage: node scripts/tokens_to_css.mjs <input.json> <output.css>');process.exit(1);} 
const raw=fs.readFileSync(path.resolve(inFile),'utf8');const json=JSON.parse(raw);const vars=flatten(json);const css=emitCSS(vars);
fs.mkdirSync(path.dirname(path.resolve(outFile)),{recursive:true});fs.writeFileSync(path.resolve(outFile),css,'utf8');
console.log(`Wrote ${vars.length} variables → ${outFile}`);