# @capgo/transitions

Framework-agnostic page transitions for Capacitor apps. iOS-style navigation without opinions.

## Features

- **Framework Agnostic** - Works with React, Vue, Angular, Svelte, Solid, and any other framework
- **iOS & Android Animations** - Platform-appropriate transitions out of the box
- **Web Animations API** - Smooth, GPU-accelerated animations
- **View Transitions API** - Progressive enhancement for supporting browsers
- **No Design Opinions** - Just transition logic, you bring your own styles
- **Coordinated Transitions** - Header, content, and footer animate together
- **Page Caching** - Keep pages in DOM for instant back navigation
- **Lifecycle Hooks** - willEnter, didEnter, willLeave, didLeave events

## Installation

```bash
npm install @capgo/transitions
```

## Quick Start

### Vanilla JavaScript / Web Components

```html
<cap-router-outlet platform="auto">
  <cap-page>
    <cap-header slot="header">
      <h1>My Page</h1>
    </cap-header>
    <cap-content slot="content">
      <p>Page content here</p>
    </cap-content>
    <cap-footer slot="footer">
      <nav>Tab bar</nav>
    </cap-footer>
  </cap-page>
</cap-router-outlet>
```

```javascript
import '@capgo/transitions';

// Navigate programmatically
const outlet = document.querySelector('cap-router-outlet');
outlet.push(newPageElement);
outlet.pop();
outlet.setRoot(newRootElement);
```

### React

```tsx
import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initTransitions, setDirection, setupPage, setupRouterOutlet } from '@capgo/transitions/react';
import '@capgo/transitions';

// Initialize once at app startup
initTransitions({ platform: 'auto' });

function App() {
  const outletRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (outletRef.current) {
      setupRouterOutlet(outletRef.current, { platform: 'auto' });
    }
  }, []);

  return (
    <cap-router-outlet ref={outletRef}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/details/:id" element={<DetailsPage />} />
      </Routes>
    </cap-router-outlet>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (pageRef.current) {
      return setupPage(pageRef.current, {
        onDidEnter: () => console.log('entered'),
      });
    }
  }, []);

  const goToDetails = (id: number) => {
    setDirection('forward');
    navigate(`/details/${id}`);
  };

  return (
    <cap-page ref={pageRef}>
      <cap-header slot="header">
        <h1>Home</h1>
      </cap-header>
      <cap-content slot="content">
        <button onClick={() => goToDetails(1)}>Go to Details</button>
      </cap-content>
      <cap-footer slot="footer">
        <nav>Tab bar</nav>
      </cap-footer>
    </cap-page>
  );
}
```

### Vue

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { initTransitions, setDirection, setupPage, setupRouterOutlet } from '@capgo/transitions/vue';
import '@capgo/transitions';

// Initialize once
initTransitions({ platform: 'auto' });

const router = useRouter();
const outletRef = ref(null);
const pageRef = ref(null);
let cleanup;

onMounted(() => {
  if (outletRef.value) {
    setupRouterOutlet(outletRef.value, { platform: 'auto' });
  }
  if (pageRef.value) {
    cleanup = setupPage(pageRef.value, {
      onDidEnter: () => console.log('entered'),
    });
  }
});

onUnmounted(() => cleanup?.());

const goToDetails = (id) => {
  setDirection('forward');
  router.push(`/details/${id}`);
};
</script>

<template>
  <cap-router-outlet ref="outletRef">
    <cap-page ref="pageRef">
      <cap-header slot="header">
        <h1>Home</h1>
      </cap-header>
      <cap-content slot="content">
        <button @click="goToDetails(1)">Go to Details</button>
      </cap-content>
    </cap-page>
  </cap-router-outlet>
</template>
```

### Svelte

```svelte
<script>
  import { routerOutlet, page, setDirection } from '@capgo/transitions/svelte'
  import '@capgo/transitions'

  function navigate(to, direction = 'forward') {
    setDirection(direction)
    // Use your router's navigate function
  }
</script>

<cap-router-outlet use:routerOutlet>
  <cap-page use:page={{ onDidEnter: () => console.log('entered') }}>
    <cap-header slot="header">
      <h1>Home</h1>
    </cap-header>
    <cap-content slot="content">
      <button on:click={() => navigate('/details/1')}>Go to Details</button>
    </cap-content>
  </cap-page>
</cap-router-outlet>
```

### Solid

```tsx
import { onMount, onCleanup } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { initTransitions, setDirection, setupPage, setupRouterOutlet } from '@capgo/transitions/solid';
import '@capgo/transitions';

// Initialize once
initTransitions({ platform: 'auto' });

function HomePage() {
  const navigate = useNavigate();
  let pageRef;

  onMount(() => {
    if (pageRef) {
      const cleanup = setupPage(pageRef, {
        onDidEnter: () => console.log('entered'),
      });
      onCleanup(cleanup);
    }
  });

  const goToDetails = (id) => {
    setDirection('forward');
    navigate(`/details/${id}`);
  };

  return (
    <cap-page ref={pageRef}>
      <cap-header slot="header">
        <h1>Home</h1>
      </cap-header>
      <cap-content slot="content">
        <button onClick={() => goToDetails(1)}>Go to Details</button>
      </cap-content>
    </cap-page>
  );
}
```

### Angular

```typescript
// app.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import '@capgo/transitions';

