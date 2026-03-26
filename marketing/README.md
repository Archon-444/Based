# Based - Marketing Site

Static marketing landing page for Based prediction markets platform.

## Quick Start

### Local Development

```bash
# Start local server (Python)
npm run dev

# Or use any static server
python3 -m http.server 3000
```

Visit http://localhost:3000

## Structure

```
marketing/
├── index.html          # Main landing page
├── assets/
│   ├── css/           # Stylesheets (if not using CDN)
│   ├── js/            # JavaScript files
│   └── images/        # Images, logos, OG cards
└── pages/             # Additional pages (docs, FAQ, etc.)
```

## Deployment

### Option 1: Cloudflare Pages

1. Connect GitHub repository to Cloudflare Pages
2. Set build settings:
   - Build command: (none - static HTML)
   - Build output directory: `/marketing`
3. Deploy

### Option 2: Vercel

```bash
cd marketing
vercel --prod
```

### Option 3: Netlify

```bash
cd marketing
netlify deploy --prod --dir=.
```

## DNS Configuration

Point your domain to the marketing site:

```
Type: CNAME | Name: @   | Content: based.pages.dev
Type: CNAME | Name: www | Content: based.app
```

## Production Optimization

Before production:

1. **Optimize Images**: Compress all images (use TinyPNG, ImageOptim)
2. **Replace CDN Tailwind**: Build custom CSS bundle
3. **Add Analytics**: Insert GA4/Plausible tracking code
4. **Create OG Image**: Design social sharing image (1200x630)
5. **Enable Caching**: Set cache headers for assets

## Performance Targets

- Lighthouse Score: 95+
- First Contentful Paint: <1s
- Time to Interactive: <2s
- Total Page Size: <500KB

## Links

- dApp: https://app.based.app
- Docs: https://docs.based.app
- Contract: https://sepolia.basescan.org
