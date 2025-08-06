# DropDebt Dashboard UI/UX Design

## Design Principles

### Core Philosophy
- **Clarity Over Complexity**: Every element must reduce cognitive load
- **Crisis-First Design**: Optimize for users in financial distress
- **Mobile-First**: Primary use case is stressed users on phones
- **Instant Understanding**: Financial status must be clear in <2 seconds
- **Action-Oriented**: Always show the next concrete step

## Visual Hierarchy & Layout

### Mobile Layout (Primary)

```
┌─────────────────────────────┐
│ STATUS HEADER               │ <- Color-coded, large text
│ [CRISIS/URGENT/STABLE...]   │
├─────────────────────────────┤
│ NEXT ACTION CARD            │ <- Primary CTA
│ "Pay Electric Bill"         │
│ $183 by Friday (3 days)     │
│ [PAY NOW] [GET HELP]        │
├─────────────────────────────┤
│ PROGRESS                    │ <- Simple visual
│ ●●●○○○○ 3 of 7 current     │
│ "All utilities current       │
│  after Friday"              │
├─────────────────────────────┤
│ AVAILABLE MONEY             │ <- Clear breakdown
│ $423 for bills this week    │
│ (Next check: $1,200 Friday) │
├─────────────────────────────┤
│ UPCOMING (collapsible)      │
│ • Rent - $950 (10 days)     │
│ • Car - $320 (14 days)      │
│ • More...                   │
└─────────────────────────────┘
```

### Desktop Layout (Secondary)

```
┌──────────────────────────────────────────────────────────┐
│ STATUS BAR                                               │
├────────────────┬─────────────────────────────────────────┤
│ NEXT ACTION    │ FINANCIAL SNAPSHOT                      │
│                │ • Available: $423                       │
│ Pay Electric   │ • Next check: $1,200 (Friday)          │
│ $183 by Friday │ • Progress: 3 of 7 bills current       │
│                │                                         │
│ [PAY] [HELP]   │ UPCOMING DEADLINES                      │
│                │ • Electric - $183 (3 days) ⚠️           │
│                │ • Rent - $950 (10 days)                 │
│                │ • Car Payment - $320 (14 days)          │
└────────────────┴─────────────────────────────────────────┘
```

## Component Structure

### 1. StatusHeader Component
```typescript
interface StatusHeaderProps {
  status: FinancialStatus;
  explanation: string;
  crisisAlerts?: CrisisAlert[];
}

// Visual Design:
// - Full-width color bar (red/orange/yellow/green/blue)
// - Large, bold status text
// - Brief explanation below
// - Crisis alerts slide down if present
```

### 2. NextActionCard Component
```typescript
interface NextActionCardProps {
  action: NextAction;
  onPay: () => void;
  onGetHelp: () => void;
}

// Visual Design:
// - Card with subtle shadow
// - Action verb in bold (e.g., "Pay")
// - Amount prominently displayed
// - Countdown timer for urgency
// - Two clear CTAs: primary (Pay) and secondary (Get Help)
```

### 3. ProgressIndicator Component
```typescript
interface ProgressIndicatorProps {
  current: number;
  total: number;
  milestone: string;
  timeline: string;
}

// Visual Design:
// - Simple dot visualization (filled vs empty)
// - "X of Y" text format
// - Next milestone in encouraging language
// - Timeline to stability as secondary info
```

### 4. AvailableMoneyDisplay Component
```typescript
interface AvailableMoneyProps {
  available: number;
  nextPaycheck: {
    amount: number;
    date: string;
  };
}

// Visual Design:
// - Large number for available amount
// - Subtle background color
// - Next paycheck info as supporting text
```

### 5. CrisisAlert Component
```typescript
interface CrisisAlertProps {
  alert: CrisisAlert;
  onDismiss: () => void;
}

// Visual Design:
// - Red/orange banner at top
// - Clear action button
// - Emergency resources as expandable list
// - Can be dismissed but reappears on refresh
```

