/**
 * @capgo/transitions
 * Framework-agnostic page transitions for Capacitor apps
 *
 * Features:
 * - iOS and Android style transitions
 * - Works with any framework (React, Vue, Angular, Svelte, Solid, etc.)
 * - Uses Web Animations API for smooth, GPU-accelerated transitions
 * - Supports View Transitions API as progressive enhancement
 * - No styling opinions - just transition logic
 * - Coordinates header, content, and footer animations
 */

// Core exports
import type { CapRouterOutlet, CapPage, CapHeader, CapContent, CapFooter } from './components';

export type {
  TransitionDirection,
  TransitionPlatform,
  ResolvedPlatform,
  TransitionTarget,
  TransitionEasing,
  TransitionConfig,
  TransitionGlobalConfig,
  PageState,
  NavigationEvent,
  TransitionLifecycle,
  AnimationBuilder,
  TransitionAnimationOptions,
  TransitionResult,
  RouterOutletOptions,
  PageOptions,
} from './core/types';

// Animation system
export {
  IOS_EASING,
  ANDROID_EASING,
  IOS_DURATION,
  ANDROID_DURATION,
  resolveEasing,
  detectPlatform,
  getDefaultDuration,
  getDefaultEasing,
  createIOSTransition,
  createAndroidTransition,
  createNoneTransition,
  createTransition,
  waitForAnimations,
  cancelAnimations,
  createHeaderTransition,
  createFooterTransition,
} from './core/animations';

// View Transitions API
export {
  supportsViewTransitions,
  runViewTransition,
  setViewTransitionName,
  clearViewTransitionName,
  VIEW_TRANSITIONS_CSS,
  injectViewTransitionsCSS,
} from './core/view-transitions';

// Transition controller
export {
  TransitionController,
  getTransitionController,
  createTransitionController,
} from './core/transition-controller';

// Web Components
export { CapRouterOutlet, CapPage, CapHeader, CapContent, CapFooter } from './components';

// Utility to initialize all components
export function initCapTransitions(): void {
  // Import components to trigger registration
  import('./components');
}

// Type declarations for custom elements
declare global {
  interface HTMLElementTagNameMap {
    'cap-router-outlet': CapRouterOutlet;
    'cap-page': CapPage;
    'cap-header': CapHeader;
    'cap-content': CapContent;
    'cap-footer': CapFooter;
  }
}
