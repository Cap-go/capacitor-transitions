/**
 * Cap Router Outlet
 * A web component that manages page transitions
 * Works with any framework's router
 */

import { detectNativePlatform, isNativeBackSwipePlatform } from '../core/native-platform';
import type { TransitionController } from '../core/transition-controller';
import { createTransitionController } from '../core/transition-controller';
import type {
  TransitionConfig,
  TransitionGlobalConfig,
  TransitionDirection,
  PageState,
  SwipeBackOption,
  SwipeBackEventDetail,
} from '../core/types';

export interface CapRouterOutletOptions extends TransitionGlobalConfig {
  /** Keep pages in DOM after navigating away */
  keepInDom?: boolean;
  /** Maximum cached pages */
  maxCached?: number;
  /** Edge swipe-back gesture support */
  swipeBack?: SwipeBackOption;
}

interface SwipeBackPointerState {
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  dragging: boolean;
}

/**
 * Custom element for managing page transitions
 * Usage: <cap-router-outlet></cap-router-outlet>
 */
export class CapRouterOutlet extends HTMLElement {
  private controller: TransitionController;
  private options: CapRouterOutletOptions;
  private observer: MutationObserver | null = null;
  private pendingPage: HTMLElement | null = null;
  private ignoredNodes = new WeakSet<HTMLElement>();
  private swipeBackPointer: SwipeBackPointerState | null = null;
  private swipeBackListenersActive = false;

  private readonly swipeBackEdgeWidth = 32;
  private readonly swipeBackMinimumDistance = 72;
  private readonly swipeBackMinimumVelocity = 0.45;

  static get observedAttributes(): string[] {
    return ['platform', 'duration', 'keep-in-dom', 'max-cached', 'swipe-back'];
  }

  constructor() {
    super();

    this.options = {
      keepInDom: true,
      maxCached: 10,
      swipeBack: 'auto',
    };

    this.controller = createTransitionController();
  }

  connectedCallback(): void {
    // Set up styles
    this.style.display = 'block';
    this.style.position = 'relative';
    this.style.width = '100%';
    this.style.height = '100%';
    this.style.overflow = 'hidden';

    // Observe child changes to detect page additions
    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    this.observer.observe(this, {
      childList: true,
      subtree: false,
    });

    // Initialize with existing children
    const children = Array.from(this.children) as HTMLElement[];
    if (children.length > 0) {
      this.initializeFirstPage(children[children.length - 1]);
    }

    this.updateSwipeBackListeners();
  }

  disconnectedCallback(): void {
    this.observer?.disconnect();
    this.removeSwipeBackListeners();
    this.controller.clear();
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string): void {
    switch (name) {
      case 'platform':
        this.controller.configure({ platform: newValue as 'ios' | 'android' | 'auto' });
        break;
      case 'duration':
        this.controller.configure({ duration: parseInt(newValue, 10) });
        break;
      case 'keep-in-dom':
        this.options.keepInDom = newValue !== 'false';
        break;
      case 'max-cached':
        this.options.maxCached = parseInt(newValue, 10);
        break;
      case 'swipe-back':
        this.options.swipeBack = this.parseSwipeBackAttribute(newValue);
        this.updateSwipeBackListeners();
        break;
    }
  }

