import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'

declare module '@/app/_common/components/ui/Popover' {
  export const Popover: typeof PopoverPrimitive.Root
  export const PopoverTrigger: typeof PopoverPrimitive.Trigger
  export const PopoverAnchor: typeof PopoverPrimitive.Anchor
  export type PopoverContentProps = PopoverPrimitive.PopoverContentProps & {
    children?: React.ReactNode
  }
  export const PopoverContent: React.ForwardRefExoticComponent<
    PopoverContentProps & React.RefAttributes<HTMLDivElement>
  >
}