@Component({
  selector: 'app-root',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <cap-router-outlet #outlet platform="auto">
      <router-outlet></router-outlet>
    </cap-router-outlet>
  `,
})
export class AppComponent {}

// home.component.ts
@Component({
  selector: 'app-home',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <cap-page>
      <cap-header slot="header">
        <h1>Home</h1>
      </cap-header>
      <cap-content slot="content">
        <button (click)="goToDetails(1)">Go to Details</button>
      </cap-content>
    </cap-page>
  `,
})
export class HomeComponent {
  constructor(private router: Router) {}

  goToDetails(id: number) {
    this.router.navigate(['/details', id]);
  }
}
```

## API Reference

### Components

#### `<cap-router-outlet>`

Container for page transitions.

| Attribute     | Type                           | Default          | Description                             |
| ------------- | ------------------------------ | ---------------- | --------------------------------------- |
| `platform`    | `'ios' \| 'android' \| 'auto'` | `'auto'`         | Animation style                         |
| `duration`    | `number`                       | Platform default | Animation duration in ms                |
| `keep-in-dom` | `boolean`                      | `true`           | Keep pages in DOM after navigating away |
| `max-cached`  | `number`                       | `10`             | Maximum pages to keep cached            |

Methods:

- `push(element, config?)` - Navigate forward to new page
- `pop(config?)` - Navigate back
- `setRoot(element, config?)` - Replace navigation stack

#### `<cap-page>`

Page container with header/content/footer slots.

Events:

- `cap-will-enter` - Before page becomes visible
- `cap-did-enter` - After page becomes visible
- `cap-will-leave` - Before page leaves
- `cap-did-leave` - After page leaves

#### `<cap-header>`

Header container. Use with `slot="header"` inside `<cap-page>`.

#### `<cap-content>`

Main scrollable content area. Use with `slot="content"`.

| Attribute    | Type      | Default | Description                   |
| ------------ | --------- | ------- | ----------------------------- |
| `fullscreen` | `boolean` | `false` | Content scrolls behind header |
| `scroll-x`   | `boolean` | `true`  | Enable horizontal scroll      |
| `scroll-y`   | `boolean` | `true`  | Enable vertical scroll        |

#### `<cap-footer>`

Footer container. Use with `slot="footer"`.

### Transition Directions

| Direction   | Description                            |
| ----------- | -------------------------------------- |
| `'forward'` | Push animation (iOS: slide from right) |
| `'back'`    | Pop animation (iOS: slide to right)    |
| `'root'`    | Replace animation (fade)               |
| `'none'`    | No animation                           |

### Helper Functions

All framework bindings export these helper functions:

```typescript
// Initialize the transition system
initTransitions({ platform: 'auto' });

// Set the direction for the next navigation
setDirection('forward' | 'back' | 'root' | 'none');

// Set up a router outlet element
setupRouterOutlet(element, options);

// Set up a page element with lifecycle callbacks (returns cleanup function)
setupPage(element, { onWillEnter, onDidEnter, onWillLeave, onDidLeave });

// Create a transition-aware navigate function
const transitionNavigate = createTransitionNavigate(navigate);
transitionNavigate('/path', 'forward');
```

### TransitionController

For advanced programmatic control:

```typescript
import { createTransitionController } from '@capgo/transitions';

const controller = createTransitionController({
  platform: 'auto',
  duration: 400,
  useViewTransitions: true,
});

// Navigate
await controller.push(element, { direction: 'forward' });
await controller.pop({ direction: 'back' });
await controller.setRoot(element, { direction: 'root' });

// Lifecycle hooks
controller.registerLifecycle('page-id', {
  onWillEnter: (event) => console.log('Will enter', event),
  onDidEnter: (event) => console.log('Did enter', event),
  onWillLeave: (event) => console.log('Will leave', event),
  onDidLeave: (event) => console.log('Did leave', event),
});
```

## Browser Support

- Modern browsers with Web Animations API support
- View Transitions API (Chrome 111+, Edge 111+, Safari 18+) for enhanced transitions
- Graceful fallback for older browsers

## Design Philosophy

This library is intentionally unopinionated about styling:

1. **No CSS included** - You bring your own styles
2. **No design system** - Works with any UI library or custom styles
3. **Just transitions** - Focus on smooth page navigation
4. **Framework agnostic** - Use with React, Vue, Angular, Svelte, Solid, or vanilla JS

The goal is to provide Ionic-quality page transitions without Ionic's design system or framework lock-in.

## Examples

See the `/examples` directory for complete examples:

- `react-app` - React with React Router
- `vue-app` - Vue 3 with Vue Router
- `angular-app` - Angular with Angular Router
- `svelte-app` - Svelte 5
- `solid-app` - Solid with Solid Router
- `tanstack-app` - React with TanStack Router

## License

MIT
