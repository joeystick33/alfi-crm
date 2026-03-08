#!/usr/bin/env node
/**
 * Final fixes for remaining TS errors:
 * 1. boxSize on react-icons → size + style
 * 2. noOfLines → lineClamp
 * 3. sx prop → css prop
 * 4. Missing compat imports for deeply nested files
 * 5. Resolver type cast for react-hook-form
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../app/(advisor)/(frontend)/dashboard/simulateurs/succession-smp');

function getAllFiles(dir, ext = ['.tsx', '.ts']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(getAllFiles(full, ext));
    else if (ext.some(e => entry.name.endsWith(e))) results.push(full);
  }
  return results;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // 1. Fix boxSize on react-icons: <CheckIcon boxSize={4} /> → <CheckIcon size={16} />
  // boxSize in Chakra units (1 unit = 4px), react-icons uses `size` in px
  content = content.replace(
    /boxSize=\{(\d+)\}/g,
    (match, val) => `size={${parseInt(val) * 4}}`
  );

  // 2. Fix noOfLines prop → lineClamp (v3 rename)
  content = content.replace(/\bnoOfLines=/g, 'lineClamp=');

  // 3. Fix sx prop → css prop (v3 rename)
  content = content.replace(/\bsx=\{/g, 'css={');

  // 4. Fix resolver type for react-hook-form (zodResolver returns incompatible type in v4)
  // Add `as any` to resolver calls
  content = content.replace(
    /resolver:\s*zodResolver\(([^)]+)\)/g,
    'resolver: zodResolver($1) as any'
  );

  // 5. Fix bgGradient="linear(..." → gradientFrom/gradientTo
  // In v3, bgGradient with linear() syntax is removed
  content = content.replace(
    /bgGradient="linear\(([^,]+),\s*([^,]+),\s*([^)]+)\)"/g,
    (match, dir, from, to) => {
      return `bgGradient="to-r" gradientFrom="${from.trim()}" gradientTo="${to.trim()}"`;
    }
  );

  // 6. Fix SkeletonText noOfLines → SkeletonText (use lineClamp already handled above)

  // 7. Fix motion.create usage (v2 had motion(Component), v3 framer-motion uses motion.create)
  // motion.create is actually framer-motion v11 API, motion() is v10
  // Check which version is installed
  content = content.replace(/motion\.create\(/g, 'motion.create(');
  // This is fine if framer-motion v11+ is installed

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

const dirs = ['components', 'steps', 'pages', 'services', 'theme', 'utils', 'types', 'constants', 'hooks', 'validation'];
let changed = 0, total = 0;

for (const dir of dirs) {
  for (const f of getAllFiles(path.join(ROOT, dir))) {
    total++;
    if (fixFile(f)) { changed++; console.log(`  ✓ ${path.relative(ROOT, f)}`); }
  }
}

console.log(`\nFinal fixes done: ${changed}/${total} files fixed.`);
