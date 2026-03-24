# Start App Button - Testing & QA Checklist

## Overview

This checklist ensures the "Start App" button pattern works correctly across all user scenarios, devices, and edge cases.

---

## ✅ Functional Testing

### Basic Flow

- [ ] **Landing page loads instantly** (~1.8s TTI)
  - No Aptos SDK loaded
  - No console errors
  - All static content visible

- [ ] **"Start App" button is visible** in hero section
  - Button text: "Start App"
  - Primary variant (blue/purple)
  - TrendingUp icon on right

- [ ] **Click "Start App" triggers loading state**
  - Button text changes to "Launching App..."
  - Button shows loading spinner
  - Button is disabled during loading

- [ ] **Navigation occurs after 300ms**
  - User redirected to `/markets`
  - URL changes correctly
  - Browser history updated

- [ ] **Wallet SDK loads during transition**
  - Check Network tab: WalletContext chunk downloads
  - Check Console: "Wallet SDK loading..." log
  - No errors during load

- [ ] **Markets page renders with wallet context**
  - Page displays correctly
  - "Connect Wallet" button available
  - Can connect wallet without issues

### Alternative Paths

- [ ] **"Learn More" button works**
  - Navigates to `/how-it-works`
  - No SDK load triggered
  - Instant navigation

- [ ] **CTA section "Start App Now" button works**
  - Same behavior as hero button
  - Loading state consistent
  - Navigation successful

- [ ] **Direct navigation to /markets**
  - User can bookmark `/markets`
  - SDK auto-loads on direct visit
  - Works as before (no regression)

### Edge Cases

- [ ] **Rapid clicking "Start App" multiple times**
  - Only one navigation occurs
  - No duplicate SDK loads
  - Button stays disabled during process

- [ ] **Browser back button after starting app**
  - Back to landing page works
  - Can click "Start App" again
  - SDK doesn't reload (already cached)

- [ ] **Network timeout during SDK load**
  - Error handling works gracefully
  - User sees error message
  - Can retry loading

- [ ] **User closes tab during "Launching..."
  - No memory leaks
  - Clean state on next visit

---

## 📱 Mobile Testing

### iOS Safari

- [ ] **iPhone 12/13/14 (iOS 16+)**
  - Button tap works (no 300ms delay)
  - Loading state visible
  - Navigation smooth
  - No layout shifts

- [ ] **iPhone SE (smaller screen)**
  - Button fully visible
  - Text not truncated
  - Tap target ≥ 44px

- [ ] **iPad (tablet view)**
  - Responsive layout correct
  - Desktop button sizes
  - No mobile-only issues

### Android Chrome

- [ ] **Samsung Galaxy (Android 12+)**
  - Button tap responsive
  - Loading animation smooth
  - Navigation works

- [ ] **Pixel (stock Android)**
  - Same as above
  - No OS-specific bugs

### Mobile-Specific Issues

- [ ] **Slow 3G network**
  - Loading state persists during SDK download
  - User sees feedback (not frozen)
  - Timeout after 30s with error

- [ ] **Offline mode**
  - Error message: "No internet connection"
  - Graceful degradation
  - Retry button available

- [ ] **Portrait ↔ Landscape rotation**
  - Layout adjusts correctly
  - Button remains accessible
  - No state loss

---

## 🔒 Browser Compatibility

### Desktop Browsers

- [ ] **Chrome 120+ (Chromium-based)**
  - Full functionality works
  - DevTools shows correct network activity

- [ ] **Firefox 120+**
  - Button works correctly
  - No CSS issues
  - SDK loads properly

- [ ] **Safari 17+ (macOS)**
  - Navigation works
  - Loading state visible
  - No webkit-specific bugs

- [ ] **Edge 120+ (Chromium)**
  - Same as Chrome
  - No Edge-specific issues

### Legacy Support (if applicable)

- [ ] **Chrome 100-119**
  - Polyfills loaded if needed
  - Graceful degradation

- [ ] **Safari 15-16**
  - Basic functionality works
  - Modern features may degrade

---

## ♿ Accessibility Testing

### Keyboard Navigation

- [ ] **Tab to "Start App" button**
  - Button receives focus
  - Focus ring visible
  - Focus indicator clear

- [ ] **Press Enter on focused button**
  - Triggers loading state
  - Navigation occurs
  - Same as mouse click

- [ ] **Press Space on focused button**
  - Same as Enter key
  - Works consistently

### Screen Readers

