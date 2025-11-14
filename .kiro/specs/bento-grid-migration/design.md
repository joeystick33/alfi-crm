# Design Document - Migration Bento Grid

## Overview

Ce document décrit l'architecture et le design détaillé de la migration vers un système Bento Grid pour le CRM ALFI. La solution se concentre sur la création d'un design system réutilisable et de templates pour migrer efficacement les 4 zones prioritaires : Dashboard, Client360, Calculateurs et Simulateurs.

L'approche privilégie la réutilisabilité, la performance et une migration progressive sans rupture de service.

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  (Dashboard, Client360, Calculators, Simulators)        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│              Template Layer                              │
│  - ChartHeroTemplate                                     │
│  - DualChartsTemplate                                    │
│  - TimelineTemplate                                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│           Bento Component Layer                          │
│  - BentoGrid                                             │
│  - BentoCard                                             │
│  - BentoKPI                                              │
│  - BentoChart                                            │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│              Design System Layer                         │
│  - CSS Variables                                         │
│  - Tailwind Config                                       │
│  - Theme Provider                                        │
└──────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
BentoGrid
├── BentoCard (variant="hero")
│   └── Chart Component
├── BentoCard (variant="default")
│   └── KPI Component
├── BentoCard (variant="accent")
│   └── Summary Component
└── BentoCard (variant="gradient")
    └── Alert Component
```

---

## Components and Interfaces

### 1. BentoGrid Component

**Purpose:** Container component that manages the grid layout and responsive behavior.

**Props Interface:**
```typescript
interface BentoGridProps {
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  rows?: number
  gap?: number | string
  className?: string
  children: React.ReactNode
  responsive?: 'stack' | 'adapt' | 'custom'
}
```

**Implementation Details:**
```tsx
export function BentoGrid({
  cols = { mobile: 1, tablet: 4, desktop: 6 },
  rows,
  gap = 4,
  className,
  children,
  responsive = 'adapt'
}: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid w-full',
        `gap-${gap}`,
        // Mobile: single column
        'grid-cols-1',
        // Tablet: 4 columns
        `md:grid-cols-${cols.tablet}`,
        // Desktop: 6-8 columns
        `lg:grid-cols-${cols.desktop}`,
        rows && `grid-rows-${rows}`,
        className
      )}
      style={{
        gridAutoRows: 'minmax(120px, auto)'
      }}
    >
      {children}
    </div>
  )
}
```

**CSS Grid Configuration:**
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(var(--bento-cols), 1fr);
  grid-auto-rows: minmax(120px, auto);
  gap: var(--bento-gap);
  transition: grid-template-columns 300ms ease;
}

@media (max-width: 768px) {
  .bento-grid {
    --bento-cols: 1;
  }
}

@media (min-width: 768px) and (max-width: 1024px) {
  .bento-grid {
    --bento-cols: 4;
  }
}

@media (min-width: 1024px) {
  .bento-grid {
    --bento-cols: 6;
  }
}
```

---

### 2. BentoCard Component

**Purpose:** Individual card component that can span multiple columns and rows.

**Props Interface:**
```typescript
interface BentoCardProps {
  span?: {
    cols?: number
    rows?: number
  }
  variant?: 'default' | 'hero' | 'accent' | 'gradient'
  className?: string
  children: React.ReactNode
  onClick?: () => void
  hoverable?: boolean
}
```

**Implementation Details:**
```tsx
export function BentoCard({
  span = { cols: 1, rows: 1 },
  variant = 'default',
  className,
  children,
  onClick,
  hoverable = false
}: BentoCardProps) {
  const variantStyles = {
    default: 'bg-card border border-border',
    hero: 'bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20',
    accent: 'bg-accent border border-accent-foreground/10',
    gradient: 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border border-blue-200 dark:border-blue-800'
  }

  return (
    <div
      className={cn(
        'rounded-lg p-6 shadow-sm transition-all duration-200',
        variantStyles[variant],
        hoverable && 'hover:shadow-md hover:scale-[1.02] cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        gridColumn: `span ${span.cols}`,
        gridRow: `span ${span.rows}`
      }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
```

**Responsive Behavior:**
```tsx
// On mobile, all cards become full-width
@media (max-width: 768px) {
  .bento-card {
    grid-column: span 1 !important;
    grid-row: span 1 !important;
  }
}
```

