# Lady's Essence - Dashboard Quick Reference Guide 🚀

## Getting Started

### Project Structure
```
frontend/src/
├── styles/designTokens.ts              ← Design system (colors, typography)
├── components/
│   ├── UILibrary.tsx                   ← Core UI components
│   ├── ParentDashboardComponents.tsx    ← Parent-specific components
│   └── AdolescentDashboardComponents.tsx ← Adolescent-specific components
├── app/dashboard/
│   ├── parent/enhanced-dashboard.tsx    ← Parent dashboard page
│   └── adolescent-enhanced.tsx          ← Adolescent dashboard page
└── contexts/                            ← State management (existing)
```

---

## 🎨 Quick Component Reference

### Basic Components

#### Card
```tsx
<Card variant="default" | "elevated" | "outlined" padding="sm" | "md" | "lg">
  Content here
</Card>
```

#### Button
```tsx
<Button 
  variant="primary" | "secondary" | "outline" | "ghost" | "danger"
  size="sm" | "md" | "lg"
  onClick={() => {}}
  loading={false}
  icon="🎯"
  fullWidth={false}
>
  Button Text
</Button>
```

#### Badge
```tsx
<Badge variant="primary" | "success" | "warning" | "danger" | "info" size="sm" | "md" | "lg">
  Label
</Badge>
```

#### StatCard
```tsx
<StatCard
  label="Cycles Tracked"
  value={12}
  icon="📅"
  color="primary" | "success" | "warning" | "danger" | "info"
  trend={{ value: 33, direction: 'up' | 'down' }}
/>
```

#### Input
```tsx
<Input
  type="text" | "email" | "password" | "date" | "number"
  placeholder="Enter text..."
  value={value}
  onChange={(value) => {}}
  label="Label"
  error="Error message"
  icon="🔍"
  disabled={false}
/>
```

#### Tabs
```tsx
<Tabs
  tabs={[
    { label: 'Tab 1', value: 'tab1', icon: '📊' },
    { label: 'Tab 2', value: 'tab2', icon: '📅' }
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
  variant="default" | "pills" | "underline"
/>
```

#### ProgressBar
```tsx
<ProgressBar
  value={9}
  max={28}
  color="primary" | "success" | "warning" | "danger"
  showLabel={true}
  animated={false}
/>
```

#### Avatar
```tsx
<Avatar
  src="https://..." // OR
  initials="AB"
  size="sm" | "md" | "lg" | "xl"
  color="rose" | "green" | "blue" | "purple" | "amber"
/>
```

---

## 👨‍👩‍👧 Parent Dashboard Components

### ModernChildCard
```tsx
<ModernChildCard
  child={{
    id: 1,
    name: "Amara",
    dateOfBirth: "2008-12-15",
    relationship: "Daughter"
  }}
  isSelected={false}
  onSelect={() => {}}
  onEdit={() => {}}
  onDelete={() => {}}
/>
```

### ChildHealthPanel
```tsx
<ChildHealthPanel
  child={{ id: 1, name: "Amara" }}
  cycleData={{
    lastPeriod: "Mar 5",
    nextPeriod: "Apr 2",
    cycleLength: 28
  }}
  mealData={{
    recentMeals: [...]
  }}
  appointmentData={{
    upcoming: [...]
  }}
/>
```

### ParentDashboardStats
```tsx
<ParentDashboardStats
  childrenCount={3}
  activeCycles={2}
  totalAppointments={5}
  healthScore={92}
/>
```

### AddChildForm
```tsx
<AddChildForm
  onSubmit={(data) => console.log(data)}
  onCancel={() => {}}
  isLoading={false}
/>
```

---

## 👧 Adolescent Dashboard Components

### CycleQuickLogger
```tsx
<CycleQuickLogger
  onSubmit={(data) => console.log(data)}
  isLoading={false}
/>
```

### SymptomPicker
```tsx
<SymptomPicker
  selectedSymptoms={[]}
  onSelect={(symptoms) => console.log(symptoms)}
  maxSelections={6}
/>
```

### MoodTracker
```tsx
<MoodTracker
  onMoodSelect={(mood) => {}}
  onEnergySelect={(energy) => {}}
  onStressSelect={(stress) => {}}
/>
```

### CyclePhaseGuide
```tsx
<CyclePhaseGuide
  cycleDay={15}  // Current cycle day
  totalDays={28} // Total cycle length
/>
```

