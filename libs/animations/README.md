# Animations

This folder contains reusable animation components that can be imported and used across the application.

## Structure

```
animations/
├── README.md
├── index.js                 # Main export file
├── ParticleBackground.js    # Particle animation component
└── ParticleBackground.css   # Styles for particle animation
```

## Usage

### Importing Animations

```javascript
import { ParticleBackground } from '../animations';
```

### Using ParticleBackground

The `ParticleBackground` component creates an animated particle system that can be used as a background for any page or component.

```javascript
import React from 'react';
import { ParticleBackground } from '../animations';

function MyPage() {
  return (
    <div className="my-page">
      <ParticleBackground />
      {/* Your page content */}
    </div>
  );
}
```

## Available Animations

### ParticleBackground
- **Purpose**: Creates an animated particle system with connecting lines
- **Props**: None (self-contained)
- **Features**:
  - Responsive canvas that adapts to window size
  - 100 animated particles with physics
  - Dynamic connections between nearby particles
  - Purple/blue color scheme
  - Dark mode support
  - Fixed positioning with z-index management

## Adding New Animations

To add a new animation component:

1. Create the component file (e.g., `FadeIn.js`)
2. Create the corresponding CSS file (e.g., `FadeIn.css`)
3. Export it from `index.js`
4. Update this README with documentation

### Example Structure for New Animation

```javascript
// FadeIn.js
import React from 'react';
import './FadeIn.css';

function FadeIn({ children, delay = 0 }) {
  return (
    <div className="fade-in" style={{ animationDelay: delay }}>
      {children}
    </div>
  );
}

export default FadeIn;
```

```css
/* FadeIn.css */
.fade-in {
  opacity: 0;
  animation: fadeIn 0.6s ease-out forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}
```

## Best Practices

1. **Keep animations lightweight** - Avoid heavy computations in animation loops
2. **Use CSS animations when possible** - They're more performant than JavaScript animations
3. **Provide fallbacks** - Ensure content is accessible even if animations fail
4. **Consider user preferences** - Respect `prefers-reduced-motion` media query
5. **Test on mobile** - Ensure animations work well on all devices

## Performance Tips

- Use `requestAnimationFrame` for smooth JavaScript animations
- Clean up event listeners and animation frames in useEffect cleanup
- Use `transform` and `opacity` for CSS animations (they're GPU-accelerated)
- Limit the number of animated elements on screen at once 