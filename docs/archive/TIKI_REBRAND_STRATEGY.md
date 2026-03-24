# Move Market - Tiki Rebrand Strategy

**Project**: Move Market Prediction Markets
**Rebrand Type**: Cyberpunk → Tiki-Memetic
**Timeline**: 3-month phased rollout
**Last Updated**: 2025-10-12

---

## 🎭 Strategic Rationale

### Why Pivot from Cyberpunk to Tiki?

**Current State (Cyberpunk)**:
- Electric blue/purple palette
- Oracle eye symbolism
- Serious, institutional aesthetic
- Indistinguishable from competitors

**New Direction (Tiki-Memetic)**:
- Warm tropical colors (turquoise, coral, mango)
- MaskBro mascot family
- Playful yet trustworthy
- **Unique visual identity in prediction market space**

### Strategic Advantages

1. **Differentiation**: Polymarket = clinical, Kalshi = corporate, Move Market = fun yet credible
2. **Memetic Potential**: Tiki masks are instantly shareable, meme-friendly
3. **Cultural Fit**: "Trust me bro" already ironic - tiki aesthetic reinforces self-aware humor
4. **Community Building**: MaskBro characters create lore, NFTs, governance badges
5. **Preserves Technical Credibility**: Serious tech under playful surface

---

## 🎨 Visual Identity System

### Color Palette Evolution

#### Primary Palette (Tiki Tropical)

```css
:root {
  /* PRIMARY COLORS */
  --tiki-turquoise: #00CFC1;      /* Main brand color - trust + tropical */
  --tiki-coral: #FF6B6B;          /* Energy + warmth */
  --tiki-mango: #FFB347;          /* Optimism + rewards */
  --tiki-deep-teal: #0A5F5F;      /* Serious backgrounds */
  --tiki-coconut: #FFF8E7;        /* Warm neutrals */

  /* ACCENT COLORS */
  --tiki-volcano: #E63946;        /* Alerts + important actions */
  --tiki-lagoon: #4ECDC4;         /* Success states */
  --tiki-sunset: #F77F00;         /* Warnings */
  --tiki-bamboo: #90BE6D;         /* Growth + positive trends */

  /* NEUTRALS */
  --tiki-charcoal: #1A1A2E;       /* Dark mode background */
  --tiki-driftwood: #564D4D;      /* Secondary text */
  --tiki-sand: #F4E9D8;           /* Light backgrounds */
}
```

#### Comparison: Old vs New

