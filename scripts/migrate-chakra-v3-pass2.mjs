#!/usr/bin/env node
/**
 * Chakra UI v2→v3 migration — Pass 2
 * Fix remaining @chakra-ui/icons imports and broken import formatting
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

  // 1. Replace ALL remaining @chakra-ui/icons imports
  const iconMap = {
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
  };

  content = content.replace(
    /import\s*\{([^}]+)\}\s*from\s*'@chakra-ui\/icons';?/g,
    (match, imports) => {
      const names = imports.split(',').map(s => s.trim()).filter(Boolean);
      const mapped = names.map(name => {
        const luName = iconMap[name];
        if (luName) return `${luName} as ${name}`;
        return name; // Keep as-is if unknown
      });
      return `import { ${mapped.join(', ')} } from 'react-icons/lu';`;
    }
  );

  // 2. Fix broken import lines where migration script concatenated without commas
  // Pattern: "VStack Field" → "VStack, Field"
  // Pattern: "VStack Field, Separator" → "VStack, Field, Separator"
  content = content.replace(
    /(import\s*\{[^}]*\}\s*from\s*'@chakra-ui\/react';?)/gs,
    (match) => {
      // Extract the imports part between { and }
      const m = match.match(/import\s*\{([^}]*)\}\s*from/s);
      if (!m) return match;
      
      let importList = m[1];
      
      // Fix missing commas: "Word1 Word2" → "Word1, Word2" 
      // But not "motion.create" or "React.lazy" etc.
      importList = importList.replace(/([a-zA-Z>])\s+([A-Z][a-zA-Z]*)\b/g, (m, before, after) => {
        // Don't add comma if it's part of a generic type or already has comma
        if (before === ',') return m;
        return `${before}, ${after}`;
      });
      
      // Remove duplicates
      const parts = importList.split(',').map(s => s.trim()).filter(Boolean);
      const unique = [...new Set(parts)];
      
      // Remove items that don't exist in Chakra v3
      const removed = new Set([
        'FormControl', 'FormLabel', 'FormErrorMessage', 'FormHelperText',
        'NumberInputField', 'NumberInputStepper', 'NumberIncrementStepper', 'NumberDecrementStepper',
        'Collapse', 'Divider', 'AlertIcon', 'AlertDescription',
        'SliderTrack', 'SliderFilledTrack', 'SliderThumb',
        'AccordionItem', 'AccordionButton', 'AccordionPanel', 'AccordionIcon',
        'CardBody', 'CardHeader', 'CardFooter',
        'useColorMode', 'useColorModeValue', 'useToast',
        'RadioGroup', 'Radio',
        'StatLabel', 'StatNumber', 'StatHelpText', 'StatArrow', 'StatGroup',
        'TabList', 'TabPanels', 'TabPanel', 'Tab',
        'CircularProgress', 'CircularProgressLabel',
        'StackDivider',
      ]);
      
      const filtered = unique.filter(item => !removed.has(item));
      
      // Add needed new imports
      const contentAfter = content; // Check if these are used in JSX
      if (/Field\./.test(contentAfter) && !filtered.includes('Field')) filtered.push('Field');
      if (/Separator/.test(contentAfter) && !filtered.includes('Separator')) filtered.push('Separator');
      if (/Collapsible\./.test(contentAfter) && !filtered.includes('Collapsible')) filtered.push('Collapsible');
      if (/NativeSelect\./.test(contentAfter) && !filtered.includes('NativeSelect')) filtered.push('NativeSelect');
      if (/RadioGroup\./.test(contentAfter) && !filtered.includes('RadioGroup')) filtered.push('RadioGroup');
      if (/\bRadio\b/.test(contentAfter) && !filtered.includes('Radio')) filtered.push('Radio');
      
      if (filtered.length === 0) return '';
      
      // Format: if more than 4 items, multi-line
      if (filtered.length > 4) {
        return `import {\n  ${filtered.join(',\n  ')},\n} from '@chakra-ui/react';`;
      }
      return `import { ${filtered.join(', ')} } from '@chakra-ui/react';`;
    }
  );

  // 3. Fix store import path (successionStore → store)
  content = content.replace(
    /from\s*['"]\.\.\/store\/successionStore['"]/g,
    "from '../store'"
  );
  content = content.replace(
    /from\s*['"]\.\/store\/successionStore['"]/g,
    "from './store'"
  );

  // 4. Fix motion.create (v2 used motion(Component), v3 style differs)
  // motion.create(Box) → this is actually framer-motion API, should work

  // 5. Remove 'animateOpacity' prop from Collapsible (doesn't exist in v3)
  content = content.replace(/\banimateOpacity\b/g, '');

  // 6. Fix Circle import (might not exist in v3 — use Box with borderRadius="full" instead)
  // Circle is still available in v3, keep it

  // 7. Clean up empty imports
  content = content.replace(/import\s*\{\s*\}\s*from\s*'[^']*';?\n?/g, '');
  content = content.replace(/\n{3,}/g, '\n\n');

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
    if (fixFile(f)) { changed++; console.log(`  ✓ ${path.relative(ROOT, f)}`); }
  }
}

// Root files
for (const rf of ['store.ts', 'store-original.ts', 'store-types.ts', 'types.ts', 'constants.ts', 'payloadBuilders.ts', 'page.tsx']) {
  const fp = path.join(ROOT, rf);
  if (fs.existsSync(fp)) { total++; if (fixFile(fp)) { changed++; console.log(`  ✓ ${rf}`); } }
}

console.log(`\nPass 2 done: ${changed}/${total} files fixed.`);
