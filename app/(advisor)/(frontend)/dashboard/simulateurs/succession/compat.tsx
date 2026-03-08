'use client'

/**
 * Chakra UI v2 → v3 Compatibility Layer
 * 
 * Re-exports all v3 components + provides wrapper components
 * that accept the v2 API and translate to v3 internally.
 * 
 * Usage: In all simulateur files, replace:
 *   import { ... } from '@chakra-ui/react'
 * with:
 *   import { ... } from '../compat'
 */

import React from 'react'
import { createToaster } from '@chakra-ui/react'

// ============================================================
// 1. RE-EXPORT unchanged v3 components (passthrough)
// ============================================================
export {
  Box,
  Flex,
  VStack as ChakraVStack,
  HStack as ChakraHStack,
  Stack as ChakraStack,
  Center,
  Container,
  Grid,
  GridItem,
  SimpleGrid as ChakraSimpleGrid,
  Spacer,
  Wrap,
  Text as ChakraText,
  Heading as ChakraHeading,
  Code,
  Link,
  Button as ChakraButton,
  IconButton as ChakraIconButton,
  Badge as V3Badge,
  Spinner as ChakraSpinner,
  Circle,
  Image,
  Icon as V3Icon,
  Skeleton,

  // v3 compound components (namespace exports)
  Field,
  Separator,
  Collapsible,
  NativeSelect,
  Card as ChakraCard,
  Alert as ChakraAlert,
  Accordion as ChakraAccordion,
  NumberInput as ChakraNumberInput,
  Slider as ChakraSlider,
  Switch as ChakraSwitch,
  RadioGroup as ChakraRadioGroup,
  Progress as ChakraProgress,
  Table as ChakraTable,
  Stat as ChakraStat,
  Tabs as ChakraTabs,
  Tooltip as ChakraTooltip,
  Popover as ChakraPopover,
  Tag,

  // System
  ChakraProvider,
  createSystem,
  defaultConfig,
  defineConfig,
} from '@chakra-ui/react'

// ============================================================
// 2. WRAPPER COMPONENTS — v2 API → v3 internals
// ============================================================

// --- Layout: VStack, HStack, Stack, SimpleGrid with `spacing` prop ---
import {
  VStack as V3VStack,
  HStack as V3HStack,
  Stack as V3Stack,
  SimpleGrid as V3SimpleGrid,
  Button as V3Button,
  IconButton as V3IconButton,
  Tooltip as V3Tooltip,
  Field as V3Field,
  Separator as V3Separator,
  Collapsible as V3Collapsible,
  Card as V3Card,
  Alert as V3Alert,
  Accordion as V3Accordion,
  NumberInput as V3NumberInput,
  Slider as V3Slider,
  Switch as V3Switch,
  RadioGroup as V3RadioGroup,
  Progress as V3Progress,
  Table as V3Table,
  Stat as V3Stat,
  Tabs as V3Tabs,
  NativeSelect as V3NativeSelect,
  Heading as V3Heading,
  Text as V3Text,
  Spinner as V3Spinner,
  Icon as V3Icon,
  Badge as V3Badge,
  Input as V3Input,
  Textarea as V3Textarea,
} from '@chakra-ui/react'

// --- Icon/Badge/Heading/Text/Spinner: accept any props (v2 compat) ---
export function Icon(props: any) {
  const { boxSize, ...rest } = props
  return <V3Icon {...rest} boxSize={boxSize} />
}
export function Badge(props: any) {
  return <V3Badge {...props} />
}

export function Heading(props: any) {
  return <V3Heading {...props} />
}
export function Text(props: any) {
  return <V3Text {...props} />
}
export function Input({ value, defaultValue, ...props }: any) {
  const normalizedProps: Record<string, unknown> = {
    ...props,
  }

  if (value !== undefined) {
    normalizedProps.value = value
  } else if (defaultValue !== undefined) {
    normalizedProps.defaultValue = defaultValue
  }

  return <V3Input {...normalizedProps} />
}
export function Textarea({ value, defaultValue, ...props }: any) {
  const normalizedProps: Record<string, unknown> = {
    ...props,
  }

  if (value !== undefined) {
    normalizedProps.value = value
  } else if (defaultValue !== undefined) {
    normalizedProps.defaultValue = defaultValue
  }

  return <V3Textarea {...normalizedProps} />
}
export function Spinner(props: any) {
  const { thickness, ...rest } = props
  return <V3Spinner borderWidth={thickness} {...rest} />
}

