# Bento Grid Design System

A modern, asymmetric grid layout system inspired by Japanese bento boxes. The Bento Grid creates visual hierarchy through varied card sizes and positions.

## Components

### BentoGrid

The container component that creates the grid layout.

```tsx
import { BentoGrid } from '@/components/ui/bento'

<BentoGrid 
  cols={{ mobile: 1, tablet: 4, desktop: 6 }} 
  gap={4}
>
  {/* BentoCard components */}
</BentoGrid>
```

**Props:**
- `cols` - Responsive column configuration
  - `mobile` - Columns on mobile (default: 1)
  - `tablet` - Columns on tablet (default: 4)
  - `desktop` - Columns on desktop (default: 6)
- `rows` - Number of rows (optional)
- `gap` - Gap between cards (default: 4)

### BentoCard

The basic card component that can span multiple columns and rows.

```tsx
import { BentoCard } from '@/components/ui/bento'

<BentoCard 
  span={{ cols: 2, rows: 1 }}
  variant="hero"
  hoverable
>
  <h3>Card Title</h3>
  <p>Card content</p>
</BentoCard>
```

**Props:**
- `span` - Grid span configuration
  - `cols` - Number of columns to span (default: 1)
  - `rows` - Number of rows to span (default: 1)
- `variant` - Visual variant
  - `default` - Standard card
  - `hero` - Highlighted with gradient
  - `accent` - Subtle accent color
  - `gradient` - Colorful gradient
- `hoverable` - Enable hover effects (default: false)

**Sub-components:**
- `BentoCardHeader` - Card header section
- `BentoCardTitle` - Card title
- `BentoCardDescription` - Card description
- `BentoCardContent` - Card content area

### BentoKPI

Specialized component for displaying KPIs (Key Performance Indicators).

```tsx
import { BentoKPI } from '@/components/ui/bento'
import { UsersIcon } from 'lucide-react'

<BentoKPI
  span={{ cols: 2, rows: 1 }}
  variant="hero"
  title="Clients Actifs"
  value="1,234"
  change={{ value: 12.5, trend: 'up' }}
  icon={<UsersIcon className="h-5 w-5" />}
  description="vs mois dernier"
/>
```

**Props:**
- All BentoCard props
- `title` - KPI title
- `value` - KPI value (string or number)
- `change` - Change indicator (optional)
  - `value` - Percentage change
  - `trend` - 'up' or 'down'
- `icon` - Icon component (optional)
- `description` - Additional description (optional)
- `loading` - Show loading state (default: false)

### BentoChart

Specialized component for displaying charts.

```tsx
import { BentoChart } from '@/components/ui/bento'
import { LineChart } from '@/components/charts'

<BentoChart
  span={{ cols: 4, rows: 3 }}
  variant="hero"
  title="Évolution du Patrimoine"
  description="Projection sur 12 mois"
  chart={<LineChart data={data} />}
  actions={<Button>Export</Button>}
/>
```

**Props:**
- All BentoCard props
- `title` - Chart title
- `description` - Chart description (optional)
- `chart` - Chart component
- `actions` - Action buttons (optional)
- `loading` - Show loading state (default: false)

### BentoSkeleton

Loading skeleton that matches the Bento Grid layout.

```tsx
import { BentoSkeleton } from '@/components/ui/bento'

<BentoSkeleton 
  span={{ cols: 2, rows: 1 }}
  variant="kpi"
/>
```

**Props:**
- `span` - Grid span configuration
- `variant` - Skeleton type
  - `kpi` - KPI skeleton
  - `chart` - Chart skeleton
  - `card` - Generic card skeleton

## Layout Patterns

### Dashboard KPIs

```tsx
<BentoGrid cols={{ mobile: 1, tablet: 4, desktop: 6 }}>
  {/* Hero KPI - Larger */}
  <BentoKPI
    span={{ cols: 2, rows: 2 }}
    variant="hero"
    title="Clients Actifs"
    value="1,234"
  />
  
  {/* Regular KPIs */}
  <BentoKPI span={{ cols: 2, rows: 1 }} title="Nouveaux" value="45" />
  <BentoKPI span={{ cols: 2, rows: 1 }} title="Rendez-vous" value="23" />
</BentoGrid>
```

### Chart Hero (Simple Calculators)