---

### 3. BentoKPI Component

**Purpose:** Specialized card for displaying KPIs with consistent styling.

**Props Interface:**
```typescript
interface BentoKPIProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  variant?: 'default' | 'success' | 'warning' | 'error'
  span?: { cols?: number; rows?: number }
}
```

**Implementation Details:**
```tsx
export function BentoKPI({
  label,
  value,
  icon,
  trend,
  variant = 'default',
  span = { cols: 2, rows: 1 }
}: BentoKPIProps) {
  const variantColors = {
    default: 'from-blue-50 to-blue-100 border-blue-200 text-blue-900',
    success: 'from-green-50 to-green-100 border-green-200 text-green-900',
    warning: 'from-orange-50 to-orange-100 border-orange-200 text-orange-900',
    error: 'from-red-50 to-red-100 border-red-200 text-red-900'
  }

  return (
    <BentoCard 
      span={span}
      className={cn(
        'bg-gradient-to-br border',
        variantColors[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium opacity-70 mb-1">
            {label}
          </div>
          <div className="text-2xl font-bold">
            {value}
          </div>
          {trend && (
            <div className={cn(
              'text-xs mt-1 flex items-center gap-1',
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            )}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
            </div>
          )}
        </div>
        {icon && (
          <div className="opacity-50">
            {icon}
          </div>
        )}
      </div>
    </BentoCard>
  )
}
```

---

### 4. BentoChart Component

**Purpose:** Wrapper for charts with consistent sizing and styling in Bento Grid.

**Props Interface:**
```typescript
interface BentoChartProps {
  title?: string
  description?: string
  span?: { cols?: number; rows?: number }
  variant?: 'default' | 'hero'
  children: React.ReactNode
}
```

**Implementation Details:**
```tsx
export function BentoChart({
  title,
  description,
  span = { cols: 4, rows: 3 },
  variant = 'default',
  children
}: BentoChartProps) {
  return (
    <BentoCard 
      span={span}
      variant={variant}
      className="flex flex-col"
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </BentoCard>
  )
}
```

---

## Templates

### 1. ChartHeroTemplate

**Purpose:** Template for simple calculators with one main chart and KPIs.

**Usage:**
```tsx
<ChartHeroTemplate
  inputs={<CalculatorInputs />}
  chart={<BarChart data={data} />}
  kpis={[
    { label: 'Total', value: '50,000€' },
    { label: 'Tax', value: '10,000€' }
  ]}
  details={<DetailTable />}
/>
```

**Layout Structure:**
```
┌─────────────────────────────────────────┐
│ Inputs (full width)                     │
├──────────────────────────┬──────────────┤
│                          │ ┌──────────┐ │
│                          │ │  KPI 1   │ │
│      CHART (HERO)        │ └──────────┘ │
│      4 cols x 3 rows     │ ┌──────────┐ │
│                          │ │  KPI 2   │ │
│                          │ └──────────┘ │
│                          │ ┌──────────┐ │
│                          │ │  KPI 3   │ │
├──────────────────────────┴──────────────┤
│ Details (full width)                    │
└─────────────────────────────────────────┘
```

**Implementation:**
```tsx
export function ChartHeroTemplate({
  inputs,
  chart,
  kpis,
  details
}: ChartHeroTemplateProps) {
  return (
    <div className="space-y-6">
      {/* Inputs Section */}
      <Card className="p-6">
        {inputs}
      </Card>

      {/* Main Bento Grid */}
      <BentoGrid cols={{ mobile: 1, tablet: 4, desktop: 6 }}>
        {/* Hero Chart */}
        <BentoChart
          span={{ cols: 4, rows: 3 }}
          variant="hero"
        >
          {chart}
        </BentoChart>

        {/* KPIs Sidebar */}
        <div className="col-span-2 space-y-4">
          {kpis.map((kpi, index) => (
            <BentoKPI
              key={index}
              span={{ cols: 2, rows: 1 }}
              {...kpi}
            />
          ))}
        </div>

        {/* Details Section */}
        {details && (
          <BentoCard span={{ cols: 6, rows: 1 }}>
            {details}
          </BentoCard>
        )}
      </BentoGrid>
    </div>
  )
}
```

