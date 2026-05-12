/**
 * React bindings for @capgo/capacitor-transitions
 * Helper functions for using web components in React
 */

import { getDefaultNavigationDirection, setOutletDirectionIntent, setOutletNavigationIntent } from '../core/navigation';
import type { TransitionController } from '../core/transition-controller';
import { createTransitionController } from '../core/transition-controller';
import type {
  TransitionGlobalConfig,
  TransitionDirection,
  NavigationEvent,
  SwipeGestureOption,
  NavigationAction,
} from '../core/types';

// Ensure web components are registered
import '../components';

/** Store for transition controller */
let globalController: TransitionController | null = null;
let globalDirection: TransitionDirection = 'forward';

/**
 * Initialize the transition system
 */
export function initTransitions(config: TransitionGlobalConfig = {}): TransitionController {
  globalController = createTransitionController(config);
  return globalController;
}

/**
 * Get the global transition controller
 */
export function getController(): TransitionController {
  if (!globalController) {
    globalController = createTransitionController();
  }
  return globalController;
}

/**
 * Get/set the current transition direction
 */
export function getDirection(): TransitionDirection {
  return globalDirection;
}

export function setDirection(direction: TransitionDirection): void {
  globalDirection = direction;

  if (typeof document !== 'undefined') {
    for (const outlet of document.querySelectorAll('cap-router-outlet')) {
      setOutletDirectionIntent(outlet, direction);
    }
  }
}

/**
 * Set the navigation action and animation direction for the next router navigation.
 */
export function setNavigation(
  action: NavigationAction,
  direction: TransitionDirection = getDefaultNavigationDirection(action),
): void {
  globalDirection = direction;

  if (typeof document !== 'undefined') {
    for (const outlet of document.querySelectorAll('cap-router-outlet')) {
      setOutletNavigationIntent(outlet, action, direction);
    }
  }
}

/**
 * Set up a router outlet element
 * Call this in useEffect with a ref to the cap-router-outlet element
 */
export function setupRouterOutlet(
  element: HTMLElement,
  options: {
    keepInDom?: boolean;
    maxCached?: number;
    platform?: 'ios' | 'android' | 'auto';
    duration?: number;
    swipeGesture?: SwipeGestureOption;
  } = {},
): void {
  const { keepInDom = true, maxCached = 10, platform = 'auto', duration, swipeGesture } = options;

  element.setAttribute('platform', platform);
  if (duration !== undefined) element.setAttribute('duration', String(duration));
  element.setAttribute('keep-in-dom', String(keepInDom));
  element.setAttribute('max-cached', String(maxCached));
  if (swipeGesture !== undefined) element.setAttribute('swipe-gesture', String(swipeGesture));
}

/**
 * Set up a page element with lifecycle callbacks
 * Call this in useEffect with a ref to the cap-page element
 * Returns a cleanup function to call in the effect cleanup
 *
 * @example
 * ```tsx
 * function MyPage() {
 *   const pageRef = useRef<HTMLElement>(null)
 *
 *   useEffect(() => {
 *     if (pageRef.current) {
 *       return setupPage(pageRef.current, {
 *         onDidEnter: () => console.log('entered'),
 *         onDidLeave: () => console.log('left'),
 *       })
 *     }
 *   }, [])
 *
 *   return <cap-page ref={pageRef}>...</cap-page>
 * }
 * ```
 */
export function setupPage(
  element: HTMLElement,
  callbacks?: {
    onWillEnter?: (event: NavigationEvent) => void;
    onDidEnter?: (event: NavigationEvent) => void;
    onWillLeave?: (event: NavigationEvent) => void;
    onDidLeave?: (event: NavigationEvent) => void;
  },
): () => void {
  const handleWillEnter = (e: Event) => {
    callbacks?.onWillEnter?.((e as CustomEvent).detail);
  };
  const handleDidEnter = (e: Event) => {
    callbacks?.onDidEnter?.((e as CustomEvent).detail);
  };
  const handleWillLeave = (e: Event) => {
    callbacks?.onWillLeave?.((e as CustomEvent).detail);
  };
  const handleDidLeave = (e: Event) => {
    callbacks?.onDidLeave?.((e as CustomEvent).detail);
  };

  element.addEventListener('cap-will-enter', handleWillEnter);
  element.addEventListener('cap-did-enter', handleDidEnter);
  element.addEventListener('cap-will-leave', handleWillLeave);
  element.addEventListener('cap-did-leave', handleDidLeave);

  // Return cleanup function
  return () => {
    element.removeEventListener('cap-will-enter', handleWillEnter);
    element.removeEventListener('cap-did-enter', handleDidEnter);
    element.removeEventListener('cap-will-leave', handleWillLeave);
    element.removeEventListener('cap-did-leave', handleDidLeave);
  };
}

