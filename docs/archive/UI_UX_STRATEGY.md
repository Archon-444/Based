# Move Market - UI/UX Strategy

## 🎯 Vision
Create the most user-friendly and engaging prediction market dApp on Aptos, attracting mass users beyond crypto natives.

## 📊 Target Audience
- **Crypto Beginners (60%)** - Need simplicity, trust signals, education
- **Experienced Traders (30%)** - Want advanced features, speed, data
- **Developers (10%)** - Require documentation, APIs, integration

---

## 🎨 Design System

### Color Palette
```css
/* Primary - Aptos Blue */
--primary-50: #E3F2FD;
--primary-100: #BBDEFB;
--primary-500: #2196F3;  /* Main brand */
--primary-700: #1976D2;
--primary-900: #0D47A1;

/* Success - Green for wins */
--success-500: #4CAF50;
--success-700: #388E3C;

/* Warning - Amber for pending */
--warning-500: #FF9800;
--warning-700: #F57C00;

/* Error - Red for losses */
--error-500: #F44336;
--error-700: #D32F2F;

/* Neutrals */
--gray-50: #FAFAFA;
--gray-100: #F5F5F5;
--gray-200: #EEEEEE;
--gray-300: #E0E0E0;
--gray-400: #BDBDBD;
--gray-500: #9E9E9E;
--gray-700: #616161;
--gray-900: #212121;

/* Dark Mode */
--dark-bg: #0A0E27;
--dark-surface: #141B2D;
--dark-border: #1F2937;
```

### Typography
```css
/* Font Stack */
--font-primary: 'Inter', system-ui, -apple-system, sans-serif;
--font-display: 'Poppins', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Sizes (Mobile-First) */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
```

### Spacing System (8px base)
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

### Border Radius
```css
--radius-sm: 0.375rem;  /* 6px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-full: 9999px;
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

---

## 📱 Mobile-First Component Architecture

### Breakpoints
```css
/* Mobile First! */
--mobile: 0px;       /* Default */
--tablet: 640px;     /* sm */
--laptop: 1024px;    /* md */
--desktop: 1280px;   /* lg */
--wide: 1536px;      /* xl */
```

### Layout Structure
```
┌─────────────────────────────┐
│ Header (Sticky)             │
│ - Logo                      │
│ - Nav (hamburger on mobile) │
│ - Wallet Button             │
├─────────────────────────────┤
│ Main Content                │
│ - Single column on mobile   │
│ - Grid on tablet+           │
│                             │
│ ┌─────────────────────────┐│
│ │ Market Cards            ││
│ │ (Stack on mobile)       ││
│ │ (Grid on tablet+)       ││
│ └─────────────────────────┘│
├─────────────────────────────┤
│ Footer (Sticky on mobile)   │
│ - Quick actions             │
│ - Navigation tabs           │
└─────────────────────────────┘
```

---

## 🔑 Key Pages & Flows

### 1. Landing Page (Home)
**Purpose:** Convert visitors to users

**Layout:**
```
┌───────────────────────────────┐
│ Hero Section                  │
│ - Bold headline               │
│ - Animated stats (live data)  │
│ - CTA: "Start Predicting"     │
├───────────────────────────────┤
│ How It Works (3 steps)        │
│ [Icon] Connect → Predict → Win│
├───────────────────────────────┤
│ Featured Markets (Top 3)      │
│ [Live odds, trending badges]  │
├───────────────────────────────┤
│ Trust Signals                 │
│ - Total volume                │
│ - Active users                │
│ - Security audit badge        │
├───────────────────────────────┤
│ Social Proof                  │
│ - Recent predictions          │
│ - Top predictors leaderboard  │
└───────────────────────────────┘
```

### 2. Markets Page
**Purpose:** Browse and discover markets

**Features:**
- Filter by category (All, Sports, Crypto, Politics)
- Sort by (Trending, Ending Soon, Highest Volume)
- Search bar
- Card layout with key info

**Market Card Design:**
```
┌─────────────────────────────────────┐
│ 🔥 TRENDING  ⏰ Ends in 2h 15m     │
│                                     │
│ Will BTC reach $100K by EOY?       │
│                                     │
│ ┌─────────────┬─────────────┐      │
│ │ YES 67% ⬆   │ NO  33% ⬇   │      │
│ │ $12,450     │ $6,230      │      │
│ └─────────────┴─────────────┘      │
│                                     │
│ 💰 $18,680 Volume  👥 234 Bets    │
│                                     │
│ [Place Bet Button - Prominent]     │
└─────────────────────────────────────┘
```

### 3. Market Detail Page
**Purpose:** Place bets and view detailed info

**Layout (Mobile):**
```
┌───────────────────────────────┐
│ Market Question (Large)       │
│ Category Badge                │
├───────────────────────────────┤
│ Odds Display (Large Numbers)  │
│ ┌──────────┬──────────┐       │
│ │ YES 67%  │ NO  33%  │       │
│ │ [Bet]    │ [Bet]    │       │
│ └──────────┴──────────┘       │
├───────────────────────────────┤
│ Your Position (if any)        │
│ - Amount staked               │
│ - Potential payout            │
├───────────────────────────────┤
│ Market Stats                  │
│ - Volume chart                │
│ - Timeline                    │
│ - Resolution source           │
├───────────────────────────────┤
│ Recent Activity Feed          │
│ - Latest bets                 │
│ - Odds changes                │
└───────────────────────────────┘
```

### 4. Betting Modal/Sheet
**Purpose:** Quick, simple bet placement

**Flow:**
```
Step 1: Select Outcome
┌─────────────────────────┐
│ Bet on: Will BTC hit... │
│                         │
│ ⚪ YES (67% odds)       │
│ ⚪ NO  (33% odds)       │
└─────────────────────────┘