---

### 2. DualChartsTemplate

**Purpose:** Template for complex calculators with two charts side by side.

**Layout Structure:**
```
┌─────────────────────────────────────────┐
│ Health Indicator (full width, hero)     │
├─────────────────────┬───────────────────┤
│                     │                   │
│   CHART 1           │   CHART 2         │
│   4 cols x 3 rows   │   4 cols x 3 rows │
│                     │                   │
├──────┬──────┬───────┴──────┬────────────┤
│ KPI1 │ KPI2 │ KPI3         │ KPI4       │
└──────┴──────┴──────────────┴────────────┘
```

**Implementation:**
```tsx
export function DualChartsTemplate({
  inputs,
  healthIndicator,
  chart1,
  chart2,
  kpis
}: DualChartsTemplateProps) {
  return (
    <div className="space-y-6">
      {/* Inputs */}
      <Card className="p-6">
        {inputs}
      </Card>

      <BentoGrid cols={{ mobile: 1, tablet: 4, desktop: 8 }}>
        {/* Health Indicator */}
        {healthIndicator && (
          <BentoCard 
            span={{ cols: 8, rows: 1 }}
            variant="gradient"
          >
            {healthIndicator}
          </BentoCard>
        )}

        {/* Charts Side by Side */}
        <BentoChart span={{ cols: 4, rows: 3 }}>
          {chart1}
        </BentoChart>
        <BentoChart span={{ cols: 4, rows: 3 }}>
          {chart2}
        </BentoChart>

        {/* KPIs Row */}
        {kpis.map((kpi, index) => (
          <BentoKPI
            key={index}
            span={{ cols: 2, rows: 1 }}
            {...kpi}
          />
        ))}
      </BentoGrid>
    </div>
  )
}
```

---

### 3. TimelineTemplate

**Purpose:** Template for simulators with timeline projections.

**Layout Structure:**
```
┌─────────────────────────────────────────┐
│ Feasibility Indicator (full width)      │
├──────────────────────────┬──────────────┤
│                          │ ┌──────────┐ │
│                          │ │  KPI 1   │ │
│                          │ │ 2x2 span │ │
│   TIMELINE CHART         │ └──────────┘ │
│   6 cols x 4 rows        │ ┌──────────┐ │
│                          │ │  KPI 2   │ │
│                          │ │ 2x2 span │ │
│                          │ └──────────┘ │
├──────────────────────────┴──────────────┤
│ Secondary Chart (4 cols x 2 rows)       │
├─────────────────────────────────────────┤
│ Recommendations (full width)            │
└─────────────────────────────────────────┘
```

**Implementation:**
```tsx
export function TimelineTemplate({
  inputs,
  feasibilityIndicator,
  timelineChart,
  kpis,
  secondaryChart,
  recommendations
}: TimelineTemplateProps) {
  return (
    <div className="space-y-6">
      {/* Inputs */}
      <Card className="p-6">
        {inputs}
      </Card>

      <BentoGrid cols={{ mobile: 1, tablet: 4, desktop: 8 }}>
        {/* Feasibility */}
        {feasibilityIndicator && (
          <BentoCard 
            span={{ cols: 8, rows: 1 }}
            variant="gradient"
          >
            {feasibilityIndicator}
          </BentoCard>
        )}

        {/* Timeline Chart (Hero) */}
        <BentoChart 
          span={{ cols: 6, rows: 4 }}
          variant="hero"
        >
          {timelineChart}
        </BentoChart>

        {/* KPIs Sidebar */}
        <div className="col-span-2 space-y-4">
          {kpis.map((kpi, index) => (
            <BentoKPI
              key={index}
              span={{ cols: 2, rows: 2 }}
              {...kpi}
            />
          ))}
        </div>

        {/* Secondary Chart */}
        {secondaryChart && (
          <BentoChart span={{ cols: 4, rows: 2 }}>
            {secondaryChart}
          </BentoChart>
        )}

        {/* Recommendations */}
        {recommendations && (
          <BentoCard span={{ cols: 8, rows: 1 }}>
            {recommendations}
          </BentoCard>
        )}
      </BentoGrid>
    </div>
  )
}
```

