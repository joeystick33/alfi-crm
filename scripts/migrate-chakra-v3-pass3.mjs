#!/usr/bin/env node
/**
 * Chakra UI v2→v3 migration — Pass 3
 * Fix JSX structural issues from regex-based transformations:
 * 1. Broken IconButton icon→children conversion
 * 2. Broken Collapsible wrapping
 * 3. Broken NativeSelect wrapping
 * 4. Switch compound component
 * 5. Remaining prop issues
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

  // ===== FIX 1: Broken IconButton icon→children conversion =====
  // The pass1 script created: <IconButton ...>{<Icon />}</IconButton>
  // But the actual pattern in code is multi-line:
  // <IconButton
  //   aria-label="..."
  //   icon={<Icon />}
  //   onClick={...}
  //   size="sm"
  // />
  // Which became broken. Let's fix by finding IconButton with malformed children
  
  // First, revert ALL IconButton back to self-closing with icon prop pattern
  // Then re-apply the v3 fix correctly
  
  // Pattern: broken IconButton with >{...} style
  content = content.replace(
    />{<([A-Za-z]+)([^}]*)<\/IconButton>}/g,
    '><$1$2 /></IconButton>'
  );
  
  // Now fix IconButton: in v3, icon prop doesn't exist. Use children instead.
  // Pattern: <IconButton ... icon={<Component />} ... />
  // → <IconButton ...><Component /></IconButton>
  content = content.replace(
    /<IconButton\b([\s\S]*?)icon=\{(<[^>]+\/>)\}([\s\S]*?)\/>/g,
    (match, before, icon, after) => {
      // Clean up the props
      const allProps = (before + after).trim();
      return `<IconButton ${allProps}>${icon}</IconButton>`;
    }
  );
  
  // Also handle: icon={<Component boxSize={...} />}
  content = content.replace(
    /<IconButton\b([\s\S]*?)icon=\{(<[^}]+>)\}([\s\S]*?)\/>/g,
    (match, before, icon, after) => {
      const allProps = (before + after).trim();
      // Close the icon if it's not self-closing
      const cleanIcon = icon.endsWith('/>') ? icon : icon.replace(/>$/, ' />');
      return `<IconButton ${allProps}>${cleanIcon}</IconButton>`;
    }
  );

  // ===== FIX 2: Collapsible wrapping =====
  // The regex created: <Collapsible.Root open={X}><Collapsible.Content>...</Collapsible.Content></Collapsible.Root>
  // But Chakra v3 Collapsible is: <Collapsible.Root open={X}><Collapsible.Content>...</Collapsible.Content></Collapsible.Root>
  // The issue is the regex didn't handle nested content well.
  // Simple fix: Replace Collapsible with a simple conditional rendering pattern
  // Since the codebase uses framer-motion anyway, just use {open && <div>...</div>}
  
  // Actually, let's keep Collapsible but fix the structure.
  // The problem is that </Collapsible.Content></Collapsible.Root> was inserted at every </Collapse>
  // but the opening <Collapsible.Root><Collapsible.Content> was only at the opening <Collapse>
  // This should be fine structurally. Let me check for broken patterns instead.
  
  // Fix: remove 'animateOpacity' which isn't a valid prop
  content = content.replace(/\s+animateOpacity\s*/g, ' ');
  
  // ===== FIX 3: NativeSelect =====
  // In Chakra v3, NativeSelect needs: <NativeSelect.Root><NativeSelect.Field>...</NativeSelect.Field></NativeSelect.Root>
  // But our regex just renamed <Select> to <NativeSelect.Root>
  // The children (option elements) need to be inside NativeSelect.Field
  
  // Pattern: <NativeSelect.Root ...>...<option>...</option>...</NativeSelect.Root>
  // → <NativeSelect.Root><NativeSelect.Field ...>...<option>...</option>...</NativeSelect.Field></NativeSelect.Root>
  content = content.replace(
    /<NativeSelect\.Root\b([^>]*)>([\s\S]*?)<\/NativeSelect\.Root>/g,
    (match, props, children) => {
      // Move props to NativeSelect.Field
      return `<NativeSelect.Root><NativeSelect.Field${props}>${children}</NativeSelect.Field></NativeSelect.Root>`;
    }
  );

  // ===== FIX 4: Switch compound component =====  
  // In v3, Switch is a compound component: <Switch.Root><Switch.HiddenInput /><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Root>
  // But for simplicity, we can use Switch.Root directly with checked/onCheckedChange
  // Pattern: <Switch ... /> → <Switch.Root ... />
  content = content.replace(/<Switch\b(?!\.\w)/g, '<Switch.Root');
  content = content.replace(/<\/Switch>/g, '</Switch.Root>');
  // Fix self-closing: <Switch.Root ... /> is valid
  
  // onChange on Switch → onCheckedChange
  content = content.replace(/(<Switch\.Root[^>]*)\bonChange=/g, '$1onCheckedChange=');

  // ===== FIX 5: Button leftIcon/rightIcon =====
  // In v3, these props are removed. Use children with icon components.
  // Revert the comment-based fix from pass1
  content = content.replace(/\/\* leftIcon=\{([^}]+)\} \*\//g, '');
  content = content.replace(/\/\* rightIcon=\{([^}]+)\} \*\//g, '');

  // ===== FIX 6: Icon component =====
  // In v3, Icon `as` prop still works but `size` prop doesn't
  // Icon size → use fontSize or boxSize instead
  // Actually boxSize still works in v3
  
  // ===== FIX 7: Tooltip =====
  // In v3, Tooltip is compound: Tooltip.Root + Tooltip.Trigger + Tooltip.Content
  // But for simplicity, keep the simple Tooltip usage (it still works with content prop)
  
  // ===== FIX 8: Progress compound =====
  // Already handled in pass1, but verify no broken patterns
  
  // ===== FIX 9: Alert.Root status prop =====
  // In v3, Alert uses status prop still
  // But Alert.Indicator might not exist - use Alert.Icon or just an icon
  content = content.replace(/<Alert\.Indicator\s*\/>/g, '<Alert.Indicator />');

  // ===== FIX 10: Stat compound =====
  // Stat.Root, Stat.Label, Stat.ValueText, Stat.HelpText
  // Already done in pass1

  // ===== FIX 11: Clean up double .Root.Root =====
  content = content.replace(/\.Root\.Root/g, '.Root');

  // ===== FIX 12: Fix Accordion.Item needs value prop =====
  // In v3, Accordion.Item requires a value prop
  let accordionIdx = 0;
  content = content.replace(/<Accordion\.Item\b(?![^>]*value=)/g, () => {
    return `<Accordion.Item value="item-${accordionIdx++}"`;
  });

  // ===== FIX 13: RadioGroup.Root needs proper structure =====
  // In v3: <RadioGroup.Root onValueChange={fn} value={val}>
  //   <Radio.Root value="opt1"><Radio.HiddenInput /><Radio.Control /><Radio.Label>...</Radio.Label></Radio.Root>
  // But this is too complex for regex. Keep Radio as simple elements for now.
  // Actually in v3, there's a simpler Radio that works: <Radio value="x">label</Radio>
  // Let's just make sure RadioGroup uses onValueChange

  // ===== FIX 14: NumberInput.Root needs value/onValueChange =====
  // In v3: onChange → onValueChange, value is still value
  content = content.replace(/(<NumberInput\.Root[^>]*)\bonChange=/g, '$1onValueChange=');
  
  // ===== FIX 15: Tabs.Root needs value prop =====
  content = content.replace(/(<Tabs\.Root)\b(?![^>]*value=)(?![^>]*defaultValue=)/g, '$1 defaultValue="0"');

  // ===== CLEAN UP =====
  content = content.replace(/\n{3,}/g, '\n\n');
  // Remove empty lines with only whitespace
  content = content.replace(/^\s+$/gm, '');

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

for (const rf of ['store.ts', 'types.ts', 'constants.ts', 'payloadBuilders.ts', 'page.tsx']) {
  const fp = path.join(ROOT, rf);
  if (fs.existsSync(fp)) { total++; if (fixFile(fp)) { changed++; console.log(`  ✓ ${rf}`); } }
}

console.log(`\nPass 3 done: ${changed}/${total} files fixed.`);