// VStack with spacing→gap
export function VStack({ spacing, ...props }: any) {
  return <V3VStack gap={spacing} {...props} />
}

// HStack with spacing→gap
export function HStack({ spacing, ...props }: any) {
  return <V3HStack gap={spacing} {...props} />
}

// Stack with spacing→gap
export function Stack({ spacing, ...props }: any) {
  return <V3Stack gap={spacing} {...props} />
}

// SimpleGrid with spacing→gap
export function SimpleGrid({ spacing, ...props }: any) {
  return <V3SimpleGrid gap={spacing} {...props} />
}

// --- Button with leftIcon/rightIcon + colorScheme→colorPalette ---
// Map v2 colorScheme names to theme-defined palettes (brand/accent/success/neutral)
const BUTTON_COLOR_MAP: Record<string, string> = {
  blue: 'brand',
  pink: 'accent',
  green: 'success',
  teal: 'success',
  gray: 'neutral',
  orange: 'accent',
  yellow: 'accent',
  red: 'red',
}
export function Button({ leftIcon, rightIcon, colorScheme, isDisabled, isLoading, ...props }: any) {
  const palette = BUTTON_COLOR_MAP[colorScheme] || colorScheme
  return (
    <V3Button colorPalette={palette} disabled={isDisabled || props.disabled} loading={isLoading || props.loading} {...props}>
      {leftIcon && <span style={{ marginRight: '0.5rem', display: 'inline-flex' }}>{leftIcon}</span>}
      {props.children}
      {rightIcon && <span style={{ marginLeft: '0.5rem', display: 'inline-flex' }}>{rightIcon}</span>}
    </V3Button>
  )
}

// --- IconButton with icon prop → children ---
export function IconButton({ icon, colorScheme, isDisabled, ...props }: any) {
  const palette = BUTTON_COLOR_MAP[colorScheme] || colorScheme
  return (
    <V3IconButton colorPalette={palette} disabled={isDisabled || props.disabled} {...props}>
      {icon}
    </V3IconButton>
  )
}

// --- Tooltip: label → content ---
export function Tooltip({ label, children, ...props }: any) {
  return (
    <V3Tooltip.Root>
      <V3Tooltip.Trigger asChild>{children}</V3Tooltip.Trigger>
      <V3Tooltip.Content>{label}</V3Tooltip.Content>
    </V3Tooltip.Root>
  )
}

// --- FormControl → Field.Root ---
export function FormControl({ isInvalid, isRequired, isDisabled, isReadOnly, children, ...props }: any) {
  const { ...rest } = props
  return (
    <V3Field.Root invalid={isInvalid} required={isRequired} disabled={isDisabled} readOnly={isReadOnly} {...rest}>
      {children}
    </V3Field.Root>
  )
}

export function FormLabel({ htmlFor, ...props }: any) {
  return (
    <label
      htmlFor={htmlFor}
      style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', display: 'block' }}
      {...props}
    />
  )
}

export function FormErrorMessage(props: any) {
  return <V3Field.ErrorText {...props} />
}

export function FormHelperText(props: any) {
  return <V3Field.HelperText {...props} />
}

// --- Divider → Separator ---
export function Divider(props: any) {
  return <V3Separator {...props} />
}

// --- Collapse → Collapsible ---
export function Collapse({ in: isOpen, animateOpacity, children, ...props }: any) {
  return (
    <V3Collapsible.Root open={isOpen} {...props}>
      <V3Collapsible.Content>{children}</V3Collapsible.Content>
    </V3Collapsible.Root>
  )
}

// --- Card compound → flat components ---
export function Card({ colorScheme, children, ...props }: any) {
  return (
    <V3Card.Root colorPalette={colorScheme} {...props}>
      {children}
    </V3Card.Root>
  )
}
export function CardBody(props: any) {
  return <V3Card.Body {...props} />
}
export function CardHeader(props: any) {
  return <V3Card.Header {...props} />
}
export function CardFooter(props: any) {
  return <V3Card.Footer {...props} />
}

