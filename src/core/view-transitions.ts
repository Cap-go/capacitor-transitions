/**
 * View Transitions API support
 * Progressive enhancement for browsers that support it
 */

import type { TransitionDirection } from './types';

/** Check if View Transitions API is supported */
export function supportsViewTransitions(): boolean {
  return typeof document !== 'undefined' && 'startViewTransition' in document;
}

/** View transition options */
export interface ViewTransitionOptions {
  /** Callback to update the DOM */
  update: () => void | Promise<void>;
  /** Direction for animation classes */
  direction?: TransitionDirection;
  /** Custom view transition names to apply */
  names?: {
    header?: string;
    content?: string;
    footer?: string;
  };
  /** Skip animation */
  skipAnimation?: boolean;
}

/**
 * Run a transition with View Transitions API if available
 * Falls back to immediate update if not supported
 */
export async function runViewTransition(options: ViewTransitionOptions): Promise<void> {
  const { update, direction = 'forward', skipAnimation = false } = options;

  if (skipAnimation || !supportsViewTransitions()) {
    await update();
    return;
  }

  // Add direction class for CSS targeting
  const root = document.documentElement;
  root.dataset.transitionDirection = direction;

  try {
    const transition = (
      document as Document & { startViewTransition: (cb: () => Promise<void>) => { finished: Promise<void> } }
    ).startViewTransition(async () => {
      await update();
    });

    await transition.finished;
  } finally {
    delete root.dataset.transitionDirection;
  }
}

/**
 * Apply view transition name to an element
 */
export function setViewTransitionName(element: HTMLElement, name: string): void {
  element.style.viewTransitionName = name;
}

/**
 * Remove view transition name from an element
 */
export function clearViewTransitionName(element: HTMLElement): void {
  element.style.viewTransitionName = '';
}

/**
 * CSS for View Transitions API integration
 * This can be injected into the page to enable smooth transitions
 */
export const VIEW_TRANSITIONS_CSS = `
/* View Transitions API base styles */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.4s;
  animation-timing-function: cubic-bezier(0.32, 0.72, 0, 1);
}

/* iOS-style forward navigation */
[data-transition-direction="forward"]::view-transition-old(root) {
  animation-name: cap-slide-out-left;
}

[data-transition-direction="forward"]::view-transition-new(root) {
  animation-name: cap-slide-in-right;
}

/* iOS-style back navigation */
[data-transition-direction="back"]::view-transition-old(root) {
  animation-name: cap-slide-out-right;
}

[data-transition-direction="back"]::view-transition-new(root) {
  animation-name: cap-slide-in-left;
}

/* Root/replace navigation - fade */
[data-transition-direction="root"]::view-transition-old(root) {
  animation-name: cap-fade-out;
}

[data-transition-direction="root"]::view-transition-new(root) {
  animation-name: cap-fade-in;
}

/* Header transitions */
::view-transition-old(cap-header),
::view-transition-new(cap-header) {
  animation-duration: 0.3s;
}

[data-transition-direction="forward"]::view-transition-old(cap-header) {
  animation-name: cap-header-out-left;
}

[data-transition-direction="forward"]::view-transition-new(cap-header) {
  animation-name: cap-header-in-right;
}

[data-transition-direction="back"]::view-transition-old(cap-header) {
  animation-name: cap-header-out-right;
}

[data-transition-direction="back"]::view-transition-new(cap-header) {
  animation-name: cap-header-in-left;
}

/* Content transitions */
::view-transition-old(cap-content),
::view-transition-new(cap-content) {
  animation-duration: 0.4s;
  animation-timing-function: cubic-bezier(0.32, 0.72, 0, 1);
}

[data-transition-direction="forward"]::view-transition-old(cap-content) {
  animation-name: cap-slide-out-left;
}

[data-transition-direction="forward"]::view-transition-new(cap-content) {
  animation-name: cap-slide-in-right;
}

[data-transition-direction="back"]::view-transition-old(cap-content) {
  animation-name: cap-slide-out-right;
}

[data-transition-direction="back"]::view-transition-new(cap-content) {
  animation-name: cap-slide-in-left;
}

/* Animation keyframes */
@keyframes cap-slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 1;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes cap-slide-out-left {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-30%);
    opacity: 0.8;
  }
}

@keyframes cap-slide-in-left {
  from {
    transform: translateX(-30%);
    opacity: 0.8;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes cap-slide-out-right {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 1;
  }
}

@keyframes cap-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes cap-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes cap-header-in-right {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes cap-header-out-left {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-20px);
    opacity: 0;
  }
}

@keyframes cap-header-in-left {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes cap-header-out-right {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(20px);
    opacity: 0;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root),
  ::view-transition-old(cap-header),
  ::view-transition-new(cap-header),
  ::view-transition-old(cap-content),
  ::view-transition-new(cap-content) {
    animation-duration: 0.01ms !important;
  }
}
`;

/**
 * Inject View Transitions CSS into the page
 */
export function injectViewTransitionsCSS(): void {
  if (typeof document === 'undefined') return;

  const styleId = 'cap-view-transitions-css';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = VIEW_TRANSITIONS_CSS;
  document.head.appendChild(style);
}