- [ ] **VoiceOver (iOS/macOS)**
  - Announces "Start App button"
  - Loading state announced: "Launching App, button"
  - Navigation announced

- [ ] **NVDA (Windows)**
  - Same as VoiceOver
  - All states announced clearly

- [ ] **JAWS (Windows)**
  - Button role recognized
  - State changes announced

### ARIA Attributes

- [ ] **Button has proper attributes**
  ```html
  <button 
    aria-label="Start app and load wallet"
    aria-busy={isStarting}
    aria-disabled={isStarting}
  >
  ```

- [ ] **Loading state communicated**
  - `aria-busy="true"` during loading
  - Screen readers announce change

---

## 🎨 Visual & UI Testing

### Design Consistency

- [ ] **Button matches design system**
  - Colors: Primary variant
  - Size: Large (lg)
  - Font: Display font, semibold
  - Border radius: Correct

- [ ] **Loading spinner animation**
  - Smooth rotation
  - Correct size/position
  - Matches brand colors

- [ ] **Text changes smoothly**
  - "Start App" → "Launching App..."
  - No layout shift
  - Text centered

### Dark Mode

- [ ] **Button in dark mode**
  - Colors inverted correctly
  - Contrast ratio ≥ 4.5:1
  - Loading state visible

- [ ] **Modal (if using StartAppModal)**
  - Dark background
  - Text readable
  - Buttons styled correctly

### Responsive Design

- [ ] **Mobile (320px - 767px)**
  - Button full-width on small screens
  - Text not truncated
  - Icon visible

- [ ] **Tablet (768px - 1023px)**
  - Button medium width
  - Centered in layout

- [ ] **Desktop (1024px+)**
  - Button inline with "Learn More"
  - Proper spacing
  - Hover states work

---

## 📊 Performance Testing

### Metrics to Measure

- [ ] **Landing page load time**
  - Target: < 2s (Fast 3G)
  - Lighthouse score: ≥ 90
  - TTI: < 1.8s

- [ ] **SDK load time**
  - Download: < 800ms (Fast 3G)
  - Parse: < 200ms
  - Total: < 1s

- [ ] **Navigation time**
  - Landing → Markets: < 500ms
  - Smooth transition
  - No jank

### Network Conditions

- [ ] **Fast WiFi (50 Mbps)**
  - Everything instant
  - Sub-second transitions

- [ ] **Fast 3G (simulated)**
  - Landing: < 2s
  - SDK: < 1s
  - Acceptable UX

- [ ] **Slow 3G (simulated)**
  - Loading states show
  - User aware of progress
  - Timeout handling

### Bundle Analysis

- [ ] **Landing page bundle size**
  - Main: ~128 KB (37.8 KB gzipped) ✅
  - No wallet SDK included ✅
  - Only essential code ✅

- [ ] **Wallet chunk size**
  - Separate chunk: ~5.2 MB (1.35 MB gzipped) ✅
  - Loaded on demand ✅
  - Cached after first load ✅

---

## 🧑‍🔬 User Testing Scenarios

### Scenario 1: First-Time Visitor

**Steps:**
1. User arrives from Google search
2. Reads landing page content
3. Decides to try the app
4. Clicks "Start App"
5. Sees "Launching App..."
6. Lands on markets page
7. Connects wallet
8. Places first bet

**Expected:**
- [ ] Clear what "Start App" means
- [ ] Loading feels intentional
- [ ] Smooth transition
- [ ] Wallet connection obvious
- [ ] User completes flow

### Scenario 2: Curious Browser

**Steps:**
1. User lands on homepage
2. Not sure what this is
3. Clicks "Learn More" instead
4. Reads how-it-works page
5. Returns to home
6. Now clicks "Start App"
7. More confident, proceeds

**Expected:**
- [ ] "Learn More" loads instantly
- [ ] No SDK loaded yet
- [ ] User returns easily
- [ ] "Start App" now makes sense
- [ ] User commits to app

### Scenario 3: Returning User

**Steps:**
1. User bookmarked `/markets`
2. Visits directly
3. SDK auto-loads (existing behavior)
4. Connects wallet
5. Continues betting

**Expected:**
- [ ] Direct navigation works
- [ ] SDK loads automatically
- [ ] No "Start App" needed
- [ ] Wallet reconnects
- [ ] No regression in UX

### Scenario 4: Mobile User on Slow Network

**Steps:**
1. User on subway (spotty 3G)
2. Loads homepage (eventually)
3. Clicks "Start App"
4. Sees "Launching App..." for 3-5s
5. SDK downloads slowly
6. Markets page renders
7. Wallet connect available