// --- Alert compound → flat components ---
export function Alert({ status, colorScheme, children, ...props }: any) {
  return (
    <V3Alert.Root status={status} colorPalette={colorScheme} {...props}>
      {children}
    </V3Alert.Root>
  )
}
export function AlertIcon(props: any) {
  const { boxSize, ...rest } = props
  return <V3Alert.Indicator {...rest} size={boxSize} />
}
export function AlertTitle(props: any) {
  return <V3Alert.Title {...props} />
}
export function AlertDescription(props: any) {
  return <V3Alert.Description {...props} />
}

// --- Accordion compound → flat components ---
export function Accordion({ allowToggle, allowMultiple, colorScheme, children, ...props }: any) {
  return (
    <V3Accordion.Root collapsible={allowToggle} multiple={allowMultiple} colorPalette={colorScheme} {...props}>
      {children}
    </V3Accordion.Root>
  )
}
export function AccordionItem({ children, isDisabled, ...props }: any) {
  const reactId = React.useId()
  const val = props.value || reactId
  return <V3Accordion.Item value={val} disabled={isDisabled || props.disabled} {...props}>{children}</V3Accordion.Item>
}
export function AccordionButton(props: any) {
  return <V3Accordion.ItemTrigger {...props} />
}
export function AccordionPanel(props: any) {
  return <V3Accordion.ItemContent {...props} />
}
export function AccordionIcon(props: any) {
  return <V3Accordion.ItemIndicator {...props} />
}

// --- NumberInput compound → flat components ---
export function NumberInput({ onChange, colorScheme, value, defaultValue, children, ...props }: any) {
  const normalizedProps: Record<string, unknown> = {
    ...props,
    colorPalette: colorScheme,
    onValueChange: onChange
      ? (details: any) => onChange(details.valueAsString, details.valueAsNumber)
      : undefined,
  }

  if (value !== undefined) {
    normalizedProps.value = value === null ? '' : String(value)
  } else if (defaultValue !== undefined) {
    normalizedProps.defaultValue = defaultValue === null ? '' : String(defaultValue)
  }

  return <V3NumberInput.Root {...normalizedProps}>{children}</V3NumberInput.Root>
}
export function NumberInputField({ value, defaultValue, ...props }: any) {
  return <V3NumberInput.Input {...props} />
}
export function NumberInputStepper({ children }: any) {
  return (
    <V3NumberInput.Control>
      {children}
    </V3NumberInput.Control>
  )
}
export function NumberIncrementStepper(props: any) {
  return <V3NumberInput.IncrementTrigger {...props} />
}
export function NumberDecrementStepper(props: any) {
  return <V3NumberInput.DecrementTrigger {...props} />
}

// --- Slider compound → flat components ---
export function SliderComp({ onChange, colorScheme, value, defaultValue, children, ...props }: any) {
  const normalizedProps: Record<string, unknown> = {
    ...props,
    colorPalette: colorScheme,
    onValueChange: onChange
      ? (details: any) => onChange(Array.isArray(details?.value) ? details.value[0] : details?.value)
      : undefined,
  }

  if (value !== undefined) {
    normalizedProps.value = Array.isArray(value) ? value : [value]
  } else if (defaultValue !== undefined) {
    normalizedProps.defaultValue = Array.isArray(defaultValue) ? defaultValue : [defaultValue]
  }

  return <V3Slider.Root {...normalizedProps}>{children}</V3Slider.Root>
}
export { SliderComp as Slider }
export function SliderTrack(props: any) {
  return (
    <V3Slider.Control>
      <V3Slider.HiddenInput />
      <V3Slider.Track {...props} />
    </V3Slider.Control>
  )
}
export function SliderFilledTrack(props: any) {
  return <V3Slider.Range {...props} />
}
export function SliderThumb(props: any) {
  const { boxSize, ...rest } = props
  return (
    <V3Slider.Thumb index={0} {...rest} size={boxSize} />
  )
}

