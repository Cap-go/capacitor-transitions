/**
 * Core types for @capgo/transitions
 * Framework-agnostic page transitions for Capacitor apps
 */

/** Direction of the navigation transition */
export type TransitionDirection = 'forward' | 'back' | 'root' | 'none';

/** Platform-specific animation styles */
export type TransitionPlatform = 'ios' | 'android' | 'auto';

/** Which parts of the page to animate */
export type TransitionTarget = 'header' | 'content' | 'footer' | 'all';

/** Animation easing presets */
export type TransitionEasing =
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'ios' // cubic-bezier(0.32, 0.72, 0, 1)
  | 'android' // cubic-bezier(0.4, 0, 0.2, 1)
  | string; // Custom cubic-bezier

/** Configuration for a single transition animation */
export interface TransitionConfig {
  /** Duration in milliseconds (default: 540 for iOS, 300 for Android) */
  duration?: number;
  /** Easing function (default: 'ios' or 'android' based on platform) */
  easing?: TransitionEasing;
  /** Direction of transition */
  direction?: TransitionDirection;
  /** Which elements to animate (default: 'all') */
  targets?: TransitionTarget[];
  /** Custom animation keyframes for entering element */
  enterKeyframes?: Keyframe[];
  /** Custom animation keyframes for leaving element */
  leaveKeyframes?: Keyframe[];
  /** Callback before animation starts */
  onStart?: () => void;
  /** Callback after animation completes */
  onComplete?: () => void;
  /** Whether to use View Transitions API when available (default: true) */
  useViewTransitions?: boolean;
}

/** Resolved platform type (excludes 'auto') */
export type ResolvedPlatform = 'ios' | 'android';

/** Global configuration for the transition system */
export interface TransitionGlobalConfig {
  /** Default platform style (default: 'auto') */
  platform?: TransitionPlatform;
  /** Default duration in ms */
  duration?: number;
  /** Default easing */
  easing?: TransitionEasing;
  /** Whether to use View Transitions API (default: true) */
  useViewTransitions?: boolean;
  /** Custom platform detection function */
  detectPlatform?: () => ResolvedPlatform;
}

/** State of a page in the navigation stack */
export interface PageState {
  /** Unique identifier for the page */
  id: string;
  /** The page element */
  element: HTMLElement;
  /** Header element if present */
  header?: HTMLElement;
  /** Content element if present */
  content?: HTMLElement;
  /** Footer element if present */
  footer?: HTMLElement;
  /** Whether this page is currently visible */
  isActive: boolean;
  /** Scroll position to restore */
  scrollPosition?: { x: number; y: number };
  /** Any custom data attached to this page */
  data?: Record<string, unknown>;
}

/** Navigation event details */
export interface NavigationEvent {
  /** Direction of navigation */
  direction: TransitionDirection;
  /** Page being navigated from */
  from?: PageState;
  /** Page being navigated to */
  to: PageState;
  /** Whether animation should be skipped */
  skipAnimation?: boolean;
}

/** Lifecycle hooks for page transitions */
export interface TransitionLifecycle {
  /** Called before the page becomes visible (before animation) */
  onWillEnter?: (event: NavigationEvent) => void | Promise<void>;
  /** Called after the page becomes visible (after animation) */
  onDidEnter?: (event: NavigationEvent) => void | Promise<void>;
  /** Called before the page leaves (before animation) */
  onWillLeave?: (event: NavigationEvent) => void | Promise<void>;
  /** Called after the page leaves (after animation) */
  onDidLeave?: (event: NavigationEvent) => void | Promise<void>;
}

/** Animation builder function signature (similar to Ionic) */
export type AnimationBuilder = (
  baseElement: HTMLElement,
  options: TransitionAnimationOptions,
) => Animation | Animation[];

/** Options passed to animation builders */
export interface TransitionAnimationOptions {
  /** Element entering the view */
  enteringEl: HTMLElement;
  /** Element leaving the view */
  leavingEl?: HTMLElement;
  /** Direction of the transition */
  direction: TransitionDirection;
  /** Duration in ms */
  duration: number;
  /** Easing function */
  easing: string;
  /** Whether this is a back navigation */
  isBack: boolean;
}

/** Result of a transition animation */
export interface TransitionResult {
  /** Whether the transition completed successfully */
  success: boolean;
  /** Duration of the transition in ms */
  duration: number;
  /** Any error that occurred */
  error?: Error;
}

/** Router outlet options */
export interface RouterOutletOptions {
  /** Keep pages in DOM after navigating away (default: true) */
  keepInDom?: boolean;
  /** Maximum number of pages to keep in DOM (default: 10) */
  maxCachedPages?: number;
  /** Custom animation builder */
  animation?: AnimationBuilder;
  /** Transition configuration */
  transition?: TransitionConfig;
}

/** Page component options */
export interface PageOptions {
  /** Unique key for this page (used for caching) */
  key?: string;
  /** Whether to cache scroll position (default: true) */
  cacheScroll?: boolean;
  /** Lifecycle hooks */
  lifecycle?: TransitionLifecycle;
}