**Expected:**
- [ ] Loading state persistent
- [ ] User not confused
- [ ] No timeout errors < 10s
- [ ] Can retry if fails
- [ ] Acceptable UX on slow network

---

## ⚠️ Error Handling

### Network Errors

- [ ] **SDK fails to download**
  - Error message: "Failed to load app. Check your connection."
  - Retry button available
  - User can go back

- [ ] **Navigation fails**
  - Error caught gracefully
  - User stays on landing page
  - Can try again

### Browser Errors

- [ ] **JavaScript disabled**
  - Fallback message: "Please enable JavaScript"
  - Basic navigation works
  - No crash

- [ ] **LocalStorage disabled**
  - App still works
  - Modal may show every time
  - No crash

### Wallet Errors

- [ ] **No wallet installed**
  - On markets page, shows install prompt
  - Links to Petra/Martian
  - User can browse without wallet

- [ ] **Wallet connection rejected**
  - Error message clear
  - Can retry connection
  - Can still view markets

---

## 📝 Analytics Verification

### Events to Track

- [ ] **`landing_page_view`**
  - Fires on page load
  - Includes referrer
  - User session ID

- [ ] **`start_app_clicked`**
  - Fires on button click
  - Location: hero or CTA
  - Timestamp

- [ ] **`wallet_sdk_load_started`**
  - Fires on loadWallet() call
  - Performance mark

- [ ] **`wallet_sdk_load_completed`**
  - Fires on SDK ready
  - Load duration

- [ ] **`navigation_to_markets`**
  - Fires on route change
  - Source: start_app_button
  - Time from click

### Conversion Funnel

```
Landing Page View (100%)
  ↓
Start App Clicked (target: 40%)
  ↓
Markets Page View (target: 95%)
  ↓
Wallet Connected (target: 25%)
  ↓
First Bet Placed (target: 60%)
```

- [ ] **Funnel tracking works**
- [ ] **Drop-off points identified**
- [ ] **A/B test data collected**

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All tests above pass
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Rollback plan ready

### Staging Deployment

- [ ] Deploy to staging environment
- [ ] Smoke test all flows
- [ ] QA team validation
- [ ] Stakeholder approval

### Production Deployment

- [ ] Feature flag enabled (optional)
- [ ] Deploy during low-traffic window
- [ ] Monitor error rates (< 0.1%)
- [ ] Monitor performance metrics
- [ ] Monitor analytics events

### Post-Deployment

- [ ] Verify in production (24h)
- [ ] Check real user metrics (48h)
- [ ] Gather user feedback (1 week)
- [ ] Iterate based on data

---

## 📊 Success Criteria

### Performance

- ✅ Landing page TTI < 2s (95th percentile)
- ✅ "Start App" click to markets < 1s
- ✅ Bundle size reduction maintained

### User Experience

- ✅ "Start App" CTR ≥ 35%
- ✅ Markets page bounce rate < 20%
- ✅ Wallet connection rate ≥ 20%
- ✅ Error rate < 0.5%

### Business Metrics

- ✅ Overall bounce rate reduction ≥ 10%
- ✅ Session duration increase ≥ 15%
- ✅ Conversion rate increase ≥ 5%

---

## 🐛 Known Issues & Limitations

### Current Limitations

1. **300ms delay on button click**
   - Intentional for SDK pre-load
   - Acceptable tradeoff
   - Can optimize later

2. **No progress indicator during SDK load**
   - Just "Launching App..." text
   - Could add progress bar
   - Low priority

3. **Modal only shows once (if implemented)**
   - localStorage flag
   - Users can't see again
   - Could add "Help" link

### Future Improvements

- [ ] Add SDK load progress bar
- [ ] Preload on hover (advanced)
- [ ] Add keyboard shortcut (Ctrl+Enter)
- [ ] Add analytics dashboard
- [ ] Add A/B testing framework

---

## 📝 Test Results Log

| Date | Tester | Environment | Status | Notes |
|------|--------|-------------|--------|-------|
| 2025-10-17 | Dev | Localhost | ✅ Pass | Initial implementation |
| | | Staging | ⏳ Pending | Deploy to staging |
| | | Production | ⏳ Pending | Awaiting approval |

---

**Last Updated**: October 17, 2025  
**Status**: ⏳ Ready for QA  
**Next Step**: Deploy to staging for comprehensive testing