---

## Data Models

### BentoGridConfig

```typescript
interface BentoGridConfig {
  cols: {
    mobile: number
    tablet: number
    desktop: number
  }
  rows?: number
  gap: number
  responsive: 'stack' | 'adapt' | 'custom'
}
```

### BentoCardConfig

```typescript
interface BentoCardConfig {
  id: string
  span: {
    cols: number
    rows: number
  }
  variant: 'default' | 'hero' | 'accent' | 'gradient'
  content: React.ReactNode
  responsive?: {
    mobile?: { cols: number; rows: number }
    tablet?: { cols: number; rows: number }
  }
}
```

### TemplateConfig

```typescript
interface TemplateConfig {
  type: 'chart-hero' | 'dual-charts' | 'timeline'
  gridConfig: BentoGridConfig
  cards: BentoCardConfig[]
}
```

---

## Error Handling

### Error Boundary for Bento Components

```tsx
class BentoErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Bento Grid Error:', error, errorInfo)
    // Log to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <BentoCard variant="default">
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
            <p className="text-sm text-muted-foreground">
              Une erreur est survenue lors du chargement de ce composant
            </p>
          </div>
        </BentoCard>
      )
    }

    return this.props.children
  }
}
```

### Graceful Degradation

```tsx
function SafeBentoGrid({ children, ...props }: BentoGridProps) {
  const [supportsGrid, setSupportsGrid] = useState(true)

  useEffect(() => {
    // Check CSS Grid support
    const supported = CSS.supports('display', 'grid')
    setSupportsGrid(supported)
  }, [])

  if (!supportsGrid) {
    // Fallback to flexbox layout
    return (
      <div className="flex flex-col gap-4">
        {children}
      </div>
    )
  }

  return <BentoGrid {...props}>{children}</BentoGrid>
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('BentoGrid', () => {
  it('should render with correct grid columns', () => {
    render(
      <BentoGrid cols={{ mobile: 1, tablet: 4, desktop: 6 }}>
        <BentoCard>Test</BentoCard>
      </BentoGrid>
    )
    
    const grid = screen.getByRole('grid')
    expect(grid).toHaveClass('grid-cols-1')
    expect(grid).toHaveClass('md:grid-cols-4')
    expect(grid).toHaveClass('lg:grid-cols-6')
  })

  it('should apply correct span to cards', () => {
    render(
      <BentoCard span={{ cols: 2, rows: 3 }}>
        Test Card
      </BentoCard>
    )
    
    const card = screen.getByText('Test Card').parentElement
    expect(card).toHaveStyle({
      gridColumn: 'span 2',
      gridRow: 'span 3'
    })
  })
})
```

### Integration Tests

```typescript
describe('ChartHeroTemplate', () => {
  it('should render all sections correctly', () => {
    const mockData = {
      inputs: <div>Inputs</div>,
      chart: <div>Chart</div>,
      kpis: [
        { label: 'KPI 1', value: '100' },
        { label: 'KPI 2', value: '200' }
      ],
      details: <div>Details</div>
    }

    render(<ChartHeroTemplate {...mockData} />)
    
    expect(screen.getByText('Inputs')).toBeInTheDocument()
    expect(screen.getByText('Chart')).toBeInTheDocument()
    expect(screen.getByText('KPI 1')).toBeInTheDocument()
    expect(screen.getByText('Details')).toBeInTheDocument()
  })
})
```

### Visual Regression Tests

```typescript
describe('Bento Grid Visual Tests', () => {
  it('should match snapshot for dashboard layout', async () => {
    const { container } = render(<DashboardBentoLayout />)
    
    const image = await takeScreenshot(container)
    expect(image).toMatchImageSnapshot()
  })

  it('should match snapshot for mobile layout', async () => {
    viewport.set({ width: 375, height: 667 })
    const { container } = render(<DashboardBentoLayout />)
    
    const image = await takeScreenshot(container)
    expect(image).toMatchImageSnapshot()
  })
})
```

---

## Performance Considerations

### CSS Grid Optimization

```css
/* Use subgrid for nested grids */
.bento-card-nested {
  display: grid;
  grid-template-columns: subgrid;
  grid-template-rows: subgrid;
}

/* GPU acceleration for animations */
.bento-card {
  will-change: transform;
  transform: translateZ(0);
}

/* Optimize paint */
.bento-card {
  contain: layout style paint;
}
```