/**
 * Create a transition-aware navigate function
 * Wraps your router's navigate function to set the direction before navigating
 *
 * @example
 * ```tsx
 * const navigate = useNavigate()
 * const transitionNavigate = createTransitionNavigate(navigate)
 *
 * // Forward navigation
 * transitionNavigate('/details/1')
 *
 * // Back navigation
 * transitionNavigate('/', 'back')
 * ```
 */
export function createTransitionNavigate(
  navigate: (to: string) => void,
): (to: string, direction?: TransitionDirection) => void {
  return (to: string, direction: TransitionDirection = 'forward') => {
    setDirection(direction);
    navigate(to);
  };
}

// Re-export types
export type {
  TransitionGlobalConfig,
  TransitionDirection,
  NavigationEvent,
  SwipeGestureOption,
  NavigationAction,
} from '../core/types';

// Export controller for advanced usage
export { TransitionController } from '../core/transition-controller';

type CapElementAttributes = {
  key?: unknown;
  ref?: unknown;
  children?: unknown;
  id?: string;
  class?: string;
  className?: string;
  style?: unknown;
  slot?: string;
  role?: string;
  part?: string;
  title?: string;
  tabIndex?: number;
  [attribute: `data-${string}`]: unknown;
  [attribute: `aria-${string}`]: unknown;
  [eventHandler: `on${string}`]: unknown;
};

type Booleanish = boolean | 'true' | 'false';

interface CapTransitionsIntrinsicElements {
  'cap-router-outlet': CapElementAttributes & {
    platform?: 'ios' | 'android' | 'auto';
    duration?: number | string;
    'keep-in-dom'?: Booleanish;
    'max-cached'?: number | string;
    'swipe-gesture'?: boolean | 'true' | 'false' | 'auto';
    'data-direction'?: 'forward' | 'back' | 'root' | 'none';
    'data-navigation-action'?: 'forward' | 'back' | 'root' | 'none';
  };
  'cap-page': CapElementAttributes & {
    'cache-scroll'?: Booleanish;
    'data-direction'?: 'forward' | 'back' | 'root' | 'none';
    'data-navigation-action'?: 'forward' | 'back' | 'root' | 'none';
  };
  'cap-header': CapElementAttributes & {
    translucent?: Booleanish;
    collapse?: string;
  };
  'cap-content': CapElementAttributes & {
    fullscreen?: Booleanish;
    'scroll-x'?: Booleanish;
    'scroll-y'?: Booleanish;
  };
  'cap-footer': CapElementAttributes & {
    translucent?: Booleanish;
  };
}

// Type declarations for custom elements in React/JSX.
// Keep both global JSX and scoped React JSX declarations so React 18 and 19
// projects recognize the elements after importing this package subpath.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'cap-router-outlet': CapTransitionsIntrinsicElements['cap-router-outlet'];
      'cap-page': CapTransitionsIntrinsicElements['cap-page'];
      'cap-header': CapTransitionsIntrinsicElements['cap-header'];
      'cap-content': CapTransitionsIntrinsicElements['cap-content'];
      'cap-footer': CapTransitionsIntrinsicElements['cap-footer'];
    }
  }
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'cap-router-outlet': CapTransitionsIntrinsicElements['cap-router-outlet'];
      'cap-page': CapTransitionsIntrinsicElements['cap-page'];
      'cap-header': CapTransitionsIntrinsicElements['cap-header'];
      'cap-content': CapTransitionsIntrinsicElements['cap-content'];
      'cap-footer': CapTransitionsIntrinsicElements['cap-footer'];
    }
  }
}

declare module 'react/jsx-runtime' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'cap-router-outlet': CapTransitionsIntrinsicElements['cap-router-outlet'];
      'cap-page': CapTransitionsIntrinsicElements['cap-page'];
      'cap-header': CapTransitionsIntrinsicElements['cap-header'];
      'cap-content': CapTransitionsIntrinsicElements['cap-content'];
      'cap-footer': CapTransitionsIntrinsicElements['cap-footer'];
    }
  }
}
