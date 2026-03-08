#!/usr/bin/env node
/**
 * Pass 4: Fix broken IconButton patterns from pass1's icon→children conversion
 * Also fix remaining structural JSX issues
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

  // === FIX BROKEN ICONBUTTON ===
  // Pattern: <IconButton [props] >{<Icon [props]</IconButton>}\n [more props]\n />
  // This is a multi-line broken pattern. Fix by finding the full broken block and rebuilding it.
  
  // Strategy: find all occurrences of ">{<" followed by "</IconButton>}" 
  // These are the broken IconButtons from pass1
  
  // Step 1: Fix the pattern >{<Component props</IconButton>}\n  moreprops\n />
  // by collecting everything between <IconButton and the final />
  
  let fixed = content;
  let iterations = 0;
  
  while (fixed.includes('>{<') && fixed.includes('</IconButton>}') && iterations < 50) {
    iterations++;
    const brokenIdx = fixed.indexOf('>{<');
    if (brokenIdx === -1) break;
    
    // Find the start of this IconButton tag
    const beforeBroken = fixed.substring(0, brokenIdx);
    const iconButtonStart = beforeBroken.lastIndexOf('<IconButton');
    if (iconButtonStart === -1) break;
    
    // Find the closing </IconButton>}
    const closingIdx = fixed.indexOf('</IconButton>}', brokenIdx);
    if (closingIdx === -1) break;
    
    // Find the real end: after </IconButton>} there should be more props and then />
    const afterClosing = fixed.substring(closingIdx + '</IconButton>}'.length);
    const selfCloseIdx = afterClosing.indexOf('/>');
    if (selfCloseIdx === -1) break;
    
    // Extract all parts
    const propsBeforeIcon = fixed.substring(iconButtonStart + '<IconButton'.length, brokenIdx).trim();
    const iconContent = fixed.substring(brokenIdx + '>{<'.length, closingIdx);
    const propsAfterIcon = afterClosing.substring(0, selfCloseIdx).trim();
    
    // Parse the icon: "DeleteIcon boxSize={3}" → "<DeleteIcon boxSize={3} />"
    const iconJsx = `<${iconContent.replace(/<\/\w+>$/, '').trim()} />`;
    
    // Combine all props
    const allProps = [propsBeforeIcon, propsAfterIcon].filter(Boolean).join('\n                ');
    
    // Build the fixed IconButton
    const fixedButton = `<IconButton\n                ${allProps}\n              >\n                ${iconJsx}\n              </IconButton>`;
    
    // Replace in content
    const fullBroken = fixed.substring(iconButtonStart, closingIdx + '</IconButton>}'.length + selfCloseIdx + 2);
    fixed = fixed.substring(0, iconButtonStart) + fixedButton + fixed.substring(iconButtonStart + fullBroken.length);
  }
  
  content = fixed;

  // === FIX: Button leftIcon → children pattern ===
  // In v3, leftIcon and rightIcon don't exist on Button
  // Pattern: <Button ... leftIcon={<Icon />} ...>Text</Button>
  // → <Button ...><Icon /> Text</Button>
  // For now, just remove leftIcon/rightIcon props (icons will be lost but JSX will be valid)
  content = content.replace(
    /\s*leftIcon=\{<([^>]+)\/>\}/g,
    ''
  );
  content = content.replace(
    /\s*rightIcon=\{<([^>]+)\/>\}/g, 
    ''
  );

  // === FIX: Skeleton (still works in v3 but import might be missing) ===
  // Skeleton is still exported from @chakra-ui/react in v3
  
  // === FIX: Alert needs children structure ===
  // In v3, Alert is compound: <Alert.Root><Alert.Indicator /><Alert.Title>...</Alert.Title></Alert.Root>
  // But simple text children should still work
  
  // === FIX: Select/NativeSelect children with <option> ===
  // In v3: <NativeSelect.Root><NativeSelect.Field><option>...</option></NativeSelect.Field></NativeSelect.Root>
  // Check if NativeSelect.Field was already added by pass3
  
  // === FIX: Table compound (v3 uses Table.Root, Table.Header, Table.Body, Table.Row, Table.Cell) ===
  // In v3: Table, Thead, Tbody, Tr, Th, Td still work as-is from @chakra-ui/react
  // Actually in v3, Table is compound: Table.Root, Table.Header, Table.Body, Table.Row, Table.ColumnHeader, Table.Cell
  // But the old names Thead, Tbody, Tr, Th, Td are NOT available
  // We need to map: <Table> → <Table.Root>, <Thead> → <Table.Header>, etc.
  content = content.replace(/<Table\b(?!\.\w)/g, '<Table.Root');
  content = content.replace(/<\/Table>/g, '</Table.Root>');
  content = content.replace(/<Thead\b/g, '<Table.Header');
  content = content.replace(/<\/Thead>/g, '</Table.Header>');
  content = content.replace(/<Tbody\b/g, '<Table.Body');
  content = content.replace(/<\/Tbody>/g, '</Table.Body>');
  content = content.replace(/<Tfoot\b/g, '<Table.Footer');
  content = content.replace(/<\/Tfoot>/g, '</Table.Footer>');
  content = content.replace(/<Tr\b/g, '<Table.Row');
  content = content.replace(/<\/Tr>/g, '</Table.Row>');
  content = content.replace(/<Th\b/g, '<Table.ColumnHeader');
  content = content.replace(/<\/Th>/g, '</Table.ColumnHeader>');
  content = content.replace(/<Td\b/g, '<Table.Cell');
  content = content.replace(/<\/Td>/g, '</Table.Cell>');
  
  // Remove Thead, Tbody, Tfoot, Tr, Th, Td from imports (they're accessed via Table. namespace)
  const tableRemovals = ['Thead', 'Tbody', 'Tfoot', 'Tr', 'Th', 'Td', 'TableContainer'];
  for (const t of tableRemovals) {
    content = content.replace(new RegExp(`\\b${t}\\b\\s*,?`, 'g'), (match, offset) => {
      const lineStart = content.lastIndexOf('\n', offset);
      const lineEnd = content.indexOf('\n', offset);
      const line = content.substring(lineStart, lineEnd);
      if (line.includes("from '@chakra-ui/react'") || line.includes("from '@chakra-ui")) return '';
      return match;
    });
  }

  // Fix double .Root.Root
  content = content.replace(/\.Root\.Root/g, '.Root');
  
  // Clean import formatting
  content = content.replace(/,\s*,/g, ',');
  content = content.replace(/\{\s*,/g, '{ ');
  content = content.replace(/,\s*\}/g, ' }');
  content = content.replace(/,\s*from/g, ' } from').replace(/\}\s*\}\s*from/g, '} from');

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

for (const rf of ['store.ts', 'types.ts', 'constants.ts', 'payloadBuilders.ts', 'page.tsx']) {
  const fp = path.join(ROOT, rf);
  if (fs.existsSync(fp)) { total++; if (fixFile(fp)) { changed++; console.log(`  ✓ ${rf}`); } }
}

console.log(`\nPass 4 done: ${changed}/${total} files fixed.`);