### Lazy Loading Charts

```tsx
const LazyChart = lazy(() => import('./Chart'))

function BentoChart({ children, ...props }) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  return (
    <BentoCard ref={ref} {...props}>
      {inView ? (
        <Suspense fallback={<ChartSkeleton />}>
          {children}
        </Suspense>
      ) : (
        <ChartSkeleton />
      )}
    </BentoCard>
  )
}
```

### Memoization

```tsx
const MemoizedBentoCard = memo(BentoCard, (prev, next) => {
  return (
    prev.span.cols === next.span.cols &&
    prev.span.rows === next.span.rows &&
    prev.variant === next.variant
  )
})
```

---

## Migration Strategy

### Phase 1: Foundation (Week 1)

1. Create base Bento components
2. Set up CSS Grid system
3. Implement responsive breakpoints
4. Create error boundaries
5. Set up testing infrastructure

### Phase 2: Templates (Week 1)

1. Build ChartHeroTemplate
2. Build DualChartsTemplate
3. Build TimelineTemplate
4. Test templates with sample data
5. Document template usage

### Phase 3: Dashboard & Client360 (Week 2)

1. Migrate Dashboard main page
2. Migrate Client360 Overview tab
3. Migrate Client360 Wealth tab
4. Migrate remaining Client360 tabs
5. Test responsive behavior

### Phase 4: Calculators (Week 3)

1. Migrate simple calculators (IncomeTax, WealthTax, etc.)
2. Migrate complex calculators (BudgetAnalyzer)
3. Test all calculators
4. Optimize performance

### Phase 5: Simulators (Week 3-4)

1. Migrate timeline simulators (Retirement, Pension)
2. Migrate comparison simulators
3. Migrate custom simulators (Succession)
4. Final testing and optimization

---

## Accessibility

### ARIA Labels

```tsx
<BentoGrid role="grid" aria-label="Dashboard metrics">
  <BentoCard role="gridcell" aria-label="Total clients metric">
    <BentoKPI label="Clients" value="150" />
  </BentoCard>
</BentoGrid>
```

### Keyboard Navigation

```tsx
function BentoCard({ onClick, ...props }: BentoCardProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick?.()
    }
  }

  return (
    <div
      {...props}
      onClick={onClick}
      onKeyPress={handleKeyPress}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
    />
  )
}
```

### Focus Management

```tsx
function BentoGrid({ children }: BentoGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Announce layout changes to screen readers
    const announcement = `Grid layout updated with ${React.Children.count(children)} items`
    announceToScreenReader(announcement)
  }, [children])

  return (
    <div ref={gridRef} role="grid">
      {children}
    </div>
  )
}
```

---

## Dark Mode Implementation

### CSS Variables

```css
:root {
  --bento-card-bg: hsl(0 0% 100%);
  --bento-card-border: hsl(214.3 31.8% 91.4%);
  --bento-hero-bg: linear-gradient(to bottom right, hsl(221.2 83.2% 53.3% / 0.05), hsl(221.2 83.2% 53.3% / 0.1));
}

.dark {
  --bento-card-bg: hsl(222.2 84% 4.9%);
  --bento-card-border: hsl(217.2 32.6% 17.5%);
  --bento-hero-bg: linear-gradient(to bottom right, hsl(217.2 91.2% 59.8% / 0.1), hsl(217.2 91.2% 59.8% / 0.2));
}
```

### Component Implementation

```tsx
function BentoCard({ variant, ...props }: BentoCardProps) {
  const variantStyles = {
    default: 'bg-[var(--bento-card-bg)] border-[var(--bento-card-border)]',
    hero: 'bg-[var(--bento-hero-bg)] border-primary/20',
    // ...
  }

  return <div className={variantStyles[variant]} {...props} />
}
```

---

## Conclusion

Ce design fournit une architecture solide et évolutive pour la migration vers Bento Grid. Les composants de base sont réutilisables, les templates accélèrent le développement, et la stratégie de migration progressive minimise les risques.

La solution est optimisée pour la performance, accessible, et supporte le dark mode nativement.