// --- Switch ---
export function Switch({ isChecked, defaultChecked, onChange, colorScheme, isDisabled, name, ref: externalRef, onBlur, children, ...props }: any) {
  const normalizedProps: Record<string, unknown> = {
    ...props,
    colorPalette: colorScheme,
    disabled: isDisabled || props.disabled,
    onCheckedChange: onChange
      ? (details: any) => onChange({ target: { type: 'checkbox', checked: details.checked, name } })
      : undefined,
  }

  if (isChecked !== undefined) {
    normalizedProps.checked = isChecked
  } else if (defaultChecked !== undefined) {
    normalizedProps.defaultChecked = defaultChecked
  }

  return (
    <V3Switch.Root {...normalizedProps}>
      <V3Switch.HiddenInput name={name} ref={externalRef} onBlur={onBlur} />
      <V3Switch.Control>
        <V3Switch.Thumb />
      </V3Switch.Control>
      {children && <V3Switch.Label>{children}</V3Switch.Label>}
    </V3Switch.Root>
  )
}

// --- RadioGroup + Radio ---
export function RadioGroup({ value, defaultValue, onChange, colorScheme, children, ...props }: any) {
  const normalizedProps: Record<string, unknown> = {
    ...props,
    colorPalette: colorScheme,
    onValueChange: onChange
      ? (details: any) => onChange(typeof details === 'string' ? details : details?.value)
      : undefined,
  }

  if (value !== undefined) {
    normalizedProps.value = value
  } else if (defaultValue !== undefined) {
    normalizedProps.defaultValue = defaultValue
  }

  return <V3RadioGroup.Root {...normalizedProps}>{children}</V3RadioGroup.Root>
}
export function Radio({ value, colorScheme, children, ...props }: any) {
  return (
    <V3RadioGroup.Item value={value} colorPalette={colorScheme} {...props}>
      <V3RadioGroup.ItemHiddenInput />
      <V3RadioGroup.ItemIndicator />
      <V3RadioGroup.ItemText>{children}</V3RadioGroup.ItemText>
    </V3RadioGroup.Item>
  )
}

// --- Select → NativeSelect ---
export function Select({ colorScheme, children, value, defaultValue, ...props }: any) {
  const normalizedProps: Record<string, unknown> = {
    ...props,
  }

  if (value !== undefined) {
    normalizedProps.value = value
  } else if (defaultValue !== undefined) {
    normalizedProps.defaultValue = defaultValue
  }

  return (
    <V3NativeSelect.Root colorPalette={colorScheme}>
      <V3NativeSelect.Field {...normalizedProps}>{children}</V3NativeSelect.Field>
      <V3NativeSelect.Indicator />
    </V3NativeSelect.Root>
  )
}

// --- Progress ---
export function Progress({ value, colorScheme, hasStripe, isAnimated, ...props }: any) {
  return (
    <V3Progress.Root value={value} striped={hasStripe} animated={isAnimated} colorPalette={colorScheme} {...props}>
      <V3Progress.Track>
        <V3Progress.Range />
      </V3Progress.Track>
    </V3Progress.Root>
  )
}

// --- Table compound → flat components ---
export function Table({ colorScheme, children, ...props }: any) {
  return <V3Table.Root colorPalette={colorScheme} {...props}>{children}</V3Table.Root>
}
export function TableContainer({ children, ...props }: any) {
  return <div style={{ overflowX: 'auto' }} {...props}>{children}</div>
}
export function Thead(props: any) {
  return <V3Table.Header {...props} />
}
export function Tbody(props: any) {
  return <V3Table.Body {...props} />
}
export function Tfoot(props: any) {
  return <V3Table.Footer {...props} />
}
export function Tr(props: any) {
  return <V3Table.Row {...props} />
}
export function Th(props: any) {
  return <V3Table.ColumnHeader {...props} />
}
export function Td(props: any) {
  return <V3Table.Cell {...props} />
}

// --- Stat compound → flat components ---
export function Stat({ colorScheme, children, ...props }: any) {
  return <V3Stat.Root colorPalette={colorScheme} {...props}>{children}</V3Stat.Root>
}
export function StatLabel(props: any) {
  return <V3Stat.Label {...props} />
}
export function StatNumber(props: any) {
  return <V3Stat.ValueText {...props} />
}
export function StatHelpText(props: any) {
  return <V3Stat.HelpText {...props} />
}
export function StatArrow({ type, ...props }: any) {
  return type === 'increase' ? <V3Stat.UpIndicator {...props} /> : <V3Stat.DownIndicator {...props} />
}
export function StatGroup({ children, ...props }: any) {
  return <div style={{ display: 'flex', gap: '1rem' }} {...props}>{children}</div>
}

