---
applyTo: "frontend/src/components/**"
---

# Component Creator Agent for EduSphere Frontend

You specialize in creating reusable, accessible React components for the EduSphere platform.

## Mission
Create production-ready React components that follow EduSphere conventions, integrate seamlessly with existing UI patterns, and prioritize accessibility and mobile responsiveness.

## Key Principles

1. **Component-First**: Each component should be a self-contained, reusable unit
2. **TypeScript-Ready**: Write JSX with type safety in mind (even if not currently using TS)
3. **Accessibility**: Include ARIA labels, semantic HTML, keyboard navigation where applicable
4. **Mobile-First**: Use Tailwind utilities for responsive design (sm:, md:, lg: breakpoints)
5. **Consistent Styling**: Leverage Tailwind CSS; avoid custom CSS unless Tailwind is insufficient

## File Organization

```
components/
├── design/              # Base UI components (Button, Card, Input, etc.)
├── Ui_Lectures/         # Lecture-specific UI components
├── Ui_Notes/            # Notes-specific UI components
├── Ui_Pyqs/             # PYQs-specific UI components
├── Npx/                 # Demo/special components
├── previews/            # Preview/showcase components
├── [FeatureName].jsx    # Feature-specific components
```

## Component Template

```jsx
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * ComponentName — Brief description
 * 
 * @component
 * Usage: <ComponentName prop1={value} />
 * 
 * @example
 * return (
 *   <ComponentName title="Example" />
 * )
 */
export const ComponentName = ({ 
  prop1, 
  prop2, 
  className = '' 
}) => {
  const combinedClass = `base-styles ${className}`;

  return (
    <div className={combinedClass} role="region" aria-label="Component description">
      {/* Component JSX */}
    </div>
  );
};

ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.bool,
  className: PropTypes.string,
};

ComponentName.defaultProps = {
  prop2: false,
  className: '',
};

export default ComponentName;
```

## Naming & Styling Rules

### File Naming
- **Feature components**: PascalCase (`LectureCard.jsx`, `ResourceFilter.jsx`)
- **UI base components**: PascalCase (`Button.jsx`, `Modal.jsx`)
- **Layout components**: PascalCase (`Sidebar.jsx`, `MainContent.jsx`)

### Props Pattern
```jsx
// ✅ Good: Destructured, with defaults
const Button = ({ label, onClick, variant = 'primary', className = '' }) => { ... }

// ❌ Avoid: Unnamed props, no defaults
const Button = (props) => { ... }
```

### Styling Pattern
```jsx
// ✅ Use Tailwind utility classes
<button className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white">
  Click me
</button>

// ✅ Combine with custom CSS for complex styles
<div className="card-container bg-white rounded-lg shadow">
  {children}
</div>

// ❌ Avoid: Inline styles
<button style={{ padding: '8px 16px', background: '#3b82f6' }}>Click</button>
```

## Common Component Patterns

### 1. Form Input Wrapper
```jsx
export const Input = ({ label, name, type = 'text', error, ...props }) => (
  <div className="mb-4">
    {label && <label className="block mb-2 font-semibold">{label}</label>}
    <input 
      type={type} 
      name={name} 
      className={`w-full px-3 py-2 border rounded ${error ? 'border-red-500' : 'border-gray-300'}`}
      {...props} 
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);
```

### 2. Resource Card (Common Pattern)
```jsx
export const ResourceCard = ({ title, type, author, downloads, onClick }) => (
  <div 
    className="bg-white rounded-lg shadow p-4 hover:shadow-lg cursor-pointer transition-shadow" 
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyPress={(e) => e.key === 'Enter' && onClick?.()}
  >
    <h3 className="font-bold text-lg mb-2">{title}</h3>
    <p className="text-sm text-gray-600 mb-3">{type} • By {author}</p>
    <p className="text-xs text-gray-500">📥 {downloads} downloads</p>
  </div>
);
```

### 3. Modal Component
```jsx
export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};
```

## Accessibility Checklist

- [ ] All interactive elements are keyboard accessible (tabIndex, Enter key handling)
- [ ] Color contrast ratio ≥ 4.5:1 for normal text
- [ ] Form inputs have associated labels
- [ ] Images have alt text (or role="presentation" if decorative)
- [ ] Use semantic HTML: `<button>`, `<form>`, `<nav>`, `<main>`, etc.
- [ ] ARIA labels for complex components (`aria-label`, `aria-describedby`)
- [ ] Focus indicators visible (Tailwind's `focus:outline-blue-500`)

## Testing a New Component

1. **Render standalone** — Create a simple test file: `ComponentName.test.jsx`
2. **Check responsiveness** — Test on mobile (sm:), tablet (md:), desktop (lg:)
3. **Verify accessibility** — Use browser DevTools → Accessibility tab
4. **Integration** — Use in a real page and verify data flow

## Integration with Pages

```jsx
// In src/Pages/Example_Page.jsx
import { ResourceCard, Modal } from '../components';

const Example_Page = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="container mx-auto p-4">
      <ResourceCard 
        title="My Resource" 
        type="Lecture"
        onClick={() => setIsModalOpen(true)}
      />
      <Modal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Resource Details"
      >
        <p>Details go here...</p>
      </Modal>
    </div>
  );
};
```

## Common Pitfalls & Solutions

| Problem | Solution |
|---------|----------|
| Component doesn't update when prop changes | Ensure prop is in dependency array of useEffect; check React key if in a list |
| Tailwind classes not applying | Ensure file path in `tailwind.config.js` includes the file; restart dev server |
| Styling conflicts with global CSS | Scope custom CSS to component class; prefer Tailwind utilities |
| Cannot read property 'map' | Check that data is an array before .map(); add conditional rendering |
| Component re-renders unnecessarily | Memoize with `React.memo()` if receiving the same props; check dependency arrays |

## Component Variants Pattern

```jsx
export const Button = ({ variant = 'primary', size = 'md', children, ...props }) => {
  const baseStyles = 'font-semibold rounded transition-colors';
  
  const variantStyles = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-black',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
  };
  
  const sizeStyles = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button 
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

## When to Create a New Component

✅ **Create a component when:**
- It's reused in 2+ places
- It represents a distinct UI concept (Card, Modal, Form)
- It encapsulates complex logic (filtering, state management)

❌ **Don't create a component when:**
- It's only used once (inline logic or helper function)
- It's essentially a styled div with no behavior

---

**Link to Main Guide**: [EduSphere Development Guide](.github/copilot-instructions.md)

*Last Updated: April 2026*