Step 2: Enter Amount
┌─────────────────────────┐
│ Amount (USDC)           │
│ [100] USDC              │
│                         │
│ Quick: [10][50][100]    │
│                         │
│ Est. Payout: 149 USDC   │
│ (if YES wins)           │
└─────────────────────────┘

Step 3: Confirm
┌─────────────────────────┐
│ ✓ Confirm Bet           │
│                         │
│ You bet: 100 USDC       │
│ On: YES                 │
│ Potential: 149 USDC     │
│                         │
│ [Confirm & Sign]        │
└─────────────────────────┘
```

### 5. User Dashboard
**Purpose:** Track positions and history

**Sections:**
- Active Positions (cards)
- Claimable Winnings (highlighted)
- Prediction History (timeline)
- Stats Overview (win rate, total volume)

---

## ✨ Animation & Interaction Patterns

### Micro-interactions
1. **Button Hovers:** Scale 1.02, shadow increase
2. **Card Hovers:** Lift with shadow, border glow
3. **Odds Changes:** Pulse animation, color shift
4. **Loading States:** Skeleton screens, not spinners
5. **Success Actions:** Confetti animation on win claims

### Page Transitions
```css
/* Smooth page transitions */
.fade-enter {
  opacity: 0;
  transform: translateY(10px);
}
.fade-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 300ms ease-out;
}
```

### Live Data Updates
- Odds: Animate number changes with color flash
- Volume: Growing bar animation
- Countdown: Smooth seconds transition

---

## 🎮 Gamification Elements

### 1. Progress Indicators
- "New Predictor" → "Veteran" → "Oracle"
- XP system based on accuracy

### 2. Badges & Achievements
- First Bet
- 10 Correct Predictions
- Early Bird (bet early on winning market)

### 3. Leaderboards
- Weekly top predictors
- Biggest wins
- Highest accuracy

### 4. Streak Counter
- Days active
- Consecutive correct predictions

---

## 🔒 Trust & Credibility Elements

### Security Indicators
```
✓ Smart Contract Audited
✓ Non-Custodial (You control your funds)
✓ Oracle-Verified Resolution
✓ 10,000+ Active Users
```

### Transparency Features
- Live transaction feed
- Open source contracts link
- Audit report badge
- Total locked value (TVL)

---

## ♿ Accessibility

### Requirements
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast 4.5:1 minimum
- Focus indicators
- Alternative text for images
- Semantic HTML

---

## 🛠️ Technology Recommendations

### Design Implementation
**Recommended:** Tailwind CSS + Headless UI

**Why:**
- Utility-first for rapid development
- Built-in responsive design
- Small bundle size
- Easy customization
- Great mobile support

**Alternative:** styled-components if prefer CSS-in-JS

### Component Library Structure
```
src/
├── components/
│   ├── ui/           # Base components (Button, Card, etc.)
│   ├── market/       # Market-specific components
│   ├── layout/       # Layout components
│   └── features/     # Feature-specific components
├── styles/
│   ├── globals.css   # Design system variables
│   └── animations.css
└── hooks/            # Custom React hooks
```

### Key Libraries
- `framer-motion` - Animations
- `react-hot-toast` - Toast notifications
- `recharts` - Charts for analytics
- `react-icons` - Icon library
- `date-fns` - Date formatting

---

## 📊 Success Metrics

### User Engagement
- Time on site
- Pages per session
- Return visitor rate

### Conversion
- Wallet connection rate
- First bet completion rate
- Repeat bet rate

### Technical
- Page load time < 2s
- Mobile responsiveness score > 95
- Lighthouse score > 90

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)
- Set up Tailwind
- Create design system
- Build base UI components

### Phase 2: Core Pages (Week 2)
- Landing page
- Markets list
- Market detail

### Phase 3: Interactions (Week 3)
- Betting modal
- User dashboard
- Animations

### Phase 4: Polish (Week 4)
- Mobile optimization
- Accessibility audit
- Performance optimization

---

## 📱 Mobile-Specific Considerations

### Touch Targets
- Minimum 44x44px tap targets
- Adequate spacing between elements
- Large, prominent CTAs

### Mobile Navigation
- Bottom tab bar for key actions
- Hamburger menu for secondary nav
- Swipe gestures for cards

### Performance
- Lazy load images
- Code splitting per route
- Optimize bundle size
- Use native mobile inputs

### Mobile-First CSS
```css
/* Mobile first */
.button {
  padding: 12px 24px;
  font-size: 16px;
}

/* Tablet+ */
@media (min-width: 640px) {
  .button {
    padding: 14px 28px;
    font-size: 18px;
  }
}
```

---

This strategy prioritizes user experience, mobile readiness, and scalability while maintaining technical excellence.