  /**
   * Handle DOM mutations (child additions/removals)
   */
  private handleMutations(mutations: MutationRecord[]) {
    const addedNodes: HTMLElement[] = [];
    const removedNodes: HTMLElement[] = [];

    for (const mutation of mutations) {
      for (const node of mutation.removedNodes) {
        if (node instanceof HTMLElement) {
          removedNodes.push(node);
        }
      }

      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          addedNodes.push(node);
        }
      }
    }

    // Some routers remove the current page before adding the next one.
    // Re-insert it temporarily so leaving animations remain visible.
    const currentEl = this.controller.currentPage?.element;
    if (currentEl && removedNodes.includes(currentEl) && addedNodes.length > 0 && !currentEl.isConnected) {
      this.stylePageForTransition(currentEl);
      currentEl.style.display = '';
      currentEl.style.visibility = 'visible';

      const anchor = addedNodes[0];
      this.ignoredNodes.add(currentEl);
      if (anchor.parentElement === this) {
        this.insertBefore(currentEl, anchor);
      } else {
        this.appendChild(currentEl);
      }
    }

    // Remove detached historical pages from internal stack bookkeeping.
    for (const node of removedNodes) {
      if (node === currentEl) continue;
      const state = this.controller.stack.find((pageState) => pageState.element === node);
      if (state) {
        this.controller.removePage(state.id);
      }
    }

    for (const node of addedNodes) {
      if (node === this.pendingPage) continue;
      if (this.ignoredNodes.has(node)) {
        this.ignoredNodes.delete(node);
        continue;
      }

      // New page added - trigger transition
      this.handleNewPage(node);
    }
  }

  /**
   * Initialize the first page without animation
   */
  private initializeFirstPage(page: HTMLElement) {
    page.style.position = 'relative';
    page.style.width = '100%';
    page.style.height = '100%';

    const state = this.controller.createPageState(page);
    state.isActive = true;

    // Add to controller stack manually
    (this.controller as unknown as { pageStack: PageState[] }).pageStack.push(state);
  }

  /**
   * Handle a new page being added
   */
  private async handleNewPage(page: HTMLElement) {
    // Determine direction from page, outlet, or default to forward.
    // Framework adapters can set direction on the outlet right before navigation.
    const outletDirection = this.dataset.direction as TransitionDirection | undefined;
    const direction = (page.dataset.direction as TransitionDirection) || outletDirection || 'forward';
    if (outletDirection) {
      delete this.dataset.direction;
    }

    // Set up the page element
    this.stylePageForTransition(page);

    this.pendingPage = page;

    try {
      await this.controller.navigate(page, { direction });
    } finally {
      this.pendingPage = null;
    }

    // Clean up old pages if not keeping in DOM
    if (!this.options.keepInDom) {
      this.cleanupOldPages();
    } else {
      this.enforceCacheLimit();
    }
  }

  /**
   * Clean up pages that are no longer needed
   */
  private cleanupOldPages() {
    const stack = this.controller.stack;
    const children = Array.from(this.children) as HTMLElement[];

    for (const child of children) {
      const inStack = stack.some((s) => s.element === child);
      if (!inStack && !child.dataset.keepInDom) {
        child.remove();
      }
    }
  }

  /**
   * Enforce the cache limit
   */
  private enforceCacheLimit() {
    const stack = this.controller.stack;
    const maxCached = this.options.maxCached || 10;

    if (stack.length > maxCached) {
      // Remove oldest pages (keeping the newest maxCached)
      const toRemove = stack.slice(0, stack.length - maxCached);
      for (const page of toRemove) {
        if (!page.isActive) {
          page.element.remove();
          this.controller.removePage(page.id);
        }
      }
    }
  }

  /**
   * Programmatic navigation - push a new page
   */
  async push(page: HTMLElement, config: TransitionConfig = {}): Promise<void> {
    this.stylePageForTransition(page);

    this.appendChild(page);
    await this.controller.push(page, config);
  }

  /**
   * Programmatic navigation - pop current page
   */
  async pop(config: TransitionConfig = {}): Promise<void> {
    const result = await this.controller.pop(config);

    if (result.success && !this.options.keepInDom) {
      // Remove the popped page from DOM
      const children = Array.from(this.children) as HTMLElement[];
      const lastChild = children[children.length - 1];
      if (lastChild) {
        lastChild.remove();
      }
    }
  }

  /**
   * Programmatic navigation - set root page
   */
  async setRoot(page: HTMLElement, config: TransitionConfig = {}): Promise<void> {
    const oldChildren = Array.from(this.children) as HTMLElement[];

    this.stylePageForTransition(page);

    this.appendChild(page);
    await this.controller.setRoot(page, config);

    // Remove all old pages
    for (const child of oldChildren) {
      child.remove();
    }
  }

  /**
   * Get the current page stack length
   */
  get stackLength(): number {
    return this.controller.stack.length;
  }

  /**
   * Check if we can go back
   */
  get canGoBack(): boolean {
    return this.controller.stack.length > 1;
  }

  /**
   * Get whether edge swipe-back is enabled.
   */
  get swipeBack(): SwipeBackOption {
    return this.options.swipeBack ?? 'auto';
  }

  /**
   * Enable, disable, or native-detect edge swipe-back.
   */
  set swipeBack(value: SwipeBackOption) {
    this.setSwipeBack(value);
  }

  /**
   * Enable, disable, or native-detect edge swipe-back.
   */
  setSwipeBack(value: SwipeBackOption): void {
    this.options.swipeBack = value;

    const serialized = this.serializeSwipeBack(value);
    if (this.getAttribute('swipe-back') !== serialized) {
      this.setAttribute('swipe-back', serialized);
    } else {
      this.updateSwipeBackListeners();
    }
  }

  /**
   * Get the transition controller for advanced usage
   */
  getController(): TransitionController {
    return this.controller;
  }

  /**
   * Apply layout styles required for transition animations.
   */
  private stylePageForTransition(page: HTMLElement): void {
    page.style.position = 'absolute';
    page.style.top = '0';
    page.style.left = '0';
    page.style.width = '100%';
    page.style.height = '100%';
  }

  private parseSwipeBackAttribute(value: string | null): SwipeBackOption {
    if (value === null || value === 'auto') {
      return 'auto';
    }

    if (value === 'false') {
      return false;
    }

    return true;
  }

  private serializeSwipeBack(value: SwipeBackOption): string {
    return typeof value === 'boolean' ? String(value) : value;
  }

  private updateSwipeBackListeners(): void {
    if (this.options.swipeBack === false) {
      this.removeSwipeBackListeners();
      return;
    }

    if (this.swipeBackListenersActive || typeof PointerEvent === 'undefined') {
      return;
    }

    this.addEventListener('pointerdown', this.handleSwipeBackPointerDown);
    this.addEventListener('pointermove', this.handleSwipeBackPointerMove, { passive: false });
    this.addEventListener('pointerup', this.handleSwipeBackPointerEnd);
    this.addEventListener('pointercancel', this.handleSwipeBackPointerCancel);
    this.swipeBackListenersActive = true;
  }

  private removeSwipeBackListeners(): void {
    if (!this.swipeBackListenersActive) {
      return;
    }

    this.removeEventListener('pointerdown', this.handleSwipeBackPointerDown);
    this.removeEventListener('pointermove', this.handleSwipeBackPointerMove);
    this.removeEventListener('pointerup', this.handleSwipeBackPointerEnd);
    this.removeEventListener('pointercancel', this.handleSwipeBackPointerCancel);
    this.swipeBackListenersActive = false;
    this.swipeBackPointer = null;
  }

  private isSwipeBackEnabled(): boolean {
    const option = this.options.swipeBack ?? 'auto';

    if (option === true) {
      return true;
    }

    if (option === false) {
      return false;
    }

    return isNativeBackSwipePlatform();
  }

  private canStartSwipeBack(event: PointerEvent): boolean {
    if (!this.isSwipeBackEnabled() || this.controller.animating || this.pendingPage || !this.canGoBack) {
      return false;
    }

    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) {
      return false;
    }

    if (this.isInteractiveSwipeTarget(event.target) || this.hasScrollableInlineAncestor(event.target)) {
      return false;
    }

    const rect = this.getBoundingClientRect();
    const startX = event.clientX - rect.left;

    return (
      startX >= 0 && startX <= this.swipeBackEdgeWidth && event.clientY >= rect.top && event.clientY <= rect.bottom
    );
  }

  private isInteractiveSwipeTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) {
      return false;
    }

    return Boolean(
      target.closest('a, button, input, textarea, select, option, [contenteditable="true"], [data-swipe-back-ignore]'),
    );
  }

  private hasScrollableInlineAncestor(target: EventTarget | null): boolean {
    let element = target instanceof Element ? target : null;

    while (element && element !== this) {
      if (element instanceof HTMLElement) {
        const style = getComputedStyle(element);
        const canScrollInline = /(auto|scroll)/.test(style.overflowX) && element.scrollWidth > element.clientWidth + 1;

        if (canScrollInline && element.scrollLeft > 0) {
          return true;
        }
      }

      element = element.parentElement;
    }

    return false;
  }

  private handleSwipeBackPointerDown = (event: PointerEvent): void => {
    if (!this.canStartSwipeBack(event)) {
      return;
    }

    this.swipeBackPointer = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
      startTime: performance.now(),
      dragging: false,
    };

    try {
      this.setPointerCapture(event.pointerId);
    } catch {
      // Some WebViews can throw if capture is unavailable for this pointer.
    }
  };

  private handleSwipeBackPointerMove = (event: PointerEvent): void => {
    const pointer = this.swipeBackPointer;
    if (!pointer || pointer.pointerId !== event.pointerId) {
      return;
    }

    pointer.currentX = event.clientX;
    pointer.currentY = event.clientY;

    const deltaX = pointer.currentX - pointer.startX;
    const deltaY = pointer.currentY - pointer.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (!pointer.dragging && absY > 12 && absY > absX) {
      this.cancelSwipeBackPointer(event.pointerId);
      return;
    }

    if (deltaX < -8) {
      this.cancelSwipeBackPointer(event.pointerId);
      return;
    }

    if (deltaX > 8 && absX > absY) {
      pointer.dragging = true;
      if (event.cancelable) {
        event.preventDefault();
      }
    }
  };

  private handleSwipeBackPointerEnd = (event: PointerEvent): void => {
    const pointer = this.swipeBackPointer;
    if (!pointer || pointer.pointerId !== event.pointerId) {
      return;
    }

    pointer.currentX = event.clientX;
    pointer.currentY = event.clientY;

    const deltaX = pointer.currentX - pointer.startX;
    const deltaY = pointer.currentY - pointer.startY;
    const elapsed = Math.max(performance.now() - pointer.startTime, 1);
    const velocityX = deltaX / elapsed;
    const minDistance = Math.min(this.swipeBackMinimumDistance, this.clientWidth * 0.35);
    const verticalAllowed = Math.abs(deltaY) <= Math.max(80, Math.abs(deltaX) * 0.8);
    const shouldCommit =
      verticalAllowed &&
      deltaX > 0 &&
      (deltaX >= minDistance || (deltaX >= 40 && velocityX >= this.swipeBackMinimumVelocity));

    this.cancelSwipeBackPointer(event.pointerId);

    if (shouldCommit) {
      this.commitSwipeBack(deltaX, deltaY, velocityX);
    }
  };

  private handleSwipeBackPointerCancel = (event: PointerEvent): void => {
    this.cancelSwipeBackPointer(event.pointerId);
  };

  private cancelSwipeBackPointer(pointerId: number): void {
    if (this.swipeBackPointer?.pointerId !== pointerId) {
      return;
    }

    try {
      this.releasePointerCapture(pointerId);
    } catch {
      // Ignore missing pointer capture.
    }

    this.swipeBackPointer = null;
  }

  private commitSwipeBack(deltaX: number, deltaY: number, velocityX: number): void {
    const platform = detectNativePlatform();
    const detail: SwipeBackEventDetail = {
      direction: 'back',
      platform: platform.platform,
      native: platform.isNative,
      deltaX,
      deltaY,
      velocityX,
    };
    const event = new CustomEvent<SwipeBackEventDetail>('cap-swipe-back', {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail,
    });

    if (!this.dispatchEvent(event)) {
      return;
    }

    this.dataset.direction = 'back';

    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
      return;
    }

    void this.pop({ direction: 'back' });
  }
}

// Register the custom element
if (typeof customElements !== 'undefined' && !customElements.get('cap-router-outlet')) {
  customElements.define('cap-router-outlet', CapRouterOutlet);
}