### MealQuickLogger
```tsx
<MealQuickLogger
  onSubmit={(data) => console.log(data)}
  isLoading={false}
/>
```

### HealthTip
```tsx
<HealthTip
  emoji="🧘‍♀️"
  title="Meditation"
  description="Try a 10-minute meditation"
/>
```

### AppointmentBookingSimple
```tsx
<AppointmentBookingSimple
  onSubmit={(data) => console.log(data)}
  isLoading={false}
/>
```

---

## 🎨 Design Tokens Usage

### Colors
```tsx
import { designTokens } from '../styles/designTokens';

// Primary colors
designTokens.colors.primary[500]      // #EB5E52 (Rose)
designTokens.colors.secondary[500]    // #22C55E (Green)
designTokens.colors.accent[500]       // #F59E0B (Amber)

// Status colors
designTokens.colors.status.success    // #10B981 (Green)
designTokens.colors.status.warning    // #F59E0B (Amber)
designTokens.colors.status.danger     // #EF4444 (Red)

// Period colors
designTokens.colors.period.light      // #FCA5A5 (Light flow)
designTokens.colors.period.heavy      // #DC2626 (Heavy flow)
```

### Typography
```tsx
designTokens.typography.sizes.base    // 1rem (16px)
designTokens.typography.sizes.lg      // 1.125rem (18px)
designTokens.typography.weights.bold  // 700
designTokens.typography.lineHeights.relaxed // 1.625
```

### Spacing
```tsx
designTokens.spacing[4]       // 1rem (16px)
designTokens.spacing[6]       // 1.5rem (24px)
designTokens.spacing[8]       // 2rem (32px)
```

### Shadows
```tsx
designTokens.shadows.sm       // Subtle shadow
designTokens.shadows.md       // Medium shadow
designTokens.shadows.lg       // Large shadow
```

### Gradients
```tsx
designTokens.gradients.primary      // Rose to Purple
designTokens.gradients.health       // Green to Blue
designTokens.gradients.cycle        // Purple to Pink
designTokens.gradients.wellness     // Green to Yellow
```

---

## 📱 Responsive Design

### Using Breakpoints
```tsx
// Tailwind utility classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 1 col on mobile, 2 on tablet, 3 on desktop */}
</div>

// Or with custom breakpoints
import { responsive } from '../styles/designTokens';

@media (min-width: ${responsive.md}) {
  // Tablet styles
}
```

### Touch Targets
All interactive elements use 44px minimum:
```tsx
// Button uses 44px height by default
<Button size="md" /> // height: 44px

// Touch target guidelines
designTokens.touchTarget.base    // 44px (standard)
designTokens.touchTarget.large   // 48px (preferred)
designTokens.touchTarget.xlarge  // 56px (large buttons)
```

---

## ♿ Accessibility Checklist

