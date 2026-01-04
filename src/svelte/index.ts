/**
 * Svelte bindings for @capgo/transitions
 */

import type { TransitionController } from '../core/transition-controller';
import { createTransitionController } from '../core/transition-controller';
import type { TransitionGlobalConfig, TransitionDirection, NavigationEvent } from '../core/types';

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
}

/**
 * Helper for Svelte actions - use on cap-router-outlet
 */
interface SvelteActionReturn<T> {
  update?: (newOptions: T) => void;
  destroy?: () => void;
}

interface RouterOutletOptions {
  keepInDom?: boolean;
  maxCached?: number;
  platform?: 'ios' | 'android' | 'auto';
  duration?: number;
}

export function routerOutlet(
  node: HTMLElement,
  options: RouterOutletOptions = {},
): SvelteActionReturn<RouterOutletOptions> {
  const { keepInDom = true, maxCached = 10, platform = 'auto', duration } = options;

  node.setAttribute('platform', platform);
  if (duration) node.setAttribute('duration', String(duration));
  node.setAttribute('keep-in-dom', String(keepInDom));
  node.setAttribute('max-cached', String(maxCached));

  return {
    update(newOptions: RouterOutletOptions): void {
      if (newOptions.platform) node.setAttribute('platform', newOptions.platform);
      if (newOptions.duration) node.setAttribute('duration', String(newOptions.duration));
      if (newOptions.keepInDom !== undefined) {
        node.setAttribute('keep-in-dom', String(newOptions.keepInDom));
      }
      if (newOptions.maxCached !== undefined) {
        node.setAttribute('max-cached', String(newOptions.maxCached));
      }
    },
    destroy(): void {
      // Cleanup if needed
    },
  };
}

interface PageCallbacks {
  onWillEnter?: (event: NavigationEvent) => void;
  onDidEnter?: (event: NavigationEvent) => void;
  onWillLeave?: (event: NavigationEvent) => void;
  onDidLeave?: (event: NavigationEvent) => void;
}

/**
 * Helper for Svelte actions - use on cap-page
 */
export function page(node: HTMLElement, callbacks?: PageCallbacks): SvelteActionReturn<PageCallbacks> {
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

  node.addEventListener('cap-will-enter', handleWillEnter);
  node.addEventListener('cap-did-enter', handleDidEnter);
  node.addEventListener('cap-will-leave', handleWillLeave);
  node.addEventListener('cap-did-leave', handleDidLeave);

  return {
    update(newCallbacks: PageCallbacks): void {
      callbacks = newCallbacks;
    },
    destroy(): void {
      node.removeEventListener('cap-will-enter', handleWillEnter);
      node.removeEventListener('cap-did-enter', handleDidEnter);
      node.removeEventListener('cap-will-leave', handleWillLeave);
      node.removeEventListener('cap-did-leave', handleDidLeave);
    },
  };
}

/**
 * Helper for navigation with transitions
 */
export function navigateWithTransition(
  navigate: (to: string) => void,
  to: string,
  direction: TransitionDirection = 'forward',
): void {
  setDirection(direction);
  navigate(to);
}

/**
 * Create a transition-aware navigate function
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
export type { TransitionGlobalConfig, TransitionDirection, NavigationEvent } from '../core/types';

// Export controller class for advanced usage
export { TransitionController } from '../core/transition-controller';
