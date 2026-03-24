# XSS Protection Implementation Guide

## Overview

This guide documents the comprehensive XSS (Cross-Site Scripting) protection implementation for the Move Market dApp. All user-generated content is sanitized using DOMPurify to prevent malicious script injection.

---

## Security Architecture

### Multi-Layer XSS Protection

```
┌─────────────────────────────────────────────────────────┐
│                   INPUT VALIDATION                       │
│  1. Sanitize at Data Source (API responses)             │
│  2. Sanitize at Component Level (before rendering)      │
│  3. React's Built-in XSS Protection (for props)         │
└─────────────────────────────────────────────────────────┘
```

---

## Sanitization Utilities

### Location: `/frontend/src/utils/sanitize.ts`

### Available Functions

#### 1. `sanitizeText(text: string): string`
**Use Case**: Plain text fields where NO HTML should be allowed

```typescript
import { sanitizeText } from '../utils/sanitize';

// Removes ALL HTML tags
const safeText = sanitizeText(userInput);
// Input:  "<script>alert('XSS')</script>Hello"
// Output: "alert('XSS')Hello"
```

**Best For**:
- Market outcomes
- User names
- Short text fields
- Any field where HTML is never expected

---

#### 2. `sanitizeHTML(dirty: string): string`
**Use Case**: Basic formatted text with limited HTML tags

```typescript
import { sanitizeHTML } from '../utils/sanitize';

const safeHTML = sanitizeHTML(userInput);
// Input:  "<p>Hello <script>alert(1)</script><b>World</b></p>"
// Output: "<p>Hello <b>World</b></p>"
```

**Allowed Tags**: `b`, `i`, `em`, `strong`, `a`, `p`, `br`
**Allowed Attributes**: `href`, `target`, `rel`

**Best For**:
- Comments/discussions
- Short descriptions
- Basic formatted text

---

#### 3. `sanitizeRichText(dirty: string): string`
**Use Case**: Rich formatted content with more HTML tags

```typescript
import { sanitizeRichText } from '../utils/sanitize';

const safeRichText = sanitizeRichText(userInput);
```

**Allowed Tags**: `h1`-`h6`, `p`, `br`, `strong`, `em`, `u`, `a`, `ul`, `ol`, `li`, `blockquote`, `code`, `pre`

**Best For**:
- Market descriptions (long form)
- Documentation
- Rich text content

---

#### 4. `sanitizeURL(url: string): string`
**Use Case**: Validating and sanitizing URLs

```typescript
import { sanitizeURL } from '../utils/sanitize';

const safeURL = sanitizeURL(userURL);
// Input:  "javascript:alert('XSS')"
// Output: "" (invalid scheme, returns empty)

// Input:  "https://example.com"
// Output: "https://example.com" (valid)
```

**Allowed Schemes**: `http`, `https`, `mailto`

**Best For**:
- External links
- Resolution sources
- User profile links

---

#### 5. `sanitizeMarketQuestion(question: string, maxLength?: number): string`
**Use Case**: Specific sanitization for market questions

```typescript
import { sanitizeMarketQuestion } from '../utils/sanitize';

const safeQuestion = sanitizeMarketQuestion(userQuestion, 200);
// - Removes ALL HTML
// - Trims whitespace
// - Enforces max length (default: 200 characters)
// - Adds "..." if truncated
```

**Best For**:
- Market question titles
- Short headlines
- Summaries

---

#### 6. `sanitizeMarketDescription(description: string, maxLength?: number): string`
**Use Case**: Sanitizing market descriptions with basic formatting

```typescript
import { sanitizeMarketDescription } from '../utils/sanitize';

const safeDescription = sanitizeMarketDescription(userDescription, 1000);
// - Allows basic HTML (limited tags)
// - Enforces max length (default: 1000 characters)
// - Preserves line breaks
```

**Best For**:
- Market descriptions
- Resolution criteria
- Detailed explanations