- ✅ ARIA labels on all buttons
- ✅ Color not sole indicator of status
- ✅ Keyboard navigation (Tab, Enter, Esc)
- ✅ High contrast text (#111827 on light)
- ✅ 44px+ touch targets
- ✅ Screen reader friendly
- ✅ Focus indicators visible

---

## 🚀 Integration Checklist

### Parent Dashboard
- [ ] Connect `ParentContext`
- [ ] Wire `/api/parents/children` endpoint
- [ ] Wire `/api/cycle-logs/calendar` endpoint
- [ ] Connect cycle data display
- [ ] Connect meal data display
- [ ] Connect appointment display
- [ ] Test on mobile devices
- [ ] Performance optimization

### Adolescent Dashboard
- [ ] Connect `CycleContext`
- [ ] Wire `/api/cycle-logs/` endpoints
- [ ] Wire `/api/meal-logs/` endpoints
- [ ] Wire `/api/appointments/` endpoints
- [ ] Test emoji rendering
- [ ] Test on low-end devices
- [ ] Performance optimization

---

## 🧪 Testing Tips

### Component Testing
```tsx
// Test variant
<Button variant="primary" /> // Rose
<Button variant="secondary" /> // Green
<Button variant="danger" /> // Red

// Test sizes
<Button size="sm" /> // 12px text
<Button size="md" /> // 16px text
<Button size="lg" /> // 18px text
```

### Device Testing
```
Target devices:
- iPhone 5/5S (320px)
- Samsung A10 (640px)
- iPad Mini (768px)
- Desktop (1024px+)

Test features:
- Touch target sizes
- Image loading
- Color contrast
- Font sizes
- Button clickability
```

### Performance Testing
```
Target metrics:
- Load time: < 2s on 3G
- First paint: < 1s
- LCP: < 2.5s
- CLS: < 0.1
- FID: < 100ms
```

---

## 🎯 Color Usage Guide

### When to Use Each Color

**Rose (#EB5E52)**
- Primary actions
- Period tracking
- Important alerts
- Health critical info

**Green (#22C55E)**
- Success states
- Wellness data
- Positive feedback
- Healthy habits

**Amber (#F59E0B)**
- Warnings
- Nutrients
- Attention needed
- Caution items

**Blue (#3B82F6)**
- Information
- Appointments
- Secondary actions
- Data neutral

**Red (#EF4444)**
- Critical alerts
- Errors
- Emergency
- Stop actions

---

## 📝 Code Style Guidelines

### Naming Conventions
```tsx
// Components
ModernChildCard       // PascalCase
CycleQuickLogger
SymptomPicker

// Variables
const cycleData       // camelCase
const isLoading
const selectedSymptoms

// Functions
const handleSubmit    // camelCase + handle prefix
const calculateAge
const getAgeGroup
```

### Component Structure
```tsx
/**
 * ComponentName
 * Brief description
 */
export const ComponentName: React.FC<{
  // Props
  prop1: string;
  prop2?: number;
  onAction?: () => void;
}> = ({ prop1, prop2, onAction }) => {
  // State
  // Effects
  // Handlers
  // Render
  return <div>...</div>;
};
```

---

## 🔗 Useful Links

- Design Tokens: `frontend/src/styles/designTokens.ts`
- UI Components: `frontend/src/components/UILibrary.tsx`
- Parent Components: `frontend/src/components/ParentDashboardComponents.tsx`
- Adolescent Components: `frontend/src/components/AdolescentDashboardComponents.tsx`
- Implementation Guide: `MODERN_DASHBOARD_IMPLEMENTATION_GUIDE.md`
- Phase 1 Summary: `DASHBOARDS_PHASE_1_SUMMARY.md`

---

## 🐛 Debugging Tips

### Common Issues

**Components not appearing**
- Check if imported correctly
- Verify Tailwind CSS is loaded
- Check z-index values
- Look for CSS conflicts

**Colors not showing**
- Verify color hex codes in designTokens
- Check Tailwind color definitions
- Look for overriding styles
- Check color contrast

**Layout issues**
- Check grid/flex settings
- Verify responsive classes
- Look for width/height constraints
- Check overflow properties

**Performance issues**
- Use React DevTools Profiler
- Check for unnecessary re-renders
- Look for large assets
- Profile bundle size

---

## 📊 Analytics Events to Track

```tsx
// Parent Dashboard
- Child added
- Child deleted
- Tab changed
- Health data viewed
- Resource accessed

// Adolescent Dashboard
- Period logged
- Mood tracked
- Meal logged
- Symptom recorded
- Article read
```

---

## 🌍 Multilingual Considerations

### Text Strings (Future Implementation)
```tsx
// Create i18n wrapper
const t = (key) => translations[language][key];

// Usage
<Button>{t('buttons.save')}</Button>
<p>{t('messages.welcome')}</p>
```

### RTL Support
```tsx
// Add dir attribute
<div dir={isRTL ? 'rtl' : 'ltr'}>
  {/* Content */}
</div>
```

---

## 💾 Data Persistence

### LocalStorage (Temporary)
```tsx
// Save data
localStorage.setItem('key', JSON.stringify(data));

// Load data
const data = JSON.parse(localStorage.getItem('key'));
```

### Offline Indicators
```tsx
// Show offline status
{!isOnline && <Alert type="warning">You are offline</Alert>}

// Queue for sync
const syncQueue = [];
```

---

## 🎓 Best Practices

1. ✅ Use components from UILibrary
2. ✅ Follow naming conventions
3. ✅ Keep components small & focused
4. ✅ Use TypeScript for type safety
5. ✅ Test on mobile first
6. ✅ Consider accessibility always
7. ✅ Optimize images & assets
8. ✅ Document complex logic
9. ✅ Handle errors gracefully
10. ✅ Provide user feedback

---

**Last Updated**: November 6, 2025
**Version**: 1.0
**Status**: Ready for Development

For more details, see the comprehensive implementation guide and code comments.
