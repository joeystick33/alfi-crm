#!/usr/bin/env node
/**
 * Chakra UI v2 → v3 migration script
 * Handles: import renames, prop changes, compound component syntax, JSX restructuring
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
    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(full, ext));
    } else if (ext.some(e => entry.name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // ========== IMPORT FIXES ==========
  
  // Remove removed v2 exports from @chakra-ui/react imports
  const removedExports = [
    'FormControl', 'FormLabel', 'FormErrorMessage', 'FormHelperText',
    'NumberInputField', 'NumberInputStepper', 'NumberIncrementStepper', 'NumberDecrementStepper',
    'Collapse', 'Divider', 'AlertIcon',
    'SliderTrack', 'SliderFilledTrack', 'SliderThumb',
    'AccordionItem', 'AccordionButton', 'AccordionPanel', 'AccordionIcon',
    'CardBody', 'CardHeader', 'CardFooter',
    'useColorMode', 'useColorModeValue', 'useToast',
    'RadioGroup',
  ];
  
  // Add Field import if FormControl/FormLabel was used
  const needsField = /FormControl|FormLabel|FormErrorMessage|FormHelperText/.test(content);
  // Add Separator if Divider was used
  const needsSeparator = /\bDivider\b/.test(content);
  // Add Collapsible if Collapse was used
  const needsCollapsible = /\bCollapse\b/.test(content);
  
  // Process @chakra-ui/react import block
  content = content.replace(
    /(import\s*\{[^}]*\}\s*from\s*'@chakra-ui\/react';?)/gs,
    (match) => {
      let imports = match;
      
      // Remove each removed export
      for (const exp of removedExports) {
        // Remove "ExportName," or ", ExportName" or standalone "ExportName"
        imports = imports.replace(new RegExp(`\\b${exp}\\b\\s*,?\\s*`, 'g'), '');
      }
      
      // Clean up double commas, trailing commas before }
      imports = imports.replace(/,\s*,/g, ',');
      imports = imports.replace(/,\s*\}/g, ' }');
      imports = imports.replace(/\{\s*,/g, '{ ');
      
      // Add new imports
      let additions = [];
      if (needsField && !imports.includes('Field')) additions.push('Field');
      if (needsSeparator && !imports.includes('Separator')) additions.push('Separator');
      if (needsCollapsible && !imports.includes('Collapsible')) additions.push('Collapsible');
      
      if (additions.length > 0) {
        imports = imports.replace(/\}\s*from/, additions.join(', ') + ', } from');
        // Clean duplicate comma
        imports = imports.replace(/,\s*,/g, ',');
        imports = imports.replace(/\{\s*,/g, '{ ');
      }
      
      return imports;
    }
  );
  
  // ========== PROP FIXES ==========
  
  // spacing= → gap= (on Stack, VStack, HStack, SimpleGrid)
  // This is safe because 'spacing' is only used as a Chakra prop
  content = content.replace(/\bspacing=/g, 'gap=');
  content = content.replace(/\bspacing\s*:/g, 'gap:');
  
  // leftIcon={...} → remove (handle specially)
  // rightIcon={...} → remove (handle specially)
  // For Button: leftIcon/rightIcon are removed, use children
  // For now, just comment them to avoid build errors
  content = content.replace(/\bleftIcon=\{([^}]+)\}/g, '/* leftIcon={$1} */');
  content = content.replace(/\brightIcon=\{([^}]+)\}/g, '/* rightIcon={$1} */');
  
  // icon={...} on IconButton → children
  // IconButton icon prop → children
  content = content.replace(
    /<IconButton\s([^>]*?)icon=\{([^}]+)\}([^>]*?)\/>/gs,
    (match, before, icon, after) => {
      return `<IconButton ${before}${after}>{${icon}}</IconButton>`;
    }
  );
  
  // bgGradient="linear(...)" → bgGradient="to-r" gradientFrom="..." gradientTo="..."
  content = content.replace(
    /bgGradient="linear\(([^,]+),\s*([^,]+),\s*([^)]+)\)"/g,
    (match, dir, from, to) => {
      const dirMap = { 'to-r': 'to-r', 'to-l': 'to-l', 'to-t': 'to-t', 'to-b': 'to-b',
        '135deg': 'to-br', '45deg': 'to-tr', '180deg': 'to-b', '90deg': 'to-r' };
      const newDir = dirMap[dir.trim()] || 'to-r';
      return `bgGradient="${newDir}" gradientFrom="${from.trim()}" gradientTo="${to.trim()}"`;
    }
  );
  
  // ========== JSX COMPOUND COMPONENT FIXES ==========
  
  // Card → Card.Root, CardBody → Card.Body, CardHeader → Card.Header
  content = content.replace(/<Card\b(?!\.\w)/g, '<Card.Root');
  content = content.replace(/<\/Card>/g, '</Card.Root>');
  content = content.replace(/<CardBody\b/g, '<Card.Body');
  content = content.replace(/<\/CardBody>/g, '</Card.Body>');
  content = content.replace(/<CardHeader\b/g, '<Card.Header');
  content = content.replace(/<\/CardHeader>/g, '</Card.Header>');
  content = content.replace(/<CardFooter\b/g, '<Card.Footer');
  content = content.replace(/<\/CardFooter>/g, '</Card.Footer>');
  
  // Alert → Alert.Root, AlertIcon → Alert.Indicator
  content = content.replace(/<Alert\b(?!\.\w)/g, '<Alert.Root');
  content = content.replace(/<\/Alert>/g, '</Alert.Root>');
  content = content.replace(/<AlertIcon\s*\/>/g, '<Alert.Indicator />');
  
  // Accordion compound components
  content = content.replace(/<Accordion\b(?!\.\w)/g, '<Accordion.Root');
  content = content.replace(/<\/Accordion>/g, '</Accordion.Root>');
  content = content.replace(/<AccordionItem\b/g, '<Accordion.Item');
  content = content.replace(/<\/AccordionItem>/g, '</Accordion.Item>');
  content = content.replace(/<AccordionButton\b/g, '<Accordion.ItemTrigger');
  content = content.replace(/<\/AccordionButton>/g, '</Accordion.ItemTrigger>');
  content = content.replace(/<AccordionPanel\b/g, '<Accordion.ItemContent');
  content = content.replace(/<\/AccordionPanel>/g, '</Accordion.ItemContent>');
  content = content.replace(/<AccordionIcon\s*\/>/g, '<Accordion.ItemIndicator />');
  
  // FormControl → Field.Root, FormLabel → Field.Label, etc.
  content = content.replace(/<FormControl\b/g, '<Field.Root');
  content = content.replace(/<\/FormControl>/g, '</Field.Root>');
  content = content.replace(/<FormLabel\b/g, '<Field.Label');
  content = content.replace(/<\/FormLabel>/g, '</Field.Label>');
  content = content.replace(/<FormErrorMessage\b/g, '<Field.ErrorText');
  content = content.replace(/<\/FormErrorMessage>/g, '</Field.ErrorText>');
  content = content.replace(/<FormHelperText\b/g, '<Field.HelperText');
  content = content.replace(/<\/FormHelperText>/g, '</Field.HelperText>');
  
  // NumberInput compound: NumberInputField → NumberInput.Input
  // Remove NumberInputStepper/Increment/Decrement entirely (they're complex to port)
  content = content.replace(/<NumberInputField\b([^/]*?)\/>/g, '<NumberInput.Input$1/>');
  content = content.replace(/<NumberInputField\b/g, '<NumberInput.Input');
  content = content.replace(/<\/NumberInputField>/g, '</NumberInput.Input>');
  // Remove stepper wrappers (they don't exist in v3)
  content = content.replace(/<NumberInputStepper>[\s\S]*?<\/NumberInputStepper>/g, '');
  content = content.replace(/<NumberIncrementStepper\s*\/>/g, '');
  content = content.replace(/<NumberDecrementStepper\s*\/>/g, '');
  
  // NumberInput → NumberInput.Root (but only the wrapping element, not NumberInput.Input)
  // This is tricky - NumberInput that contains children should become NumberInput.Root
  content = content.replace(/<NumberInput\b(?!\.)/g, '<NumberInput.Root');
  content = content.replace(/<\/NumberInput>/g, '</NumberInput.Root>');
  // Fix double: NumberInput.Root.Input → NumberInput.Input
  content = content.replace(/NumberInput\.Root\.Input/g, 'NumberInput.Input');
  
  // Collapse → Collapsible
  content = content.replace(/<Collapse\s+in=\{([^}]+)\}([^>]*?)>/g, '<Collapsible.Root open={$1}$2><Collapsible.Content>');
  content = content.replace(/<\/Collapse>/g, '</Collapsible.Content></Collapsible.Root>');
  
  // Divider → Separator
  content = content.replace(/<Divider\b/g, '<Separator');
  content = content.replace(/<\/Divider>/g, '</Separator>');
  
  // Slider compound
  content = content.replace(/<Slider\b(?!\.\w)/g, '<Slider.Root');
  content = content.replace(/<\/Slider>/g, '</Slider.Root>');
  content = content.replace(/<SliderTrack\b/g, '<Slider.Track');
  content = content.replace(/<\/SliderTrack>/g, '</Slider.Track>');
  content = content.replace(/<SliderFilledTrack\b/g, '<Slider.FilledTrack');
  content = content.replace(/<\/SliderFilledTrack>/g, '</Slider.FilledTrack>');
  content = content.replace(/<SliderThumb\b/g, '<Slider.Thumb');
  content = content.replace(/<\/SliderThumb>/g, '</Slider.Thumb>');
  
  // Select compound (simple replacement - Select → NativeSelect for basic usage)
  // In v3, native <Select> is now NativeSelect. The compound Select.Root is for the new Select.
  // For migration simplicity, use NativeSelect for existing <Select> usage
  content = content.replace(/<Select\b(?!\.\w)/g, '<NativeSelect.Root');
  content = content.replace(/<\/Select>/g, '</NativeSelect.Root>');
  
  // Add NativeSelect to imports if needed
  if (content.includes('NativeSelect') && !content.includes("'NativeSelect'")) {
    content = content.replace(
      /(import\s*\{[^}]*)\}\s*from\s*'@chakra-ui\/react'/,
      '$1, NativeSelect } from \'@chakra-ui/react\''
    );
    // Clean up
    content = content.replace(/,\s*,/g, ',');
  }
  
  // RadioGroup → RadioGroup (it's now a compound component in v3)
  // Radio and RadioGroup usage: <RadioGroup onChange={...} value={...}> → <RadioGroup.Root onValueChange={...} value={...}>
  content = content.replace(/<RadioGroup\b(?!\.\w)/g, '<RadioGroup.Root');
  content = content.replace(/<\/RadioGroup>/g, '</RadioGroup.Root>');
  content = content.replace(/(<RadioGroup\.Root[^>]*)\bonChange=/g, '$1onValueChange=');
  
  // Radio → Radio.Root (but keep the value prop)
  // In v3: <Radio value="x">Label</Radio> → <Radio.Root value="x"><Radio.HiddenInput /><Radio.Control /><Radio.Label>Label</Radio.Label></Radio.Root>
  // This is too complex for regex. Just rename the tag for now.
  // We'll use the simpler approach: keep Radio but add .Root
  
  // Switch: isChecked → checked
  content = content.replace(/\bisChecked\b/g, 'checked');
  
  // useColorModeValue → just use the light value (since we're light mode only)
  content = content.replace(/useColorModeValue\(([^,]+),\s*[^)]+\)/g, '$1');
  
  // useColorMode → remove (just provide empty object)
  content = content.replace(/const\s*\{\s*colorMode\s*,\s*toggleColorMode\s*\}\s*=\s*useColorMode\(\);?/g, 
    'const colorMode = "light"; const toggleColorMode = () => {};');
  
  // useToast → toaster (Chakra v3 uses toaster from snippets)
  // For simplicity, create a no-op toast
  content = content.replace(/const\s+toast\s*=\s*useToast\(\);?/g, 
    'const toast = (opts: any) => { console.log("toast:", opts); };');
  
  // Accordion: allowToggle → collapsible, allowMultiple → multiple
  content = content.replace(/\ballowToggle\b/g, 'collapsible');
  content = content.replace(/\ballowMultiple\b/g, 'multiple');
  
  // Progress: In v3, Progress is a compound component
  // For simple usage: <Progress value={x} /> → <Progress.Root value={x}><Progress.Track><Progress.Range /></Progress.Track></Progress.Root>
  // Only transform if it's a self-closing Progress
  content = content.replace(
    /<Progress\s+([^>]*?)\/>/g,
    (match, props) => {
      if (props.includes('Progress.')) return match; // Already migrated
      return `<Progress.Root ${props}><Progress.Track><Progress.Range /></Progress.Track></Progress.Root>`;
    }
  );
  
  // Stat compound component: Stat → Stat.Root, StatLabel → Stat.Label, etc.
  content = content.replace(/<Stat\b(?!\.\w)/g, '<Stat.Root');
  content = content.replace(/<\/Stat>/g, '</Stat.Root>');
  content = content.replace(/<StatLabel\b/g, '<Stat.Label');
  content = content.replace(/<\/StatLabel>/g, '</Stat.Label>');
  content = content.replace(/<StatNumber\b/g, '<Stat.ValueText');
  content = content.replace(/<\/StatNumber>/g, '</Stat.ValueText>');
  content = content.replace(/<StatHelpText\b/g, '<Stat.HelpText');
  content = content.replace(/<\/StatHelpText>/g, '</Stat.HelpText>');
  content = content.replace(/<StatArrow\b/g, '<Stat.UpIndicator'); // Approximate
  
  // Remove StatLabel, StatNumber, StatHelpText, StatArrow, StatGroup from imports
  const statRemovals = ['StatLabel', 'StatNumber', 'StatHelpText', 'StatArrow', 'StatGroup'];
  for (const s of statRemovals) {
    content = content.replace(new RegExp(`\\b${s}\\b\\s*,?\\s*`, 'g'), (match, offset) => {
      // Only remove from import lines
      const lineStart = content.lastIndexOf('\n', offset);
      const line = content.substring(lineStart, offset + match.length);
      if (line.includes('import')) return '';
      return match;
    });
  }
  
  // Tab compound component
  content = content.replace(/<Tabs\b(?!\.\w)/g, '<Tabs.Root');
  content = content.replace(/<\/Tabs>/g, '</Tabs.Root>');
  content = content.replace(/<TabList\b/g, '<Tabs.List');
  content = content.replace(/<\/TabList>/g, '</Tabs.List>');
  content = content.replace(/<Tab\b(?!\.\w|s\b|List)/g, '<Tabs.Trigger');
  content = content.replace(/<\/Tab>/g, '</Tabs.Trigger>');
  content = content.replace(/<TabPanels\b/g, '<Tabs.ContentGroup');
  content = content.replace(/<\/TabPanels>/g, '</Tabs.ContentGroup>');
  content = content.replace(/<TabPanel\b/g, '<Tabs.Content');
  content = content.replace(/<\/TabPanel>/g, '</Tabs.Content>');
  
  // Remove Tab-related sub-imports
  const tabRemovals = ['TabList', 'TabPanels', 'TabPanel', 'Tab'];
  
  // Tooltip: label → content
  content = content.replace(/(<Tooltip[^>]*)\blabel=/g, '$1content=');
  
  // Icon: as= prop is now asChild pattern (keep as= for now, it still works for simple cases)
  
  // ========== ADD 'use client' DIRECTIVE ==========
  if (filePath.endsWith('.tsx') && !content.startsWith("'use client'") && !content.startsWith('"use client"')) {
    content = "'use client'\n\n" + content;
  }
  
  // ========== CLEAN UP ==========
  // Remove empty import lines
  content = content.replace(/import\s*\{\s*\}\s*from\s*'[^']*';?\n?/g, '');
  // Clean double newlines (max 2)
  content = content.replace(/\n{3,}/g, '\n\n');
  // Clean trailing commas in imports
  content = content.replace(/,\s*\}/g, ' }');
  content = content.replace(/\{\s*,/g, '{ ');
  content = content.replace(/,\s*,/g, ',');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

// ========== MAIN ==========
const dirs = [
  path.join(ROOT, 'components'),
  path.join(ROOT, 'steps'),
  path.join(ROOT, 'pages'),
  path.join(ROOT, 'services'),
  path.join(ROOT, 'theme'),
  path.join(ROOT, 'utils'),
  path.join(ROOT, 'types'),
  path.join(ROOT, 'constants'),
  path.join(ROOT, 'hooks'),
  path.join(ROOT, 'validation'),
];

let totalChanged = 0;
let totalFiles = 0;

for (const dir of dirs) {
  const files = getAllFiles(dir);
  for (const f of files) {
    totalFiles++;
    const changed = migrateFile(f);
    if (changed) {
      totalChanged++;
      console.log(`  ✓ ${path.relative(ROOT, f)}`);
    }
  }
}

// Also migrate the root-level files
const rootFiles = ['store.ts', 'store-original.ts', 'store-types.ts', 'store-payloadBuilders.ts', 'types.ts', 'constants.ts', 'payloadBuilders.ts'];
for (const rf of rootFiles) {
  const fp = path.join(ROOT, rf);
  if (fs.existsSync(fp)) {
    totalFiles++;
    const changed = migrateFile(fp);
    if (changed) {
      totalChanged++;
      console.log(`  ✓ ${rf}`);
    }
  }
}

console.log(`\nDone: ${totalChanged}/${totalFiles} files migrated.`);
