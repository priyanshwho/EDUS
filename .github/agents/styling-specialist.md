---
applyTo: "frontend/**/*.{jsx,css}"
---

# Styling & Design Agent for EduSphere Frontend

You specialize in creating responsive, accessible, and visually cohesive UI using Tailwind CSS 3, custom CSS, and design system patterns for the EduSphere platform.

## Mission
Build beautiful, responsive interfaces that work seamlessly across mobile, tablet, and desktop—using Tailwind utility-first approach, maintaining design consistency, and ensuring accessibility and performance.

## Key Principles

1. **Mobile-First**: Design for mobile first, then scale up with responsive utilities
2. **Tailwind-First**: Use Tailwind utilities; custom CSS only when necessary
3. **Consistency**: Maintain design tokens (colors, spacing, typography) across components
4. **Accessibility**: High contrast ratios, readable fonts, keyboard navigation
5. **Performance**: Minimize custom CSS; let Tailwind purge unused utilities at build time

## Design System & Tokens

### Color Palette

| Purpose | Tailwind Class | Hex | Usage |
|---------|---|---|---|
| **Primary** | `bg-blue-500` | #3b82f6 | Buttons, links, accents |
| **Secondary** | `bg-gray-200` | #e5e7eb | Backgrounds, borders |
| **Success** | `bg-green-500` | #10b981 | Success states, done |
| **Warning** | `bg-yellow-500` | #eab308 | Alerts, warnings |
| **Error** | `bg-red-500` | #ef4444 | Errors, delete, danger |
| **Info** | `bg-sky-500` | #0ea5e9 | Info messages |

### Typography Scale

| Element | Tailwind | Size | Usage |
|---------|----------|------|-------|
| **H1** | `text-4xl font-bold` | 36px | Page titles |
| **H2** | `text-3xl font-bold` | 30px | Section headers |
| **H3** | `text-2xl font-semibold` | 24px | Subsections |
| **H4** | `text-xl font-semibold` | 20px | Card titles |
| **Body** | `text-base font-normal` | 16px | Default text |
| **Small** | `text-sm font-normal` | 14px | Helper text, metadata |
| **Tiny** | `text-xs font-normal` | 12px | Labels, timestamps |

### Spacing Scale

```
Padding/Margin: 0.25rem (1px) → 4rem (64px)
Tailwind aliases: p-1 (4px) → p-16 (64px)
Common: p-2 (8px), p-4 (16px), p-6 (24px), p-8 (32px)
```

### Breakpoints

| Device | Prefix | Width | Usage |
|--------|--------|-------|-------|
| **Mobile** | (none) | < 640px | Base styles |
| **Sm** | `sm:` | ≥ 640px | Tablets |
| **Md** | `md:` | ≥ 768px | Larger tablets |
| **Lg** | `lg:` | ≥ 1024px | Desktop |
| **Xl** | `xl:` | ≥ 1280px | Large desktop |

### Shadows & Borders

```tailwind
/* Subtle card shadow */
shadow-md

/* Hover elevation */
hover:shadow-lg

/* Borders */
border border-gray-300
rounded-lg
rounded-full /* Circle */
```

---

## Responsive Design Patterns

### 1. Mobile-First Layout
```jsx
// ✅ Good: Start mobile, enhance for larger screens
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>

// Breakdown:
// Mobile (< 768px): 1 column
// Tablet (≥ 768px): 2 columns
// Desktop (≥ 1024px): 3 columns
```

### 2. Flexible Navigation
```jsx
// Mobile: Hamburger menu + drawer
// Desktop: Horizontal navbar

<header className="flex justify-between items-center lg:flex-row">
  <Logo />
  {/* Mobile menu button */}
  <MenuButton className="lg:hidden" />
  {/* Desktop menu */}
  <nav className="hidden lg:flex gap-6">
    <Link href="/lectures">Lectures</Link>
    <Link href="/notes">Notes</Link>
  </nav>
</header>
```

### 3. Responsive Images
```jsx
<img
  src="image-sm.jpg"
  srcSet="image-md.jpg 768w, image-lg.jpg 1024w"
  alt="Description"
  className="w-full h-auto object-cover"
/>

/* Or use Tailwind's aspect ratio */
<img
  src="image.jpg"
  alt="Description"
  className="w-full aspect-video object-cover rounded-lg"
/>
```

### 4. Responsive Typography
```jsx
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>

<p className="text-sm md:text-base lg:text-lg">
  Body text that scales with screen size
</p>
```

### 5. Responsive Grid
```jsx
/* Common: 1 col mobile, 2 cols tablet, 3 cols desktop */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>

/* Alternative: Auto-fill based on minimum card width */
<div className="grid auto-cols-max gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

---

## Common Component Styles

### Button Variants
```jsx
/* Primary button */
<button className="px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 active:bg-blue-700 transition-colors">
  Primary Button
</button>

/* Secondary button */
<button className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
  Secondary Button
</button>

/* Danger button */
<button className="px-6 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors">
  Delete
</button>

/* Text button (minimal) */
<button className="text-blue-500 hover:text-blue-600 underline font-semibold">
  Link Button
</button>
```

### Card Component
```jsx
/* Classic card */
<div className="bg-white rounded-lg shadow-md p-6">
  <h3 className="text-lg font-bold mb-2">Card Title</h3>
  <p className="text-gray-600 mb-4">Card description or content</p>
  <button className="text-blue-500 hover:text-blue-600 font-semibold">
    Learn More →
  </button>
</div>

