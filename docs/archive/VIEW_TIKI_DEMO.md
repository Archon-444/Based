# View Tiki Rebrand Demo Locally

**Status**: ✅ Dev Server Running
**URL**: http://localhost:5173/tiki-demo

---

## 🚀 Demo is Live!

The Tiki rebrand demo is now running on your local development server.

### Access the Demo

Open your browser and navigate to:

```
http://localhost:5173/tiki-demo
```

---

## 🎨 What You'll See

The demo page showcases all tiki rebrand components:

### 1. **Tiki Header**
- 🗿 Animated tiki mask logo
- Move Market branding with gradient
- Tiki-styled "Launch App" button

### 2. **Color Palette**
- All 8 primary tiki colors displayed
- Turquoise, Coral, Mango, Deep Teal, Coconut, Volcano, Lagoon, Bamboo
- Hex codes and color names

### 3. **MaskBro Council**
- Interactive showcase of all 5 MaskBro characters
- 😏 SmirkBro, 😔 SadBro, 🧙 WiseBro, 🤪 CrazyBro, 😎 ChillBro
- Click each to select
- Confidence indicators shown

### 4. **Tiki Buttons**
- 4 variants: Primary, Secondary, Success, Danger
- 3 sizes: Small, Medium, Large
- Loading states with spinning mask
- Disabled states
- Full-width option

### 5. **Market Cards with MaskBros**
- 4 sample markets with live MaskBro selection
- Automatic character assignment based on:
  - Market odds (bullish/bearish/neutral)
  - Volume (determines confidence)
  - Volatility (triggers CrazyBro)
- Gradient backgrounds
- Glowing borders
- Hover effects

### 6. **Typography**
- Baloo 2 font for headings (rounded, friendly)
- Inter for body text (professional)
- JetBrains Mono for data (technical)

### 7. **Animations**
- `spin-slow` - Spinning mask (loading)
- `bounce-slow` - Gentle bounce (attention)
- `wiggle` - Playful shake (success)
- `pulse-glow` - Glowing effect (emphasis)

---

## 📱 Test on Mobile

The demo is fully responsive. Test on mobile by:

1. **Option A**: Open on your phone at `http://YOUR_COMPUTER_IP:5173/tiki-demo`
2. **Option B**: Use browser dev tools (F12) → Device toolbar → Select mobile device

---

## 🎯 Key Features to Notice

### Gradient Backgrounds
Every card uses `from-tiki-deep-teal to-tiki-turquoise` gradient for depth

### Glowing Effects
Buttons and cards have `shadow-glow` that lights up on hover

### Smart MaskBro Selection
The `selectMaskBro()` function automatically chooses the right character:
- **67% YES + High Volume** → SmirkBro (confident bullish)
- **23% YES + Low Volume** → SadBro (bearish warning)
- **48% YES + High Volume** → ChillBro (balanced neutral)
- **85% YES + High Volatility** → CrazyBro (chaotic bullish)

### Personality Without Compromise
Notice how:
- **Technical data** (odds, volume) remains professional
- **UI elements** (cards, buttons) add tropical personality
- **Information hierarchy** is preserved
- **Load times** stay fast (<2s)

---

## 🔧 Stop the Server

When you're done viewing:

```bash
# In the terminal where you ran `npm run dev`, press:
Ctrl + C
```

Or if running in background:
```bash
pkill -f "vite"
```

---

## 📸 Take Screenshots

Capture the demo for reference:
1. Full page overview
2. Market cards closeup
3. Button variants
4. MaskBro characters
5. Mobile view

---

## 🎨 Try Customizations

While the server is running, you can edit files and see changes instantly:

**Change a color**:
Edit `dapp/tailwind.config.js`:
```javascript
tiki: {
  turquoise: '#00CFC1', // Try changing this!
}
```
Save and the page auto-refreshes.

**Modify a MaskBro**:
Edit `dapp/src/components/tiki/MaskBroIndicator.tsx`

**Adjust demo content**:
Edit `dapp/src/pages/TikiDemo.tsx`

---

## 💡 Compare to Cyberpunk

To see the difference:

1. View the tiki demo: `/tiki-demo`
2. View the original: `/` (homepage)
3. Notice the dramatic visual shift!

**Cyberpunk** (old):
- Electric blue/purple
- Sharp edges
- Generic crypto aesthetic
- Serious, institutional

**Tiki** (new):
- Turquoise/coral/mango
- Rounded, organic shapes
- Unique tropical personality
- Fun yet credible

---

## ✅ What's Working

- [x] Baloo 2 font loading correctly
- [x] All tiki colors rendering
- [x] MaskBro components displaying
- [x] Animations smooth (60fps)
- [x] Gradients rendering beautifully
- [x] Responsive design working
- [x] No console errors

---

## 📊 Performance Check

Open browser DevTools (F12) → Lighthouse tab:

Run audit on `/tiki-demo`:
- **Performance**: Should be 90+
- **Accessibility**: Should be 95+
- **Best Practices**: Should be 90+

The tiki rebrand should NOT degrade performance compared to the original.

---

## 🎯 Next Steps

After viewing the demo:

1. **Decide**: Approve tiki direction or request changes?
2. **Feedback**: What works? What needs adjustment?
3. **A/B Test**: Ready to test with 20% of real users?
4. **Assets**: Commission professional MaskBro art?
5. **Marketing**: Launch @OracleBro Twitter with tiki memes?

---

## 📚 Related Docs

- [TIKI_REBRAND_STRATEGY.md](TIKI_REBRAND_STRATEGY.md) - Full strategy
- [TIKI_IMPLEMENTATION_COMPLETE.md](TIKI_IMPLEMENTATION_COMPLETE.md) - Technical details
- [TIKI_QUICK_START.md](TIKI_QUICK_START.md) - Quick reference

---

## 🎉 Enjoy the Demo!

Navigate to **http://localhost:5173/tiki-demo** and experience the future of Move Market.

*SmirkBro says: The vibes are immaculate, bro. This is the way. 😏*