---

## SafeHTML Component

### Location: `/frontend/src/components/SafeHTML.tsx`

### Usage

The `SafeHTML` component is a safe alternative to `dangerouslySetInnerHTML`.

#### Basic Usage

```tsx
import { SafeHTML } from '../components/SafeHTML';

// Plain text (removes all HTML)
<SafeHTML html={userInput} type="text" />

// Basic HTML (limited tags)
<SafeHTML html={userContent} type="html" />

// Rich HTML (more tags allowed)
<SafeHTML html={marketDescription} type="richtext" />
```

#### Advanced Usage

```tsx
// Custom HTML element
<SafeHTML
  html={content}
  type="html"
  as="div"
  className="prose dark:prose-invert"
/>

// With custom styling
<SafeHTML
  html={description}
  type="richtext"
  as="article"
  style={{ maxHeight: '300px', overflow: 'auto' }}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `html` | `string` | Required | The HTML string to sanitize and render |
| `type` | `'text' \| 'html' \| 'richtext'` | `'text'` | Sanitization level |
| `as` | `React.ElementType` | `'div'` | HTML element to render |
| `className` | `string` | - | CSS classes |
| `style` | `React.CSSProperties` | - | Inline styles |

---

## React Hook: `useSanitize`

### Location: `/frontend/src/utils/sanitize.ts`

### Usage

For inline sanitization in functional components:

```tsx
import { useSanitize } from '../utils/sanitize';

function MarketCard({ market }) {
  const { sanitizeText, sanitizeMarketQuestion } = useSanitize();

  return (
    <div>
      <h3>{sanitizeMarketQuestion(market.question)}</h3>
      <p>{sanitizeText(market.description)}</p>
    </div>
  );
}
```

---

## Implementation Examples

### Example 1: Market List Component

**File**: `/frontend/src/components/MarketList.tsx`

```tsx
import { sanitizeMarketQuestion, sanitizeText } from '../utils/sanitize';

// Sanitize data from blockchain
const market = {
  question: sanitizeMarketQuestion(rawQuestion),
  outcomes: rawOutcomes.map(outcome => sanitizeText(outcome)),
  // ... other fields
};

// Render safely
<h3>{market.question}</h3>
{market.outcomes.map(outcome => <span>{outcome}</span>)}
```

**Protection Applied**:
- ✅ Market questions sanitized (no HTML allowed)
- ✅ Outcome names sanitized (no HTML allowed)
- ✅ Length limits enforced

---

### Example 2: Market Detail Page

**File**: `/frontend/src/pages/MarketDetailPage.tsx`

```tsx
import { SafeHTML } from '../components/SafeHTML';
import { sanitizeMarketQuestion } from '../utils/sanitize';

<h1>{sanitizeMarketQuestion(market.question)}</h1>

<div className="description">
  <SafeHTML html={market.description} type="text" as="p" />
</div>
```

**Protection Applied**:
- ✅ Question title sanitized
- ✅ Description sanitized (no HTML allowed in this example)
- ✅ Safe rendering with SafeHTML component

---

### Example 3: Mobile Market Card

**File**: `/frontend/src/components/mobile/MobileMarketCard.tsx`

```tsx
import { sanitizeMarketQuestion, sanitizeText } from '../../utils/sanitize';

