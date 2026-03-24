# Tiki Rebrand - Quick Start

**Status**: ✅ Ready for Implementation
**Last Updated**: 2025-10-12

---

## 🚀 Getting Started (5 Minutes)

### Step 1: Add Baloo 2 Font

Edit `dapp/index.html` and add to `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&display=swap" rel="stylesheet">
```

### Step 2: Test Build

```bash
cd dapp
npm run build
```

Should complete successfully with no errors.

### Step 3: Use Tiki Components

```tsx
import { MaskBroIndicator, TikiButton } from '@/components/tiki';

// In your component
<TikiButton variant="primary" emoji="🌺" onClick={handleClick}>
  Click Me
</TikiButton>
```

---

## 🎨 Quick Examples

### Market Card with MaskBro

```tsx
import { MaskBroIndicator, selectMaskBro } from '@/components/tiki';

function MarketCard({ yesOdds, volume, question }) {
  const { type, sentiment, confidence } = selectMaskBro(yesOdds, volume);

  return (
    <div className="bg-gradient-to-br from-tiki-deep-teal to-tiki-turquoise border-2 border-tiki-mango rounded-2xl p-6 shadow-glow">
      <MaskBroIndicator type={type} sentiment={sentiment} confidence={confidence} />

      <h3 className="font-baloo text-2xl text-tiki-coconut mt-4">
        {question}
      </h3>

      <div className="text-tiki-mango text-5xl font-mono my-4">
        {yesOdds}%
      </div>
    </div>
  );
}
```

### Tiki Button

```tsx
import { TikiButton } from '@/components/tiki';

<TikiButton
  variant="primary"
  size="lg"
  emoji="🎯"
  loading={isLoading}
  onClick={handleBet}
>
  Place Bet
</TikiButton>
```

### Using Tiki Colors

```tsx
// Gradient backgrounds
<div className="bg-gradient-to-r from-tiki-coral to-tiki-mango">
  Gradient Background
</div>

// Text colors
<h1 className="text-tiki-turquoise font-baloo text-4xl">
  Heading
</h1>

// Glowing shadows
<button className="shadow-glow hover:shadow-glow-coral">
  Glowing Button
</button>
```

---

## 📊 Component API Reference

### MaskBroIndicator

```typescript
<MaskBroIndicator
  type="smirk" | "sad" | "wise" | "crazy" | "chill"
  sentiment="bullish" | "bearish" | "neutral"
  confidence={1-10}  // Optional
  compact={boolean}  // Optional, default false
/>
```

### TikiButton

```typescript
<TikiButton
  variant="primary" | "secondary" | "success" | "danger"
  size="sm" | "md" | "lg"
  emoji="🌺"  // Optional
  loading={boolean}  // Optional
  fullWidth={boolean}  // Optional
/>
```

### selectMaskBro Helper

```typescript
const { type, sentiment, confidence } = selectMaskBro(
  yesOdds: number,    // 0-100
  volume: number,     // in USDC
  volatility?: number // Optional, >20 = high
);
```

---

## 🎨 Tiki Color Palette

```css
/* Primary Colors */
bg-tiki-turquoise   /* #00CFC1 - Main brand */
bg-tiki-coral       /* #FF6B6B - Energy */
bg-tiki-mango       /* #FFB347 - Rewards */
bg-tiki-deep-teal   /* #0A5F5F - Backgrounds */
bg-tiki-coconut     /* #FFF8E7 - Text */

/* Accent Colors */
bg-tiki-volcano     /* #E63946 - Alerts */
bg-tiki-lagoon      /* #4ECDC4 - Success */
bg-tiki-sunset      /* #F77F00 - Warnings */
bg-tiki-bamboo      /* #90BE6D - Growth */

/* Neutrals */
bg-tiki-charcoal    /* #1A1A2E - Dark mode */
bg-tiki-driftwood   /* #564D4D - Secondary text */
bg-tiki-sand        /* #F4E9D8 - Light backgrounds */
```

---

## 🎭 MaskBro Quick Reference

| Character | Emoji | When to Use | Color |
|-----------|-------|-------------|-------|
| SmirkBro | 😏 | yesOdds > 60% | Mango |
| SadBro | 😔 | yesOdds < 40% | Sunset |
| WiseBro | 🧙 | volume > 10k | Lagoon |
| CrazyBro | 🤪 | volatility > 20% | Volcano |
| ChillBro | 😎 | 45-55% odds | Turquoise |

---

## ✅ Testing Checklist

- [ ] Baloo 2 font loads correctly
- [ ] MaskBroIndicator renders with emoji
- [ ] TikiButton gradient works
- [ ] Animations smooth (wiggle, glow, spin)
- [ ] Colors match brand palette
- [ ] No TypeScript errors
- [ ] Build completes successfully

---

## 📚 Full Documentation

- [TIKI_REBRAND_STRATEGY.md](TIKI_REBRAND_STRATEGY.md) - Complete 31KB strategy
- [TIKI_IMPLEMENTATION_COMPLETE.md](TIKI_IMPLEMENTATION_COMPLETE.md) - Implementation summary
- Component source: `dapp/src/components/tiki/`

---

## 🎯 Next Steps

1. **Add Baloo 2 font** to HTML
2. **Test build** locally
3. **Replace one button** with TikiButton to test
4. **Review strategy doc** for phased rollout
5. **Launch A/B test** with 20% of users

*SmirkBro says: Let's ship it, bro. 😏*