// --- Tabs compound → flat components ---
export function Tabs({ colorScheme, index, value, defaultValue, onChange, ...props }: any) {
  const normalizedProps: Record<string, unknown> = {
    ...props,
    colorPalette: colorScheme,
    onValueChange: onChange
      ? (details: any) => onChange(Number(details.value))
      : undefined,
  }

  if (value !== undefined) {
    normalizedProps.value = String(value)
  } else if (index !== undefined && !defaultValue) {
    normalizedProps.defaultValue = String(index)
  } else if (defaultValue !== undefined) {
    normalizedProps.defaultValue = String(defaultValue)
  }

  return <V3Tabs.Root {...normalizedProps}>{props.children}</V3Tabs.Root>
}
export function TabList(props: any) {
  return <V3Tabs.List {...props} />
}
export function Tab({ children, ...props }: any) {
  const tabValue = props.value ?? String(props.index ?? 0)
  return <V3Tabs.Trigger value={tabValue} {...props}>{children}</V3Tabs.Trigger>
}
export function TabPanels({ children }: any) {
  return <>{children}</>
}
export function TabPanel({ children, ...props }: any) {
  const panelValue = props.value ?? String(props.index ?? 0)
  return <V3Tabs.Content value={panelValue} {...props}>{children}</V3Tabs.Content>
}

// ============================================================
// 3. REMOVED HOOKS — compatibility shims
// ============================================================

export function useColorMode() {
  return { colorMode: 'light' as const, toggleColorMode: () => {} }
}

export function useColorModeValue<T>(light: T, _dark: T): T {
  return light
}

// Singleton toaster instance — shared across all components
export const smpToaster = createToaster({
  placement: 'top',
  pauseOnPageIdle: true,
})

export function useToast() {
  return (opts: any) => {
    if (!opts) return
    smpToaster.create({
      title: opts.title ?? undefined,
      description: opts.description ?? undefined,
      type: opts.status === 'error' ? 'error'
        : opts.status === 'warning' ? 'warning'
        : opts.status === 'info' ? 'info'
        : 'success',
      duration: opts.duration ?? 3000,
    })
  }
}

// ============================================================
// 4. MISC re-exports
// ============================================================

// StackDivider equivalent
export function StackDivider(props: any) {
  return <V3Separator {...props} />
}

// CircularProgress (removed in v3 - use Progress instead)
export function CircularProgress({ value, size, color, ...props }: any) {
  return (
    <V3Progress.Root value={value} colorPalette={color} size={size} {...props}>
      <V3Progress.Track>
        <V3Progress.Range />
      </V3Progress.Track>
    </V3Progress.Root>
  )
}
export function CircularProgressLabel({ children }: any) {
  return <span>{children}</span>
}

// WrapItem
export function WrapItem({ children, ...props }: any) {
  return <div {...props}>{children}</div>
}

// --- List compound → flat components ---
export function List({ spacing, children, ...props }: any) {
  return <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: spacing ? `${spacing * 4}px` : undefined }} {...props}>{children}</ul>
}
export function ListItem({ children, ...props }: any) {
  return <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} {...props}>{children}</li>
}
export function ListIcon({ as: IconComp, color, ...props }: any) {
  if (!IconComp) return null
  return <IconComp style={{ color, flexShrink: 0 }} {...props} />
}

// --- Popover compound → flat components ---
import { Popover as V3Popover, Portal as V3Portal } from '@chakra-ui/react'
export function Popover({ children, ...props }: any) {
  return <V3Popover.Root {...props}>{children}</V3Popover.Root>
}
export function PopoverTrigger({ children, ...props }: any) {
  return <V3Popover.Trigger asChild {...props}>{children}</V3Popover.Trigger>
}
export function PopoverContent({ children, ...props }: any) {
  return <V3Popover.Content {...props}>{children}</V3Popover.Content>
}
export function PopoverHeader({ children, ...props }: any) {
  return <V3Popover.Header {...props}>{children}</V3Popover.Header>
}
export function PopoverBody({ children, ...props }: any) {
  return <V3Popover.Body {...props}>{children}</V3Popover.Body>
}
export function PopoverCloseButton(props: any) {
  return <V3Popover.CloseTrigger {...props} />
}

// --- Portal ---
export function Portal({ children }: any) {
  return <>{children}</>
}