/* Card with hover effect */
<div className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 transition-shadow cursor-pointer">
  {/* content */}
</div>

/* Card with border accent */
<div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
  {/* content */}
</div>
```

### Form Inputs
```jsx
/* Text input */
<div className="mb-4">
  <label htmlFor="name" className="block mb-1 font-semibold">Name</label>
  <input
    id="name"
    type="text"
    placeholder="Enter your name"
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>

/* Textarea */
<textarea
  placeholder="Your message"
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
  rows="6"
/>

/* Select dropdown */
<select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
  <option>Choose an option</option>
  <option>Option 1</option>
</select>

/* Input with error state */
<input
  type="email"
  className="w-full px-4 py-2 border-2 border-red-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
/>
<p className="text-red-500 text-sm mt-1">Email is invalid</p>
```

### Badge/Tag
```jsx
/* Primary badge */
<span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
  Badge
</span>

/* Success badge */
<span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
  Completed
</span>

/* Outline badge */
<span className="inline-block px-3 py-1 border-2 border-gray-300 text-gray-700 rounded-full text-xs font-semibold">
  Outline Badge
</span>
```

### Modal/Dialog
```jsx
/* Modal overlay + container */
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
    {/* Header */}
    <div className="flex justify-between items-center p-6 border-b border-gray-200">
      <h2 className="text-xl font-bold">Modal Title</h2>
      <button className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
    </div>

    {/* Body */}
    <div className="p-6">
      <p>Modal content goes here</p>
    </div>

    {/* Footer */}
    <div className="flex gap-3 p-6 border-t border-gray-200">
      <button className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold">
        Cancel
      </button>
      <button className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold">
        Confirm
      </button>
    </div>
  </div>
</div>
```

### Loading Spinner
```jsx
<div className="flex items-center justify-center h-screen">
  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
</div>
```

### Empty State
```jsx
<div className="text-center py-12">
  <p className="text-gray-500 text-lg mb-4">📚 No resources found</p>
  <p className="text-gray-400 mb-6">Try adjusting your filters or search terms</p>
  <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
    Browse All Resources
  </button>
</div>
```

---

## Accessibility Patterns

### Focus Management
```jsx
/* Visible focus indicator for keyboard users */
<button className="px-4 py-2 bg-blue-500 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2">
  Keyboard Accessible
</button>
```

### Color Contrast
```jsx
/* ✅ Good: 4.5:1 contrast ratio (WCAG AA) */
<p className="text-gray-700 bg-white">Readable</p>

/* ❌ Avoid: Low contrast */
<p className="text-gray-300 bg-white">Hard to read</p>
```

### Skip Link
```jsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
<main id="main-content">
  {/* Page content */}
</main>
```

### Semantic HTML + ARIA
```jsx
/* ✅ Use semantic elements */
<nav>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>

/* Add ARIA labels for clarity */
<button aria-label="Close menu" onClick={closeMenu}>✕</button>
<div role="alert" aria-live="polite">
  {errorMessage}
</div>
```

---

## Custom CSS Rules

Use custom CSS (in `index.css`) only when Tailwind utilities are insufficient:

```css
/* ✅ Good: Scoped, specific styling */
.gradient-text {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.slide-in-animation {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ❌ Avoid: Generic global styles */
* {
  margin: 0;
  padding: 0;
}

/* ❌ Avoid: Duplicating Tailwind utilities */
.button {
  padding: 8px 16px;
  background-color: #3b82f6;
}
```

---

## Common Styling Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Centering content | Use `flex items-center justify-center` on parent |
| Responsive images | Use `w-full h-auto` + set max-width on parent |
| Text overflow | Use `truncate` for single line, `line-clamp-3` for multi-line |
| Dark mode hover states | Use `hover:opacity-80` instead of changing colors |
| Fixed positioning issues | Use `z-10` or higher; ensure parent is `position: relative` |
| Sticky header overlap | Add `scroll-mt-20` to heading targets if header is `sticky top-0` |

---

## Responsive Debugging Tips

1. **Use browser DevTools**: Press F12, toggle device toolbar (Ctrl+Shift+M)
2. **Test real devices**: Emulation ≠ real device performance
3. **Check breakpoints**: Resize browser and verify each breakpoint works
4. **Inspect Tailwind**: Use Tailwind's IntelliSense in VS Code
5. **Build & preview**: Run `npm run build` and `npm run preview` before deploying

---

## Performance & File Size

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Custom colors only if needed
      },
      fontSize: {
        // Custom font sizes only if needed
      },
    },
  },
  plugins: [],
};
```

**Key**: The `content` array tells Tailwind which files to scan for class names. Unused utilities are purged at build time.

### Custom CSS Impact

```css
/* ✅ Minimal impact: Targeted animations */
.fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ❌ Bloat: Reset everything */
* { margin: 0; padding: 0; ... }
```

---

## Design System Extension

To add custom design tokens:

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        'edusphere-primary': '#3b82f6',
        'edusphere-accent': '#8b5cf6',
      },
      spacing: {
        'card-gap': '1.5rem',
      },
      borderRadius: {
        'card': '0.75rem',
      },
    },
  },
};
```

Then use in JSX:
```jsx
<div className="bg-edusphere-primary rounded-card p-card-gap">
  {content}
</div>
```

---

**Link to Main Guide**: [EduSphere Development Guide](.github/copilot-instructions.md)  
**Related Agents**: [Component Creator](.github/agents/component-creator.md)  
**Tailwind Docs**: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)

*Last Updated: April 2026*
