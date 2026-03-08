#!/usr/bin/env node
/**
 * Chakra v2→v3 Compat Layer Migration
 * 
 * For each .tsx/.ts file in succession-smp:
 * 1. Replace `from '@chakra-ui/react'` → `from '<relative>/compat'`
 * 2. Replace `@chakra-ui/icons` → react-icons/lu equivalents
 * 3. Add 'use client' to .tsx files
 * 4. Fix store import paths
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

// Icon mapping: @chakra-ui/icons → react-icons/lu
const ICON_MAP = {
  'AddIcon': 'LuPlus',
  'DeleteIcon': 'LuTrash2',
  'CheckIcon': 'LuCheck',
  'ChevronDownIcon': 'LuChevronDown',
  'ChevronUpIcon': 'LuChevronUp',
  'ChevronLeftIcon': 'LuChevronLeft',
  'ChevronRightIcon': 'LuChevronRight',
  'MoonIcon': 'LuMoon',
  'SunIcon': 'LuSun',
  'SearchIcon': 'LuSearch',
  'InfoIcon': 'LuInfo',
  'WarningIcon': 'LuAlertTriangle',
  'ExternalLinkIcon': 'LuExternalLink',
  'StarIcon': 'LuStar',
  'CloseIcon': 'LuX',
  'EditIcon': 'LuPencil',
  'ArrowForwardIcon': 'LuArrowRight',
  'HamburgerIcon': 'LuMenu',
  'RepeatIcon': 'LuRefreshCw',
  'DownloadIcon': 'LuDownload',
  'CopyIcon': 'LuCopy',
  'ViewIcon': 'LuEye',
  'ViewOffIcon': 'LuEyeOff',
  'SettingsIcon': 'LuSettings',
  'TimeIcon': 'LuClock',
  'CalendarIcon': 'LuCalendar',
  'AtSignIcon': 'LuAtSign',
  'LinkIcon': 'LuLink',
  'PhoneIcon': 'LuPhone',
  'EmailIcon': 'LuMail',
  'LockIcon': 'LuLock',
  'UnlockIcon': 'LuUnlock',
  'ArrowBackIcon': 'LuArrowLeft',
  'ArrowUpIcon': 'LuArrowUp',
  'ArrowDownIcon': 'LuArrowDown',
  'MinusIcon': 'LuMinus',
  'SmallCloseIcon': 'LuX',
  'TriangleDownIcon': 'LuChevronDown',
  'TriangleUpIcon': 'LuChevronUp',
  'InfoOutlineIcon': 'LuInfo',
  'WarningTwoIcon': 'LuAlertTriangle',
  'CheckCircleIcon': 'LuCheckCircle',
  'QuestionIcon': 'LuHelpCircle',
  'QuestionOutlineIcon': 'LuHelpCircle',
  'NotAllowedIcon': 'LuBan',
  'DragHandleIcon': 'LuGripVertical',
  'SpinnerIcon': 'LuLoader',
  'BellIcon': 'LuBell',
  'AttachmentIcon': 'LuPaperclip',
};

function getRelativeCompatPath(filePath) {
  const dir = path.dirname(filePath);
  let rel = path.relative(dir, ROOT);
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel + '/compat';
}

function migrateFile(filePath) {
  // Skip compat.tsx itself and page.tsx
  const basename = path.basename(filePath);
  if (basename === 'compat.tsx' || basename === 'page.tsx') return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // 1. Replace @chakra-ui/react imports → compat
  const compatPath = getRelativeCompatPath(filePath);
  content = content.replace(
    /from\s*'@chakra-ui\/react'/g,
    `from '${compatPath}'`
  );
  content = content.replace(
    /from\s*"@chakra-ui\/react"/g,
    `from '${compatPath}'`
  );
  
  // 2. Replace @chakra-ui/icons → react-icons/lu
  content = content.replace(
    /import\s*\{([^}]+)\}\s*from\s*['"]@chakra-ui\/icons['"];?/g,
    (match, imports) => {
      const names = imports.split(',').map(s => s.trim()).filter(Boolean);
      const mapped = names.map(name => {
        const luName = ICON_MAP[name];
        if (luName) return `${luName} as ${name}`;
        console.warn(`  ⚠ Unknown icon: ${name} in ${path.relative(ROOT, filePath)}`);
        return `LuCircle as ${name}`;
      });
      return `import { ${mapped.join(', ')} } from 'react-icons/lu';`;
    }
  );
  
  // 3. Add 'use client' to .tsx files
  if (filePath.endsWith('.tsx') && !content.startsWith("'use client'") && !content.startsWith('"use client"')) {
    content = "'use client'\n\n" + content;
  }
  
  // 4. Fix store import path: ../store/successionStore → ../store
  content = content.replace(
    /from\s*['"]\.\.\/store\/successionStore['"]/g,
    "from '../store'"
  );
  content = content.replace(
    /from\s*['"]\.\/store\/successionStore['"]/g,
    "from './store'"
  );
  content = content.replace(
    /from\s*['"]\.\.\/\.\.\/store\/successionStore['"]/g,
    "from '../../store'"
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

// Main
const dirs = ['components', 'steps', 'pages', 'services', 'theme', 'utils', 'types', 'constants', 'hooks', 'validation'];
let changed = 0, total = 0;

for (const dir of dirs) {
  for (const f of getAllFiles(path.join(ROOT, dir))) {
    total++;
    if (migrateFile(f)) { changed++; console.log(`  ✓ ${path.relative(ROOT, f)}`); }
  }
}

// Root-level files (except compat.tsx and page.tsx)
for (const rf of ['store.ts', 'store-original.ts', 'store-types.ts', 'types.ts', 'constants.ts', 'payloadBuilders.ts']) {
  const fp = path.join(ROOT, rf);
  if (fs.existsSync(fp)) {
    total++;
    if (migrateFile(fp)) { changed++; console.log(`  ✓ ${rf}`); }
  }
}

console.log(`\nCompat migration done: ${changed}/${total} files updated.`);