<h3>{sanitizeMarketQuestion(market.question)}</h3>
{market.outcomes.map(outcome => (
  <span>{sanitizeText(outcome)}</span>
))}
```

**Protection Applied**:
- ✅ Questions sanitized before display
- ✅ Outcomes sanitized before display
- ✅ Mobile-optimized with same security as desktop

---

## Testing XSS Protection

### Test Cases

#### 1. Basic Script Injection
```typescript
const malicious = "<script>alert('XSS')</script>";
const safe = sanitizeText(malicious);
// Expected: "alert('XSS')" (script tags removed)
```

#### 2. Event Handler Injection
```typescript
const malicious = "<img src=x onerror=alert('XSS')>";
const safe = sanitizeHTML(malicious);
// Expected: "" (img tag not allowed, event handler stripped)
```

#### 3. JavaScript URL
```typescript
const malicious = "javascript:alert('XSS')";
const safe = sanitizeURL(malicious);
// Expected: "" (javascript: scheme not allowed)
```

#### 4. Nested Tags
```typescript
const malicious = "<p><b><script>alert(1)</script>Bold</b></p>";
const safe = sanitizeHTML(malicious);
// Expected: "<p><b>Bold</b></p>" (script removed, safe tags preserved)
```

#### 5. HTML Entity Encoding
```typescript
const malicious = "&lt;script&gt;alert('XSS')&lt;/script&gt;";
const safe = sanitizeText(malicious);
// Expected: Decoded and stripped properly
```

### Manual Testing Steps

1. **Test Market Creation**:
   ```typescript
   // Try creating a market with:
   question: "Will <script>alert('XSS')</script> Bitcoin hit $100k?"

   // Expected: Script tags removed, question displayed safely
   ```

2. **Test Outcome Names**:
   ```typescript
   outcomes: ["<img src=x onerror=alert(1)>Yes", "No"]

   // Expected: Image tag removed, "Yes" displayed
   ```

3. **Test Market Descriptions**:
   ```typescript
   description: "<p>Valid text</p><script>alert('XSS')</script>"

   // Expected: <p> preserved (if using richtext), script removed
   ```

---

## DOMPurify Configuration

### Current Configuration

#### For Plain Text (`sanitizeText`)
```typescript
DOMPurify.sanitize(text, {
  ALLOWED_TAGS: [],        // No tags allowed
  KEEP_CONTENT: true,      // Keep text content
});
```

#### For Basic HTML (`sanitizeHTML`)
```typescript
DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,  // No data-* attributes
});
```

#### For Rich Text (`sanitizeRichText`)
```typescript
DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br',
                 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li',
                 'blockquote', 'code', 'pre'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  ALLOW_DATA_ATTR: false,
});
```

### Security Settings (All Modes)
```typescript
// Applied to all sanitization functions
DOMPurify.setConfig({
  SAFE_FOR_TEMPLATES: true,     // Extra template safety
  RETURN_TRUSTED_TYPE: false,   // Return regular string
  SANITIZE_DOM: true,           // Sanitize DOM nodes
  FORBID_TAGS: ['style'],       // Never allow style tags
  FORBID_ATTR: ['style'],       // Never allow inline styles (optional)
});
```

---

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Forgetting to Sanitize
```tsx
// BAD: Directly rendering user input
<h1>{market.question}</h1>
```

```tsx
// GOOD: Sanitize before rendering
<h1>{sanitizeMarketQuestion(market.question)}</h1>
```

---

### ❌ Pitfall 2: Using `dangerouslySetInnerHTML`
```tsx
// BAD: Dangerous and unsafe
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

```tsx
// GOOD: Use SafeHTML component
<SafeHTML html={userContent} type="html" />
```

---

### ❌ Pitfall 3: Sanitizing Too Late
```tsx
// BAD: Storing unsanitized data
const [market, setMarket] = useState({
  question: rawQuestion  // Not sanitized!
});
```

```tsx
// GOOD: Sanitize at data source
const [market, setMarket] = useState({
  question: sanitizeMarketQuestion(rawQuestion)
});
```

---

### ❌ Pitfall 4: Wrong Sanitization Level
```tsx
// BAD: Using richtext for short fields
const outcome = sanitizeRichText(userOutcome); // Allows HTML unnecessarily
```

```tsx
// GOOD: Use strictest sanitization needed
const outcome = sanitizeText(userOutcome); // No HTML allowed
```

---

## Performance Considerations

### DOMPurify Performance