```tsx
<BentoGrid cols={{ mobile: 1, tablet: 4, desktop: 6 }}>
  {/* Main Chart - Hero */}
  <BentoChart
    span={{ cols: 4, rows: 3 }}
    variant="hero"
    title="Projection Fiscale"
    chart={<LineChart />}
  />
  
  {/* Satellite KPIs */}
  <BentoKPI span={{ cols: 2, rows: 1 }} title="Impôt Total" value="€45K" />
  <BentoKPI span={{ cols: 2, rows: 1 }} title="Taux Effectif" value="28%" />
  <BentoKPI span={{ cols: 2, rows: 1 }} title="Économie" value="€12K" />
</BentoGrid>
```

### Dual Charts (Complex Calculators)

```tsx
<BentoGrid cols={{ mobile: 1, tablet: 4, desktop: 6 }}>
  {/* Health Indicator - Full Width */}
  <BentoCard span={{ cols: 6, rows: 1 }} variant="gradient">
    <HealthIndicator score={92} />
  </BentoCard>
  
  {/* Two Charts Side by Side */}
  <BentoChart span={{ cols: 3, rows: 3 }} title="Chart 1" chart={<PieChart />} />
  <BentoChart span={{ cols: 3, rows: 3 }} title="Chart 2" chart={<BarChart />} />
  
  {/* Small KPIs */}
  <BentoKPI span={{ cols: 2, rows: 1 }} title="KPI 1" value="€350K" />
  <BentoKPI span={{ cols: 2, rows: 1 }} title="KPI 2" value="€1.2M" />
  <BentoKPI span={{ cols: 2, rows: 1 }} title="KPI 3" value="€950K" />
</BentoGrid>
```

### Timeline (Simulators)

```tsx
<BentoGrid cols={{ mobile: 1, tablet: 4, desktop: 6 }}>
  {/* Feasibility - Full Width */}
  <BentoCard span={{ cols: 6, rows: 1 }} variant="hero">
    <FeasibilityIndicator status="FEASIBLE" />
  </BentoCard>
  
  {/* Timeline - Large Hero */}
  <BentoChart
    span={{ cols: 4, rows: 4 }}
    variant="hero"
    title="Projection Retraite"
    chart={<TimelineChart />}
  />
  
  {/* Vertical KPI Sidebar */}
  <BentoKPI span={{ cols: 2, rows: 2 }} title="Capital Final" value="€2.5M" />
  <BentoKPI span={{ cols: 2, rows: 2 }} title="Rente Mensuelle" value="€8K" />
</BentoGrid>
```

## Responsive Behavior

The Bento Grid automatically adapts to different screen sizes:

- **Mobile (< 768px)**: Single column, all cards stack vertically
- **Tablet (768px - 1024px)**: 4 columns, cards adapt their spans
- **Desktop (> 1024px)**: 6-8 columns, full asymmetric layout

All transitions are smooth (300ms) and use CSS Grid for optimal performance.

## Dark Mode

All Bento components support dark mode automatically through Tailwind's dark mode classes.

```tsx
// Dark mode is handled automatically
<BentoCard variant="hero">
  {/* Automatically adapts to dark mode */}
</BentoCard>
```

## Accessibility

- All cards have proper ARIA labels and roles
- Keyboard navigation is fully supported
- Focus indicators are visible
- Screen reader compatible
- Supports 200% zoom

## Performance

- Uses CSS Grid (no JavaScript for layout)
- GPU-accelerated transitions
- Lazy loading support for charts
- Single paint cycle rendering
- Optimized for 60fps animations

## Examples

See `BentoExample.tsx` for complete working examples of all patterns.

## Migration Guide

When migrating existing components to Bento Grid:

1. Replace uniform grids with BentoGrid
2. Identify hero elements (make them larger with span)
3. Use appropriate variants (hero, accent, gradient)
4. Add loading states with BentoSkeleton
5. Test responsive behavior on all screen sizes

## Best Practices

1. **Visual Hierarchy**: Use larger spans for important content
2. **Variants**: Use hero variant sparingly (1-2 per grid)
3. **Consistency**: Maintain consistent gap sizes
4. **Loading States**: Always provide skeleton loaders
5. **Responsive**: Test on mobile, tablet, and desktop
6. **Accessibility**: Include proper ARIA labels
7. **Performance**: Lazy load charts outside viewport

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

All modern browsers with CSS Grid support.
