# Content Security Policy (CSP) Headers Implementation Guide

## Overview

Content Security Policy (CSP) is a critical security layer that helps prevent Cross-Site Scripting (XSS) attacks, clickjacking, and other code injection attacks by controlling which resources can be loaded and executed by the browser.

## Current Status

✅ **XSS Protection**: Implemented (DOMPurify, SafeHTML component)
✅ **Encrypted Storage**: Implemented (AES-GCM for IndexedDB)
⚠️ **CSP Headers**: Not yet implemented (requires server configuration)

## Recommended CSP Configuration

### Production CSP Header

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://fullnode.devnet.aptoslabs.com https://fullnode.mainnet.aptoslabs.com wss:;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

### Development CSP Header (More Permissive)

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' ws: wss: https://fullnode.devnet.aptoslabs.com;
  frame-ancestors 'none';
```

## Directive Explanations

### Core Directives

1. **`default-src 'self'`**
   - Default policy for all resource types
   - Only allows resources from same origin

2. **`script-src 'self' 'wasm-unsafe-eval'`**
   - Scripts from same origin only
   - `wasm-unsafe-eval`: Required for WebAssembly (Aptos SDK dependency)
   - ⚠️ Avoid `'unsafe-inline'` - we use external scripts only

3. **`style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`**
   - Styles from same origin
   - `unsafe-inline`: Required for Tailwind CSS and styled-components
   - Google Fonts allowed

4. **`font-src 'self' https://fonts.gstatic.com`**
   - Fonts from same origin + Google Fonts CDN

5. **`img-src 'self' data: https:`**
   - Images from same origin
   - `data:`: Allow data URIs (for inline images)
   - `https:`: Allow all HTTPS images (for user-generated content, market thumbnails)

6. **`connect-src`**
   - API endpoints for AJAX, WebSocket, fetch
   - Aptos fullnode endpoints (mainnet + devnet)
   - WebSocket connections for push notifications

### Security Directives

1. **`frame-ancestors 'none'`**
   - Prevents clickjacking attacks
   - No other sites can embed this app in iframes

2. **`base-uri 'self'`**
   - Prevents `<base>` tag injection attacks

3. **`form-action 'self'`**
   - Forms can only submit to same origin

4. **`upgrade-insecure-requests`**
   - Automatically upgrades HTTP to HTTPS

## Implementation Methods

### Method 1: Static Hosting with Headers (Netlify/Vercel)

**Netlify** (`netlify.toml`):
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://fullnode.devnet.aptoslabs.com https://fullnode.mainnet.aptoslabs.com wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

**Vercel** (`vercel.json`):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://fullnode.devnet.aptoslabs.com wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### Method 2: Node.js/Express Server

```javascript
// server.js
const express = require('express');
const helmet = require('helmet');
const app = express();

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "https://fullnode.devnet.aptoslabs.com",
        "https://fullnode.mainnet.aptoslabs.com",
        "wss:"
      ],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  })
);

app.use(express.static('dist'));
app.listen(3000);
```

### Method 3: Meta Tag (Fallback - Less Secure)

⚠️ **Not recommended for production** - meta tags can be manipulated by XSS attacks.

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com">
```

## Testing CSP

### 1. Browser DevTools

Open DevTools Console and look for CSP violation errors:
```
Refused to load the script 'https://evil.com/malicious.js' because it violates the following Content Security Policy directive: "script-src 'self'"
```

### 2. CSP Evaluator

Use Google's CSP Evaluator to check your policy:
https://csp-evaluator.withgoogle.com/

### 3. Report-Only Mode (Testing)

Start with report-only mode to avoid breaking production:

```http
Content-Security-Policy-Report-Only: default-src 'self'; report-uri /csp-violation-report
```

## Common CSP Issues & Solutions

### Issue 1: Tailwind CSS Inline Styles

**Error**: `Refused to apply inline style`

**Solution**: Add `'unsafe-inline'` to `style-src` (already included)

### Issue 2: Aptos SDK WebAssembly

**Error**: `wasm-eval is not allowed`

**Solution**: Add `'wasm-unsafe-eval'` to `script-src` (already included)

### Issue 3: Third-Party Scripts

**Error**: `Refused to load script from 'https://cdn.example.com'`

**Solution**: Add specific domain to `script-src`:
```
script-src 'self' 'wasm-unsafe-eval' https://cdn.example.com
```

### Issue 4: Inline Event Handlers

**Error**: `Refused to execute inline event handler`

**Solution**: Remove inline handlers like `onclick`, use addEventListener instead:

```javascript
// ❌ Bad (won't work with CSP)
<button onclick="handleClick()">Click me</button>

// ✅ Good (CSP-compliant)
<button id="myButton">Click me</button>
<script>
  document.getElementById('myButton').addEventListener('click', handleClick);
</script>
```

## Additional Security Headers

Include these alongside CSP for defense-in-depth:

### X-Frame-Options
```
X-Frame-Options: DENY
```
Prevents clickjacking (redundant with `frame-ancestors 'none'` but provides backwards compatibility)

### X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```
Prevents MIME-type sniffing attacks

### Referrer-Policy
```
Referrer-Policy: strict-origin-when-cross-origin
```
Controls how much referrer information is sent with requests

### Permissions-Policy
```
Permissions-Policy: camera=(), microphone=(), geolocation=()
```
Disables browser features the app doesn't use

## Monitoring CSP Violations

### Setup Violation Reporting

```http
Content-Security-Policy:
  default-src 'self';
  ...
  report-uri /api/csp-violation;
  report-to csp-endpoint;
```

### Server-Side Logging

```javascript
// Express endpoint to log CSP violations
app.post('/api/csp-violation', express.json({ type: 'application/csp-report' }), (req, res) => {
  console.error('CSP Violation:', JSON.stringify(req.body, null, 2));
  // Log to monitoring service (Sentry, LogRocket, etc.)
  res.status(204).send();
});
```

## Deployment Checklist

- [ ] Add CSP headers via hosting platform (Netlify/Vercel config)
- [ ] Test in report-only mode first
- [ ] Check DevTools console for violations
- [ ] Validate with CSP Evaluator
- [ ] Test all critical user flows
- [ ] Setup CSP violation monitoring
- [ ] Add remaining security headers (X-Frame-Options, etc.)
- [ ] Enable CSP in enforcement mode
- [ ] Monitor for false positives

## Next Steps

1. **Immediate**: Configure CSP headers in hosting platform
2. **Short-term**: Setup violation reporting and monitoring
3. **Long-term**: Gradually tighten policy (remove `unsafe-inline` if possible)

## References

- [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Google CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