| Element | Cyberpunk (Old) | Tiki (New) |
|---------|----------------|-----------|
| **Primary** | Electric Blue (#3B82F6) | Turquoise (#00CFC1) |
| **Secondary** | Deep Purple (#8B5CF6) | Coral (#FF6B6B) |
| **Accent** | Neon Pink (#EC4899) | Mango (#FFB347) |
| **Background** | Gray-900 (#111827) | Deep Teal (#0A5F5F) |
| **Text** | Gray-50 (#F9FAFB) | Coconut (#FFF8E7) |

### Typography System

#### Font Pairing

**Display (Headings, Mascot Personality)**:
- **Font**: Baloo 2 (Google Fonts)
- **Weights**: 600 (SemiBold), 700 (Bold), 800 (ExtraBold)
- **Personality**: Rounded, friendly, approachable
- **Use Cases**: Hero titles, MaskBro dialogue, section headers

**Body (Professional Content)**:
- **Font**: Inter (unchanged)
- **Weights**: 400 (Regular), 500 (Medium), 600 (SemiBold)
- **Personality**: Clean, readable, trustworthy
- **Use Cases**: Market descriptions, explanatory text, documentation

**Monospace (Technical Data)**:
- **Font**: JetBrains Mono (unchanged)
- **Weights**: 400 (Regular), 700 (Bold)
- **Personality**: Technical, precise
- **Use Cases**: Odds, prices, wallet addresses, timestamps

#### Font Hierarchy

```css
/* Headings */
h1 { font-family: 'Baloo 2', cursive; font-size: 3.5rem; font-weight: 800; }
h2 { font-family: 'Baloo 2', cursive; font-size: 2.5rem; font-weight: 700; }
h3 { font-family: 'Baloo 2', cursive; font-size: 1.75rem; font-weight: 600; }

/* Body */
body { font-family: 'Inter', sans-serif; font-size: 1rem; font-weight: 400; }
.lead { font-size: 1.25rem; font-weight: 500; }

/* Data */
.odds { font-family: 'JetBrains Mono', monospace; font-size: 2rem; font-weight: 700; }
.price { font-family: 'JetBrains Mono', monospace; font-size: 1.5rem; }
```

### Logo Evolution

#### Current Logo (Cyberpunk)
```
👁️  TRUSTMEBRO.market
(Eye emoji + sans-serif text)
```

#### New Logo Options

**Option 1: MaskBro Silhouette** (Recommended)
```
🗿  Move Market
(Tiki mask emoji + Baloo 2 font)
```
- Clean, minimal, scales to 16px favicon
- Works in monochrome
- Instantly recognizable

**Option 2: Smirking Mask**
```
😏  Move Market
(Smirk emoji + Baloo 2 font)
```
- More personality
- Reinforces "bro" culture
- Less professional but more memetic

**Option 3: Custom Tiki Icon**
```
[Simplified tiki mask icon] Move Market
```
- Unique brand asset
- Can evolve into MaskBro family
- Requires design work but strongest long-term

**Recommendation**: Start with Option 1 (🗿) for immediate launch, develop Option 3 for Phase 3 full rebrand.

---

## 🎭 MaskBro Mascot System

### The Council of MaskBros

Transform your multi-oracle system into **personified tiki characters** that gamify the technical infrastructure.

#### Core MaskBro Characters

**1. SmirkBro** 😏
- **Personality**: Cocky but usually right
- **Oracle Role**: Optimistic consensus weight
- **Voice**: "I told you it was bullish, bro"
- **Market Sentiment**: 60%+ YES votes
- **Visual**: Tiki mask with raised eyebrow

**2. SadBro** 😔
- **Personality**: Pessimistic but protective
- **Oracle Role**: Bearish signal detector
- **Voice**: "Bro, I warned you about this"
- **Market Sentiment**: 60%+ NO votes
- **Visual**: Tiki mask with downturned mouth

**3. WiseBro Elder** 🧙
- **Personality**: Long-term thinker, rarely speaks
- **Oracle Role**: Historical accuracy reputation
- **Voice**: "In time, all truths reveal themselves"
- **Market Sentiment**: High-confidence predictions
- **Visual**: Tiki mask with wise eyes, small beard

**4. CrazyBro Degen** 🤪
- **Personality**: High-risk, high-reward chaos agent
- **Oracle Role**: High-volatility market specialist
- **Voice**: "YOLO the whole treasury, bro!"
- **Market Sentiment**: Markets with >20% swings
- **Visual**: Wild tiki mask with spirals for eyes

**5. ChillBro** 😎
- **Personality**: Calm, balanced, logical
- **Oracle Role**: Stable market consensus
- **Voice**: "The data speaks for itself, bro"
- **Market Sentiment**: 45-55% (toss-up markets)
- **Visual**: Tiki mask with sunglasses

### Integration into Product

**Market Cards**:
```
┌─────────────────────────────┐
│ 🗿 SmirkBro says: BULLISH   │
│                             │
│ Will BTC hit $100k by EOY?  │
│                             │
│ YES: 67% 📈                 │
│ NO:  33% 📉                 │
│                             │
│ SmirkBro confidence: 8/10   │
└─────────────────────────────┘
```

**Oracle Dashboard**:
```
Council of MaskBros:
🗿 SmirkBro:    BULLISH (weight: 30%)
😔 SadBro:      BEARISH (weight: 20%)
🧙 WiseBro:     BULLISH (weight: 40%)
🤪 CrazyBro:    BULLISH (weight: 10%)

Consensus: 67% YES
```

**Betting Interface**:
When user places bet, random MaskBro reacts:
- "SmirkBro approves your bet! 😏"
- "SadBro thinks you're gonna get rekt 😔"
- "WiseBro nods wisely 🧙"

---

## 🎨 UI Component Redesign

### Design System Principles

1. **Gradual Migration**: New components coexist with old during transition
2. **Technical Preservation**: All functionality remains unchanged
3. **Memetic Surface, Serious Depth**: Fun aesthetic, serious data underneath
4. **Mobile-First**: Tiki elements enhance, don't clutter mobile experience

### Component Updates

#### 1. Market Cards

**Before (Cyberpunk)**:
```jsx
<div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
  <h3 className="text-xl font-bold text-white">Market Title</h3>
  <div className="text-blue-400 text-3xl font-mono">67%</div>
</div>
```

**After (Tiki)**:
```jsx
<div className="bg-gradient-to-br from-tiki-deep-teal to-tiki-turquoise border-2 border-tiki-mango rounded-2xl p-6 shadow-lg">
  <div className="flex items-center gap-2 mb-2">
    <span className="text-2xl">🗿</span>
    <span className="text-sm text-tiki-coconut">SmirkBro says: BULLISH</span>
  </div>
  <h3 className="text-xl font-baloo font-bold text-tiki-coconut">Market Title</h3>
  <div className="text-tiki-mango text-3xl font-mono">67%</div>
</div>
```

**Visual Enhancements**:
- Rounded corners (16px → 24px)
- Gradient backgrounds (deep teal → turquoise)
- Border accent (mango color for warmth)
- MaskBro indicator (personality + sentiment)
- Shadow lift (subtle 3D effect)

#### 2. Buttons

**Before**:
```jsx
<button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg">
  Place Bet
</button>
```

**After**:
```jsx
<button className="bg-gradient-to-r from-tiki-coral to-tiki-mango hover:from-tiki-mango hover:to-tiki-coral px-8 py-4 rounded-full font-baloo font-bold text-white shadow-2xl transform hover:scale-105 transition-all duration-200">
  🌺 Place Bet
</button>
```

**Visual Enhancements**:
- Fully rounded (pill shape)
- Gradient background (coral → mango)
- Emoji accent (tropical flower)
- Lift on hover (scale + shadow)
- Baloo font (friendlier)

#### 3. Odds Display

**Before**:
```jsx
<div className="text-5xl font-mono text-blue-400">
  67%
</div>
```

**After**:
```jsx
<div className="relative">
  <div className="text-6xl font-mono font-bold text-tiki-turquoise drop-shadow-glow">
    67%
  </div>
  <div className="absolute -top-4 -right-4 text-4xl animate-bounce">
    🗿
  </div>
</div>
```

**Visual Enhancements**:
- Larger size (5xl → 6xl for impact)
- Turquoise color (warmer than blue)
- Glowing drop shadow
- Animated MaskBro (subtle bounce)

#### 4. Loading States

**Before**:
```jsx
<div className="spinner border-blue-500"></div>
```

**After**:
```jsx
<div className="relative w-16 h-16">
  <div className="text-5xl animate-spin-slow">🗿</div>
  <div className="text-xs text-tiki-coconut mt-2">Loading vibes...</div>
</div>
```

**Visual Enhancements**:
- Spinning tiki mask (instead of generic spinner)
- Playful loading text
- Personality even in wait states

#### 5. Success/Error States

**Before**:
```jsx
<div className="bg-green-500 text-white p-4 rounded">
  Bet placed successfully
</div>
```

**After**:
```jsx
<div className="bg-gradient-to-r from-tiki-bamboo to-tiki-lagoon text-white p-6 rounded-2xl shadow-xl">
  <div className="flex items-center gap-3">
    <span className="text-4xl animate-wiggle">🎉</span>
    <div>
      <div className="font-baloo font-bold text-xl">Bet Placed!</div>
      <div className="text-sm opacity-90">SmirkBro approves 😏</div>
    </div>
  </div>
</div>
```

**Visual Enhancements**:
- Gradient success color (bamboo → lagoon)
- Celebratory emoji (party popper)
- MaskBro reaction (adds personality)
- Wiggle animation (playful)

---

## 🛠️ Technical Implementation

### Phase 1: Foundation (Week 1-2)

#### Step 1: Add Tiki Color Variables

Update `dapp/tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Existing cyberpunk colors (preserve for gradual migration)
        primary: '#3B82F6',
        secondary: '#8B5CF6',

        // NEW: Tiki palette
        tiki: {
          turquoise: '#00CFC1',
          coral: '#FF6B6B',
          mango: '#FFB347',
          'deep-teal': '#0A5F5F',
          coconut: '#FFF8E7',
          volcano: '#E63946',
          lagoon: '#4ECDC4',
          sunset: '#F77F00',
          bamboo: '#90BE6D',
          charcoal: '#1A1A2E',
          driftwood: '#564D4D',
          sand: '#F4E9D8',
        }
      },
      fontFamily: {
        // NEW: Tiki display font
        baloo: ['"Baloo 2"', 'cursive'],
        // Existing fonts
        inter: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 207, 193, 0.5)',
        'glow-coral': '0 0 20px rgba(255, 107, 107, 0.5)',
      },
    },
  },
  plugins: [],
}
```

#### Step 2: Add Google Fonts

Update `dapp/index.html`:

```html
<head>
  <!-- Existing fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

  <!-- NEW: Baloo 2 for tiki personality -->
  <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&display=swap" rel="stylesheet">

  <!-- Existing Inter and JetBrains Mono -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
</head>
```

#### Step 3: Create Tiki Component Library

Create `dapp/src/components/tiki/`:

```
dapp/src/components/tiki/
├── MaskBroIndicator.tsx      # Shows which MaskBro agrees with market
├── TikiButton.tsx             # Tiki-styled button component
├── TikiCard.tsx               # Gradient card with mask indicator
├── TikiLoader.tsx             # Spinning mask loader
├── TikiToast.tsx              # Success/error notifications with MaskBro
└── index.ts                   # Export all components
```

**Example: `MaskBroIndicator.tsx`**

```typescript
import React from 'react';

type MaskBroType = 'smirk' | 'sad' | 'wise' | 'crazy' | 'chill';

interface MaskBroIndicatorProps {
  type: MaskBroType;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence?: number; // 1-10
}

const maskBroConfig = {
  smirk: { emoji: '😏', name: 'SmirkBro', color: 'text-tiki-mango' },
  sad: { emoji: '😔', name: 'SadBro', color: 'text-tiki-sunset' },
  wise: { emoji: '🧙', name: 'WiseBro', color: 'text-tiki-lagoon' },
  crazy: { emoji: '🤪', name: 'CrazyBro', color: 'text-tiki-volcano' },
  chill: { emoji: '😎', name: 'ChillBro', color: 'text-tiki-turquoise' },
};

const sentimentText = {
  bullish: 'BULLISH',
  bearish: 'BEARISH',
  neutral: 'UNSURE',
};

export const MaskBroIndicator: React.FC<MaskBroIndicatorProps> = ({
  type,
  sentiment,
  confidence,
}) => {
  const bro = maskBroConfig[type];

  return (
    <div className="flex items-center gap-2 bg-tiki-charcoal/50 rounded-full px-3 py-1">
      <span className="text-xl">{bro.emoji}</span>
      <div className="flex flex-col">
        <span className={`text-xs font-baloo font-semibold ${bro.color}`}>
          {bro.name}: {sentimentText[sentiment]}
        </span>
        {confidence && (
          <div className="flex gap-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`w-1 h-2 rounded-full ${
                  i < confidence ? 'bg-tiki-mango' : 'bg-tiki-driftwood/30'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

### Phase 2: Gradual Component Migration (Week 3-6)

#### Migration Strategy

**A/B Testing Setup**:
```typescript
// Feature flag for tiki theme
const useTikiTheme = localStorage.getItem('theme') === 'tiki' ||
                     import.meta.env.VITE_ENABLE_TIKI === 'true';

// Conditional rendering
<div className={useTikiTheme ? 'tiki-card' : 'cyber-card'}>
  {/* Content */}
</div>
```

**Gradual Rollout**:
1. **Week 3**: Replace 20% of components (buttons, cards on homepage)
2. **Week 4**: Replace 50% of components (market pages, betting interface)
3. **Week 5**: Replace 80% of components (all primary user flows)
4. **Week 6**: 100% tiki, remove cyberpunk fallbacks

**Metrics to Track**:
- User engagement (time on site, clicks)
- Conversion rates (bets placed per session)
- Sentiment analysis (Discord/Twitter feedback)
- Mobile vs desktop performance

### Phase 3: Full Rebrand (Week 7-12)

#### Marketing Site Update

Update `/marketing/index.html` with tiki theme:

```html
<style>
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&display=swap');

  :root {
    --tiki-turquoise: #00CFC1;
    --tiki-coral: #FF6B6B;
    --tiki-mango: #FFB347;
    --tiki-deep-teal: #0A5F5F;
    --tiki-coconut: #FFF8E7;
  }

  body {
    font-family: 'Inter', sans-serif;
    background: var(--tiki-deep-teal);
    color: var(--tiki-coconut);
  }

  h1, h2, h3 {
    font-family: 'Baloo 2', cursive;
  }

  .gradient-text {
    background: linear-gradient(135deg, var(--tiki-turquoise) 0%, var(--tiki-mango) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--tiki-coral), var(--tiki-mango));
    border-radius: 50px;
    padding: 1rem 2rem;
    font-family: 'Baloo 2', cursive;
    font-weight: 700;
    box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
    transition: all 0.3s;
  }

  .btn-primary:hover {
    transform: scale(1.05);
    box-shadow: 0 15px 40px rgba(255, 107, 107, 0.5);
  }
</style>

<!-- Hero Section -->
<section class="hero">
  <div class="text-6xl mb-4">🗿</div>
  <h1 class="text-7xl font-bold mb-4">
    Predict the Future on <span class="gradient-text">Aptos</span>
  </h1>
  <p class="text-xl mb-8">
    Where degens bet on what's <em>probably</em> true
  </p>
  <a href="https://app.movemarket.app" class="btn-primary">
    🌺 Launch App →
  </a>
</section>
```

#### Logo Files

Create logo variants:

```
/marketing/assets/images/logo/
├── maskbro-primary.svg          # Full color tiki mask
├── maskbro-monochrome.svg       # Black/white version
├── maskbro-icon-512.png         # High-res icon for PWA
├── maskbro-icon-192.png         # Standard icon
├── maskbro-icon-32.png          # Favicon
└── maskbro-wordmark.svg         # Logo + "Move Market" text
```

---

## 🎭 MaskBro Lore & Storytelling

### Origin Story

**The Legend of MaskBro Island**

> Long ago, on a mysterious island in the digital seas, five tiki gods emerged to guide travelers through uncertain futures. These gods—SmirkBro, SadBro, WiseBro, CrazyBro, and ChillBro—each possessed unique powers of foresight.
>
> SmirkBro, the Optimist, could see opportunities where others saw risk. SadBro, the Protector, warned of dangers lurking in overconfidence. WiseBro, the Elder, remembered every prediction ever made. CrazyBro, the Chaos Agent, thrived in volatility. And ChillBro, the Balanced, saw truth through emotion.
>
> Together, they formed **The Council of MaskBros**, a decentralized oracle that guides traders on their prediction market journey.
>
> Now, these ancient tiki gods have awakened on the Aptos blockchain, ready to help you predict the future—one bet at a time.

**Use Cases**:
- Homepage storytelling section
- Twitter thread for launch
- Discord server channels (one per MaskBro)
- NFT collection backstory (future governance badges)

### Community Integration

**Discord Server Structure**:
```
🗿 MASKBRO ISLAND
├─ 😏 #smirkbro-alpha (bullish market chat)
├─ 😔 #sadbro-warnings (bearish sentiment)
├─ 🧙 #wisebro-insights (long-term analysis)
├─ 🤪 #crazybro-yolo (degen plays)
└─ 😎 #chillbro-lounge (general discussion)
```

**Twitter Content**:
```
@Move MarketMarket: "SmirkBro was right AGAIN 😏
BTC hit $95k just like the Council predicted.
Current confidence: 8/10 for $100k by EOY.
Check the odds: movemarket.app"

@OracleBro: "SadBro tried to warn you at 67% confidence.
But y'all didn't listen.
Market was right, sentiment was wrong.
This is why we trust the Council, not vibes 😔"
```

---

## 📊 Phased Rollout Timeline

### Month 1: Soft Rebrand (Test & Learn)

**Week 1-2: Foundation**
- [ ] Add tiki color palette to Tailwind config
- [ ] Import Baloo 2 font
- [ ] Create tiki component library
- [ ] A/B test on 20% of users

**Week 3-4: Social Launch**
- [ ] Launch MaskBro mascots on Twitter
- [ ] Post origin story thread
- [ ] Create meme templates with MaskBros
- [ ] Measure community engagement

**Metrics Goal**:
- Twitter impressions: 50k+
- Meme shares: 100+
- Community sentiment: Positive (>70%)

### Month 2: Visual Migration (Validate & Scale)

**Week 5-6: Component Rollout**
- [ ] Migrate 50% of UI components
- [ ] Update marketing homepage
- [ ] Create MaskBro indicator logic
- [ ] Monitor conversion rates

**Week 7-8: Expansion**
- [ ] Migrate remaining components
- [ ] Update mobile app (PWA)
- [ ] Create tiki loading animations
- [ ] Optimize performance

**Metrics Goal**:
- User retention: No drop (maintain >60%)
- Bet volume: Increase 10%+
- Mobile engagement: Increase 15%+
- Page load time: Maintain <2s

### Month 3: Full Commitment (Launch & Grow)

**Week 9-10: Production Rebrand**
- [ ] Remove all cyberpunk fallbacks
- [ ] Launch MaskBro NFT governance badges
- [ ] Integrate MaskBros into oracle resolution
- [ ] Full marketing campaign

**Week 11-12: Community Building**
- [ ] Discord MaskBro channels
- [ ] MaskBro meme contest ($BRO prizes)
- [ ] Partner with Aptos NFT projects
- [ ] Influencer collaborations

**Metrics Goal**:
- User growth: 50%+ increase
- Social mentions: 10,000+
- Media coverage: 5+ articles
- NFT sales: 500+ governance badges

---

## 🎨 Asset Creation Checklist

### Logo & Brand Assets

- [ ] **Primary Logo**: Tiki mask silhouette + wordmark
- [ ] **Icon Variants**: 512px, 192px, 32px, 16px (favicon)
- [ ] **Monochrome**: Black, white versions for versatility
- [ ] **Animated Logo**: Spinning/wiggling mask for loading states

### MaskBro Character Designs

- [ ] **SmirkBro** 😏: 3 poses (neutral, confident, wrong)
- [ ] **SadBro** 😔: 3 poses (cautious, validated, ignored)
- [ ] **WiseBro** 🧙: 3 poses (thinking, speaking, satisfied)
- [ ] **CrazyBro** 🤪: 3 poses (hyped, chaotic, rekt)
- [ ] **ChillBro** 😎: 3 poses (relaxed, analyzing, vibing)

### Marketing Materials

- [ ] **OG Image**: 1200x630 with MaskBros + tagline
- [ ] **Twitter Header**: 1500x500 tiki island scene
- [ ] **Meme Templates**: 10+ formats (Drake, expanding brain, etc.)
- [ ] **Video Intro**: 15s animated MaskBro introduction
- [ ] **Explainer Graphics**: How prediction markets work (tiki-themed)

### UI Textures (Optional Enhancement)

- [ ] **Wood Grain**: Subtle texture for card backgrounds
- [ ] **Bamboo Border**: Organic divider lines
- [ ] **Wave Pattern**: Footer/header accents
- [ ] **Tiki Carving**: Decorative elements for empty states

---

## 🔒 Risk Mitigation Strategy

### Potential Concerns

**1. "Looks Unprofessional"**
- **Risk**: Institutional investors dismiss as toy
- **Mitigation**:
  - Keep technical documentation 100% professional
  - Landing page has "serious" mode toggle
  - Emphasize security audits, LMSR math
  - Show real TVL, volume metrics prominently

**2. "Confuses Existing Users"**
- **Risk**: Current users leave due to UI change
- **Mitigation**:
  - Gradual rollout with A/B testing
  - "Classic theme" toggle for first 2 months
  - Announce rebrand with clear explanation
  - Offer migration rewards (bonus $BRO)

**3. "Cultural Appropriation Concerns"**
- **Risk**: Tiki aesthetic could be seen as appropriation
- **Mitigation**:
  - Abstract, stylized masks (not realistic replicas)
  - Emphasize "digital tiki" / "crypto totem" framing
  - Avoid Polynesian cultural specifics
  - Focus on universal "oracle wisdom" theme

**4. "Meme Fatigue"**
- **Risk**: Novelty wears off, users want substance
- **Mitigation**:
  - MaskBros enhance, don't replace, technical features
  - Dial down personality in critical user flows (betting)
  - Serious data always visible alongside playful elements
  - User setting to reduce MaskBro frequency

### Fallback Plan

If tiki rebrand doesn't resonate (negative metrics after Month 1):

1. **Pause migration** at current % of components
2. **Survey users** for specific concerns
3. **Iterate design** based on feedback (maybe less playful, more sophisticated tiki)
4. **Revert to cyberpunk** as Option B if fundamentally rejected
5. **Keep MaskBros** as opt-in feature (easter egg mode)

---

## 📈 Success Metrics

### Primary KPIs (Must Improve or Maintain)

| Metric | Pre-Rebrand | Post-Rebrand Goal | Measurement |
|--------|-------------|-------------------|-------------|
| **User Retention** | 60% (30-day) | ≥60% (no drop) | Analytics |
| **Bet Volume** | $X/month | +10% | On-chain data |
| **Conversion Rate** | Y% | +15% | Wallet connects → bets |
| **Mobile Engagement** | Z% | +20% | Mobile sessions |
| **Page Load Time** | <2s | <2s (maintain) | Lighthouse |

### Secondary KPIs (Growth Indicators)

| Metric | Baseline | Month 3 Goal | Measurement |
|--------|----------|--------------|-------------|
| **Twitter Followers** | 5k | 25k | @Move MarketMarket |
| **Discord Members** | 1k | 5k | Discord analytics |
| **Social Mentions** | 500/month | 5k/month | Social listening |
| **Meme Virality** | 10 shares/meme | 100+ shares/meme | Twitter API |
| **Press Coverage** | 0 articles | 5+ articles | Media tracking |

### User Feedback Metrics

- **NPS Score**: Target 40+ (good for crypto)
- **Brand Perception**: "Fun but trustworthy" (qualitative)
- **Feature Discovery**: 80%+ users notice MaskBros
- **UI Satisfaction**: 4.5/5 stars (App Store, if applicable)

---

## 🎯 Next Actions

### Immediate (This Week)

1. **Decision Point**: Approve tiki direction or request adjustments
2. **Logo Design**: Commission Option 3 (custom tiki icon) if approved
3. **Tailwind Config**: Add tiki color palette to `dapp/tailwind.config.js`
4. **Component Library**: Create `dapp/src/components/tiki/` directory

### Week 2

5. **MaskBro Characters**: Design 5 mascots (3 poses each)
6. **A/B Test Setup**: Implement feature flag system
7. **Soft Launch**: Post MaskBro origin story on Twitter
8. **Meme Creation**: Generate 10 tiki-themed memes

### Month 1

9. **Gradual Migration**: Roll out tiki components (20% → 50% → 80%)
10. **Community Feedback**: Daily monitoring of sentiment
11. **Performance Testing**: Ensure no degradation
12. **Marketing Assets**: OG image, Twitter header, video intro

---

## 📚 Resources & References

### Design Inspiration

- **Color Palette**: [Coolors.co Tropical Generator](https://coolors.co/)
- **Baloo 2 Font**: [Google Fonts](https://fonts.google.com/specimen/Baloo+2)
- **Tiki Mask References**: Abstract, geometric styles (not culturally specific)

### Technical Resources

- **Tailwind Config**: [Official Docs](https://tailwindcss.com/docs/configuration)
- **Framer Motion**: [Animation Library](https://www.framer.com/motion/)
- **React Spring**: [Alternative Animation](https://www.react-spring.dev/)

### Community Examples

- **Successful Rebrands**: GMX (serious → playful), Zapper (professional → colorful)
- **Mascot Systems**: Uniswap unicorn, Aave ghost, Pudgy Penguins
- **Tiki in Crypto**: [Research similar projects to avoid overlap]

---

## 🎉 Vision: Move Market in 6 Months

**Homepage**:
- Hero with animated tiki island scene
- MaskBros dancing on page load
- Tropical gradient backgrounds
- "Council of MaskBros" section explaining oracle system

**dApp**:
- Every market card shows which MaskBro agrees
- Betting interface with MaskBro reactions
- Loading states feature spinning masks
- Success toasts with tropical confetti
- Profile badges show "favorite MaskBro"

**Community**:
- 25k+ Twitter followers vibing with MaskBro memes
- Discord channels buzzing with bro-specific alpha
- NFT governance badges (500+ holders)
- Media calling Move Market "the fun prediction market"

**Brand Perception**:
- "Polymarket but with personality"
- "Serious tech, playful UI"
- "The prediction market degens love"
- "MaskBros always know 😏"

---

**Status**: 📋 **READY FOR IMPLEMENTATION**

Tiki rebrand strategy is fully designed with phased rollout, technical implementation guide, risk mitigation, and success metrics. Ready to proceed with Phase 1 (Foundation) as soon as approved.

*SmirkBro says: This rebrand is gonna hit different, bro. Trust. 😏*
