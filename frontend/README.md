# DropDebt Dashboard Frontend

React dashboard that transforms DropDebt's backend insights into clear, actionable user interface for users across all financial situations.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server with mock data
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dashboard will be available at `http://localhost:3000`

## 📱 Features

- **Crisis Mode**: Simplified interface for emergency situations with large action buttons
- **Real Progress**: Shows "3 of 7 bills current" instead of confusing percentages
- **Emergency Resources**: Direct integration with 2-1-1, LIHEAP, crisis lifeline
- **Mobile First**: Touch-friendly design optimized for phones
- **Offline Ready**: Progressive Web App with offline caching
- **Accessibility**: WCAG 2.1 AA compliant with screen reader support

## 🎯 User Scenarios Supported

### Crisis Users ($1800 income, $2100 needs)
- Automatic crisis mode activation
- Emergency resource connections (2-1-1, LIHEAP)
- Simplified interface to reduce cognitive load
- Clear immediate actions

### Stable Users (Bills manageable)
- Progress tracking with meaningful milestones
- Next action guidance with deadlines
- Budget breakdown and timeline to stability
- Achievement recognition without gamification

### Mobile Users (Primary device for many)
- Touch-friendly 44px minimum targets
- One-handed thumb navigation
- Fast loading on slower connections
- Offline capability for recent data

## 🏗️ Architecture

```
src/
├── components/           # React components
│   ├── Dashboard.tsx     # Main dashboard container
│   ├── StatusHeader.tsx  # Financial status display
│   ├── NextActionCard.tsx# Prominent action guidance
│   ├── ProgressSection.tsx# Real progress without percentages
│   ├── CrisisAlert.tsx   # Emergency alerts and resources
│   ├── DeadlinesList.tsx # Upcoming bill deadlines
│   └── LoadingState.tsx  # Anxiety-reducing loading states
├── hooks/               # Custom React hooks
│   └── useApi.tsx       # API integration with error handling
├── types/               # TypeScript definitions
│   └── dashboard.ts     # Dashboard data types and utilities
├── utils/               # Helper functions
│   └── serviceWorker.ts # PWA offline capability
└── App.tsx              # Root application component
```

## 🎨 Design System

### Status Colors (Crisis-Focused)
- **Crisis**: `#ef4444` (Red) - Essential needs exceed income
- **Urgent**: `#f59e0b` (Orange) - Critical bills due within days
- **Caution**: `#eab308` (Yellow) - Tight budget management needed
- **Stable**: `#22c55e` (Green) - Bills manageable, on track
- **Comfortable**: `#3b82f6` (Blue) - Good margin, advancement possible

### Typography
- System font stack for fast loading and familiarity
- Grade 6 reading level for stressed users
- High contrast ratios for accessibility
- Responsive sizing for mobile-first design

### Animations
- Gentle pulse for loading (no spinning or aggressive effects)
- Slide-up transitions for new content
- Reduced motion support for accessibility

## 🔌 API Integration

### Mock Data (Development)
Set `VITE_MOCK_API=true` to use realistic mock data:
- Crisis user scenarios (30% of requests)
- Stable user scenarios with various progress levels
- Network delay simulation (800ms)
- Error scenarios for testing

### Real API Integration
Set `VITE_MOCK_API=false` and configure:
```env
VITE_API_BASE_URL=https://your-api-gateway.amazonaws.com
VITE_DASHBOARD_API_URL=${VITE_API_BASE_URL}/dashboard
```

### Endpoints Used
- `GET /dashboard` - Main dashboard data
- `GET /dashboard/next-action` - Quick action guidance
- `GET /dashboard/progress` - Progress milestones
- `GET /dashboard/alerts` - Crisis alerts

## 📱 Progressive Web App

### Offline Capability
- Service worker caches essential resources
- Offline page with emergency resources
- Background sync when connection restored
- Cached dashboard data for offline viewing

### Mobile App Features
- Installable on mobile home screen
- Standalone app experience
- Emergency shortcut (2-1-1 calling)
- Push notifications ready (future feature)

## ♿ Accessibility

### WCAG 2.1 AA Compliance
- High contrast colors (4.5:1 minimum)
- Keyboard navigation support
- Screen reader optimization with ARIA labels
- Focus management for crisis mode
- Alternative text for all images and icons

### Stress-Optimized UX
- Simplified language and clear instructions
- Minimal cognitive load in crisis mode
- Large touch targets (44px minimum)
- No overwhelming animations or sounds
- Emergency resources always accessible

## 🧪 Testing

### User Scenario Testing
```bash
# Test crisis user experience
- Load dashboard with mock crisis data
- Verify crisis mode activation
- Test emergency resource buttons
- Check offline functionality

# Test stable user experience  
- Load dashboard with stable mock data
- Verify progress display shows "X of Y" format
- Test next action guidance
- Check responsive design on mobile
```

### Browser Support
- Chrome 90+ (recommended for PWA features)
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚀 Deployment

### Environment Setup
1. Copy `.env.example` to `.env`
2. Configure API endpoints
3. Set `VITE_MOCK_API=false` for production

### Build Commands
```bash
# Production build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

### Deployment Checklist
- [ ] API endpoints configured correctly
- [ ] Service worker registered for offline support
- [ ] HTTPS required for PWA features
- [ ] Emergency resource phone numbers tested
- [ ] Accessibility audit completed
- [ ] Mobile responsiveness verified

## 🔧 Troubleshooting

### Common Issues

**Dashboard won't load:**
- Check API endpoint configuration
- Verify CORS settings on backend
- Enable VITE_MOCK_API=true for testing

**Crisis mode not activating:**
- Mock API returns crisis data 30% of the time
- Force crisis mode with manual toggle
- Check financialStatus === 'CRISIS' in data

**Mobile layout issues:**
- Test on actual devices, not just browser dev tools
- Check safe area insets for modern phones
- Verify touch targets are 44px minimum

**Offline mode not working:**
- HTTPS required for service worker
- Check browser dev tools > Application > Service Workers
- Verify sw.js is accessible

## 📞 Emergency Resources

The dashboard includes direct integration with:
- **2-1-1**: General emergency assistance
- **988**: Crisis lifeline (mental health)
- **1-800-799-7233**: National domestic violence hotline

These work even when the dashboard is offline.

## 🤝 Contributing

This dashboard is optimized for users in financial crisis. When making changes:
- Test with users under actual financial stress
- Prioritize clarity over impressive features
- Maintain emergency resource accessibility
- Follow crisis-focused design principles
- Ensure mobile-first responsive design

## 📈 Performance Metrics

- **First Contentful Paint**: <1.5s
- **Largest Contentful Paint**: <2s
- **Time to Interactive**: <3s
- **Bundle Size**: <200KB gzipped
- **Lighthouse Score**: >90 (all categories)