- **Overhead**: ~1-5ms per sanitization call (small strings)
- **Optimization**: DOMPurify is already highly optimized
- **Caching**: Consider memoizing sanitized values

### Memoization Example

```tsx
import { useMemo } from 'react';
import { sanitizeMarketQuestion } from '../utils/sanitize';

function MarketCard({ market }) {
  const safeQuestion = useMemo(
    () => sanitizeMarketQuestion(market.question),
    [market.question]
  );

  return <h3>{safeQuestion}</h3>;
}
```

---

## Integration Checklist

### For New Components

When creating a new component that displays user-generated content:

- [ ] Import sanitization utilities
  ```tsx
  import { sanitizeText, sanitizeHTML, SafeHTML } from '../utils/sanitize';
  ```

- [ ] Identify all user input fields
  - Market questions
  - Market descriptions
  - Outcome names
  - Comments/messages
  - User names
  - External URLs

- [ ] Apply appropriate sanitization
  - Use `sanitizeText()` for plain text
  - Use `sanitizeHTML()` for basic formatting
  - Use `SafeHTML` component for rich content

- [ ] Test with malicious inputs
  - `<script>alert('XSS')</script>`
  - `<img src=x onerror=alert(1)>`
  - `javascript:alert('XSS')`

- [ ] Review in browser DevTools
  - Check rendered HTML has no script tags
  - Verify no event handlers (onclick, onerror, etc.)
  - Confirm URLs use safe schemes

---

## Security Audit Compliance

### Gemini Security Audit Score: 8/10 ✅

**Strengths**:
- ✅ DOMPurify library (industry standard)
- ✅ Multiple sanitization functions for different use cases
- ✅ SafeHTML component for safe rendering
- ✅ Comprehensive coverage of user input

**Recommendations Implemented**:
1. ✅ Strict whitelist-based configuration
2. ✅ Multiple sanitization levels (text, html, richtext)
3. ✅ SafeHTML component to replace dangerouslySetInnerHTML
4. ✅ Sanitization at data source (not just at render time)

**Future Enhancements** (Recommended by Auditor):
1. Penetration testing with OWASP test vectors
2. Regular DOMPurify version updates
3. Consider vetted rich text editor for user input
4. Implement Content Security Policy headers

---

## Maintenance & Updates

### Keeping DOMPurify Updated

```bash
# Check for updates
npm outdated dompurify

# Update to latest version
npm update dompurify @types/dompurify

# Or specific version
npm install dompurify@3.x.x
```

### Monitoring Security Advisories

Subscribe to:
- [DOMPurify Security Advisories](https://github.com/cure53/DOMPurify/security/advisories)
- [npm Security Advisories](https://www.npmjs.com/advisories)
- [Snyk Vulnerability Database](https://snyk.io/vuln/)

### Quarterly Review Checklist

- [ ] Review DOMPurify configuration
- [ ] Update allowed tags/attributes if needed
- [ ] Test with new XSS attack vectors
- [ ] Review all components for new user input fields
- [ ] Update this documentation

---

## References

### Official Documentation
- [DOMPurify GitHub](https://github.com/cure53/DOMPurify)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [React Security Best Practices](https://react.dev/learn/manipulating-the-dom-with-refs#best-practices-for-dom-manipulation-with-refs)

### Testing Resources
- [OWASP XSS Test Vectors](https://owasp.org/www-community/xss-filter-evasion-cheatsheet)
- [PortSwigger XSS Cheat Sheet](https://portswigger.net/web-security/cross-site-scripting/cheat-sheet)

---

## Support

For questions or issues related to XSS protection:

1. **Review this guide** for common patterns
2. **Check test cases** in `/frontend/src/utils/sanitize.test.ts` (if exists)
3. **Consult security team** for new attack vectors
4. **File security issue** for potential vulnerabilities

---

**Last Updated**: 2025-10-09
**Audit Status**: ✅ Passed Gemini Security Audit (8/10)
**Production Ready**: Yes (with recommended enhancements)