// --- useDisclosure ---
export function useDisclosure(defaultOpen = false) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  return {
    isOpen,
    onOpen: () => setIsOpen(true),
    onClose: () => setIsOpen(false),
    onToggle: () => setIsOpen(v => !v),
  }
}

// --- Skeleton compound ---
import { Skeleton as V3Skeleton, SkeletonText as V3SkeletonText } from '@chakra-ui/react'
export function SkeletonCircle(props: any) {
  return <V3Skeleton borderRadius="full" {...props} />
}

// SkeletonText with spacing→gap
export function SkeletonTextCompat({ spacing, noOfLines, ...props }: any) {
  return <V3SkeletonText lineClamp={noOfLines} gap={spacing} {...props} />
}
export { SkeletonTextCompat as SkeletonText }

// --- UnorderedList alias ---
export { List as UnorderedList }

// ============================================================
// 5. @chakra-ui/icons EQUIVALENTS (v2 icons → react-icons)
// ============================================================
import {
  LuPlus,
  LuTrash2,
  LuChevronDown,
  LuChevronUp,
  LuChevronLeft,
  LuChevronRight,
  LuCheck,
  LuMoon,
  LuSun,
} from 'react-icons/lu'

function normalizeLucideProps(props: any) {
  const { boxSize, ...rest } = props || {}
  if (boxSize === undefined) return rest
  return {
    ...rest,
    size: rest.size ?? boxSize,
  }
}

export function AddIcon(props: any) { return <LuPlus {...normalizeLucideProps(props)} /> }
export function DeleteIcon(props: any) { return <LuTrash2 {...normalizeLucideProps(props)} /> }
export function ChevronDownIcon(props: any) { return <LuChevronDown {...normalizeLucideProps(props)} /> }
export function ChevronUpIcon(props: any) { return <LuChevronUp {...normalizeLucideProps(props)} /> }
export function ChevronLeftIcon(props: any) { return <LuChevronLeft {...normalizeLucideProps(props)} /> }
export function ChevronRightIcon(props: any) { return <LuChevronRight {...normalizeLucideProps(props)} /> }
export function CheckIcon(props: any) { return <LuCheck {...normalizeLucideProps(props)} /> }
export function MoonIcon(props: any) { return <LuMoon {...normalizeLucideProps(props)} /> }
export function SunIcon(props: any) { return <LuSun {...normalizeLucideProps(props)} /> }

// ============================================================
// 6. Checkbox (v2 → v3)
// ============================================================
import { Checkbox as V3Checkbox } from '@chakra-ui/react'

export function Checkbox({ isChecked, defaultChecked, onChange, colorScheme, isDisabled, children, value, name, ref: externalRef, onBlur, ...props }: any) {
  const normalizedProps: Record<string, unknown> = {
    ...props,
    colorPalette: colorScheme,
    disabled: isDisabled || props.disabled,
    onCheckedChange: onChange
      ? (details: any) => onChange({ target: { type: 'checkbox', checked: details.checked, name, value } })
      : undefined,
  }

  if (isChecked !== undefined) {
    normalizedProps.checked = isChecked
  } else if (defaultChecked !== undefined) {
    normalizedProps.defaultChecked = defaultChecked
  }

  return (
    <V3Checkbox.Root {...normalizedProps}>
      <V3Checkbox.HiddenInput name={name} value={value} ref={externalRef} onBlur={onBlur} />
      <V3Checkbox.Control>
        <V3Checkbox.Indicator />
      </V3Checkbox.Control>
      {children && <V3Checkbox.Label>{children}</V3Checkbox.Label>}
    </V3Checkbox.Root>
  )
}

// ============================================================
// 7. extendTheme shim (v2 → v3 createSystem)
// ============================================================
export function extendTheme(config: any) {
  return config
}

// ============================================================
// 8. MotionBox / MotionContainer / MotionCard / MotionCircle
//    Replaces motion.create(Box) which crashes in Chakra v3
//    Uses chakra() factory to create styled motion components
// ============================================================
import { chakra } from '@chakra-ui/react'
import { motion } from 'framer-motion'

export const MotionBox = chakra(motion.div) as any
export const MotionContainer = chakra(motion.div) as any
export const MotionCard = chakra(motion.div) as any
export const MotionCircle = chakra(motion.div) as any