### 6. DeadlinesList Component
```typescript
interface DeadlinesListProps {
  deadlines: Deadline[];
  collapsed?: boolean;
}

// Visual Design:
// - Collapsible on mobile
// - Color-coded by urgency (red < 3 days, orange < 7 days)
// - Shows consequence in smaller text
// - Payment possible indicator
```

## Color Palette & Typography

### Status Colors
```scss
$crisis: #DC2626;      // Red-600 - Immediate danger
$urgent: #EA580C;      // Orange-600 - Action needed soon
$caution: #F59E0B;     // Amber-500 - Careful management
$stable: #10B981;      // Emerald-500 - On track
$comfortable: #3B82F6; // Blue-500 - Doing well
```

### Typography
```scss
// Mobile
$status-size: 24px;
$primary-text: 18px;
$secondary-text: 16px;
$supporting-text: 14px;

// Use system fonts for fast loading
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

## Accessibility Considerations

### For Users Under Stress
1. **High Contrast**: Minimum WCAG AA contrast ratios
2. **Large Touch Targets**: 48px minimum on mobile
3. **Clear Labels**: No ambiguous icons without text
4. **Simple Language**: Grade 6 reading level
5. **Predictable Layout**: No surprising animations

### Screen Reader Support
```tsx
// Example accessible component
<div role="alert" aria-live="polite">
  <h2 id="crisis-heading">Budget Crisis Detected</h2>
  <p aria-describedby="crisis-heading">
    Your essential needs exceed your income by $127
  </p>
  <button aria-label="Get emergency assistance for budget crisis">
    Get Help Now
  </button>
</div>
```

## Loading States

### Initial Load
```tsx
// Skeleton screen that matches final layout
<div className="animate-pulse">
  <div className="h-16 bg-gray-200 rounded mb-4" />
  <div className="h-32 bg-gray-200 rounded mb-4" />
  <div className="h-24 bg-gray-200 rounded" />
</div>
```

### Data Refresh
- Show spinner in top-right corner
- Keep previous data visible
- Update smoothly without layout shift

## Mobile-First Implementation

### Breakpoints
```scss
// Mobile-first approach
$tablet: 768px;
$desktop: 1024px;

// Base styles for mobile
.dashboard {
  padding: 16px;
  max-width: 100%;
}

// Tablet adjustments
@media (min-width: $tablet) {
  .dashboard {
    padding: 24px;
    max-width: 768px;
  }
}

// Desktop layout
@media (min-width: $desktop) {
  .dashboard {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 24px;
  }
}
```

## Performance Optimizations

### Critical Rendering Path
1. Inline critical CSS for above-fold content
2. Lazy load below-fold components
3. Use CSS containment for complex sections

### Bundle Optimization
```typescript
// Code split by route
const Dashboard = lazy(() => import('./Dashboard'));

// Preload critical data
const prefetchDashboard = () => {
  return queryClient.prefetchQuery(['dashboard'], fetchDashboardData);
};
```

### Caching Strategy
```typescript
// Cache dashboard data for 5 minutes
const useDashboard = () => {
  return useQuery(['dashboard'], fetchDashboardData, {
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};
```

## Error Handling

### Network Errors
```tsx
// Friendly error message
<ErrorBoundary fallback={
  <div className="text-center p-8">
    <h2>Connection Problem</h2>
    <p>We're having trouble loading your information.</p>
    <button onClick={retry}>Try Again</button>
  </div>
}>
  <Dashboard />
</ErrorBoundary>
```

### Stale Data Warning
- Show subtle banner if data is >1 hour old
- Allow manual refresh
- Auto-refresh when app regains focus

## Implementation Checklist

### Phase 1: Core Dashboard
- [ ] Status header with color coding
- [ ] Next action card with CTAs
- [ ] Basic progress indicator
- [ ] Mobile responsive layout

### Phase 2: Enhanced Features
- [ ] Crisis alerts with resources
- [ ] Collapsible deadlines list
- [ ] Available money breakdown
- [ ] Loading states

### Phase 3: Polish
- [ ] Animations and transitions
- [ ] Dark mode support
- [ ] Advanced accessibility
- [ ] Performance monitoring