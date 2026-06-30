/**
 * Cap Router Outlet
 * A web component that manages page transitions
 * Works with any framework's router
 */

import { isNativeSwipeGesturePlatform } from '../core/native-platform';
import { getDefaultNavigationDirection, setOutletDirectionIntent, setOutletNavigationIntent } from '../core/navigation';
import type { TransitionController } from '../core/transition-controller';
import { createTransitionController } from '../core/transition-controller';
import type {
  TransitionConfig,
  TransitionGlobalConfig,
  TransitionDirection,
  NavigationAction,
  PageState,
  SwipeGestureOption,
} from '../core/types';

export interface CapRouterOutletOptions extends TransitionGlobalConfig {
  /** Keep pages in DOM after navigating away */
  keepInDom?: boolean;
  /** Maximum cached pages */
  maxCached?: number;
  /** Edge swipe-back gesture support */
  swipeGesture?: SwipeGestureOption;
}

interface SwipeGesturePointerState {
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  width: number;
  startTime: number;
  dragging: boolean;
  transitionStarted: boolean;
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
  private swipeGesturePointer: SwipeGesturePointerState | null = null;
  private swipeGestureFrame = 0;
  private swipeGesturePendingStep: number | null = null;
  private swipeGestureListenersActive = false;
  private skipNextHistoryBackTransition = false;
  private swipeBackDepth = 0;
  private lastNavigationHref: string | null = null;
  private lastNavigationPosition: number | null = null;
  private pendingHistoryDirection: TransitionDirection | null = null;
  private navigationHrefs: (string | null)[] = [];

  private readonly swipeGestureEdgeWidth = 50;
  private readonly swipeGestureThreshold = 10;
  private readonly swipeGestureMinimumVelocity = 0.2;
  private readonly handleHistoryPopState = (): void => {
    const currentPosition = this.getCurrentNavigationPosition();

    if (currentPosition !== null && this.lastNavigationPosition !== null) {
      if (currentPosition < this.lastNavigationPosition) {
        this.pendingHistoryDirection = 'back';
        return;
      }

      if (currentPosition > this.lastNavigationPosition) {
        this.pendingHistoryDirection = 'forward';
        return;
      }
    }

    this.pendingHistoryDirection = 'back';
  };

  static get observedAttributes(): string[] {
    return ['platform', 'duration', 'keep-in-dom', 'max-cached', 'swipe-gesture'];
  }

  constructor() {
    super();

    this.options = {
      keepInDom: true,
      maxCached: 10,
      swipeGesture: 'auto',
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
    this.style.overscrollBehaviorX = 'contain';
    this.lastNavigationHref = this.getCurrentNavigationHref();
    this.lastNavigationPosition = this.getCurrentNavigationPosition();
    this.ownerDocument.defaultView?.addEventListener('popstate', this.handleHistoryPopState);

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

    this.updateSwipeGestureListeners();
  }

  disconnectedCallback(): void {
    this.observer?.disconnect();
    this.ownerDocument.defaultView?.removeEventListener('popstate', this.handleHistoryPopState);
    this.removeSwipeGestureListeners();
    this.controller.clear();
    this.swipeBackDepth = 0;
    this.lastNavigationHref = null;
    this.lastNavigationPosition = null;
    this.pendingHistoryDirection = null;
    this.navigationHrefs = [];
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
      case 'swipe-gesture':
        this.options.swipeGesture = this.parseSwipeGestureAttribute(newValue);
        this.updateSwipeGestureListeners();
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
    this.swipeBackDepth = 0;
    this.lastNavigationHref = this.getCurrentNavigationHref();
    this.lastNavigationPosition = this.getCurrentNavigationPosition();
    this.navigationHrefs = [this.lastNavigationHref];
  }

  /**
   * Handle a new page being added
   */
  private async handleNewPage(page: HTMLElement) {
    // Determine direction from page, outlet, or default to forward.
    // Framework adapters can set direction on the outlet right before navigation.
    const outletDirection = this.dataset.direction as TransitionDirection | undefined;
    const outletNavigationAction = this.dataset.navigationAction as NavigationAction | undefined;
    const explicitDirection = (page.dataset.direction as TransitionDirection | undefined) || outletDirection;
    const explicitNavigationAction =
      (page.dataset.navigationAction as NavigationAction | undefined) || outletNavigationAction;
    const direction = this.resolveNavigationDirection(explicitDirection);
    if (outletDirection) {
      delete this.dataset.direction;
    }
    if (outletNavigationAction) {
      delete this.dataset.navigationAction;
    }
    const skipTransition = this.skipNextHistoryBackTransition && direction === 'back';
    this.skipNextHistoryBackTransition = false;
    const hadPageBefore = this.controller.stack.length > 0;

    // Set up the page element
    this.stylePageForTransition(page);

    this.pendingPage = page;

    try {
      const result = await this.controller.navigate(page, {
        direction,
        navigationAction: explicitNavigationAction,
        duration: skipTransition ? 0 : undefined,
      });
      if (result.success) {
        this.recordCompletedNavigation(explicitNavigationAction ?? direction, { hadPageBefore });
      }
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

    const hadPageBefore = this.controller.stack.length > 0;
    this.pendingPage = page;
    this.appendChild(page);

    try {
      const result = await this.controller.push(page, config);
      if (result.success) {
        this.recordCompletedNavigation('forward', { hadPageBefore, forceForward: true });
      }
    } finally {
      this.pendingPage = null;
    }
  }

  /**
   * Programmatic navigation - pop current page
   */
  async pop(config: TransitionConfig = {}): Promise<void> {
    const result = await this.controller.pop(config);

    if (result.success) {
      this.recordCompletedNavigation('back', { hadPageBefore: true });

      if (!this.options.keepInDom) {
        // Remove the popped page from DOM
        const children = Array.from(this.children) as HTMLElement[];
        const lastChild = children[children.length - 1];
        if (lastChild) {
          lastChild.remove();
        }
      }
    }
  }

  /**
   * Programmatic navigation - set root page
   */
  async setRoot(page: HTMLElement, config: TransitionConfig = {}): Promise<void> {
    const oldChildren = Array.from(this.children) as HTMLElement[];

    this.stylePageForTransition(page);

    this.pendingPage = page;
    this.appendChild(page);

    try {
      const result = await this.controller.setRoot(page, config);
      if (result.success) {
        this.recordCompletedNavigation('root', { hadPageBefore: true });
      }
    } finally {
      this.pendingPage = null;
    }

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
    return this.getSwipeBackDestination() !== null;
  }

  /**
   * Get whether edge swipe-back gesture is enabled.
   */
  get swipeGesture(): SwipeGestureOption {
    return this.options.swipeGesture ?? 'auto';
  }

  /**
   * Enable, disable, or auto-detect edge swipe-back gesture.
   */
  set swipeGesture(value: SwipeGestureOption) {
    this.setSwipeGesture(value);
  }

  /**
   * Enable, disable, or auto-detect edge swipe-back gesture.
   */
  setSwipeGesture(value: SwipeGestureOption): void {
    this.options.swipeGesture = value;

    const serialized = this.serializeSwipeGesture(value);
    if (this.getAttribute('swipe-gesture') !== serialized) {
      this.setAttribute('swipe-gesture', serialized);
    } else {
      this.updateSwipeGestureListeners();
    }
  }

  /**
   * Set the navigation stack action and animation direction for the next router-driven navigation.
   */
  setNavigation(
    action: NavigationAction,
    direction: TransitionDirection = getDefaultNavigationDirection(action),
  ): void {
    setOutletNavigationIntent(this, action, direction);
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

  private parseSwipeGestureAttribute(value: string | null): SwipeGestureOption {
    if (value === null || value === 'auto') {
      return 'auto';
    }

    if (value === 'false') {
      return false;
    }

    return true;
  }

  private serializeSwipeGesture(value: SwipeGestureOption): string {
    return typeof value === 'boolean' ? String(value) : value;
  }

  private updateSwipeGestureListeners(): void {
    if (this.options.swipeGesture === false) {
      this.removeSwipeGestureListeners();
      return;
    }

    if (this.swipeGestureListenersActive || typeof PointerEvent === 'undefined') {
      return;
    }

    this.addEventListener('pointerdown', this.handleSwipeGesturePointerDown);
    this.addEventListener('pointermove', this.handleSwipeGesturePointerMove, { passive: false });
    this.addEventListener('pointerup', this.handleSwipeGesturePointerEnd);
    this.addEventListener('pointercancel', this.handleSwipeGesturePointerCancel);
    this.swipeGestureListenersActive = true;
  }

  private removeSwipeGestureListeners(): void {
    if (!this.swipeGestureListenersActive) {
      return;
    }

    this.removeEventListener('pointerdown', this.handleSwipeGesturePointerDown);
    this.removeEventListener('pointermove', this.handleSwipeGesturePointerMove);
    this.removeEventListener('pointerup', this.handleSwipeGesturePointerEnd);
    this.removeEventListener('pointercancel', this.handleSwipeGesturePointerCancel);
    this.swipeGestureListenersActive = false;
    this.clearQueuedSwipeGestureStep();
    if (this.swipeGesturePointer?.transitionStarted) {
      this.controller.cancelInteractiveBack();
    }
    this.swipeGesturePointer = null;
  }

  private isSwipeGestureEnabled(): boolean {
    const option = this.options.swipeGesture ?? 'auto';

    if (option === true) {
      return true;
    }

    if (option === false) {
      return false;
    }

    return isNativeSwipeGesturePlatform();
  }

  private getCurrentNavigationHref(): string | null {
    return this.ownerDocument.defaultView?.location.href ?? null;
  }

  private getCurrentNavigationPosition(): number | null {
    const win = this.ownerDocument.defaultView;
    if (!win) {
      return null;
    }

    const navigationIndex = (
      win as Window & {
        navigation?: {
          currentEntry?: {
            index?: unknown;
          };
        };
      }
    ).navigation?.currentEntry?.index;
    if (typeof navigationIndex === 'number' && Number.isFinite(navigationIndex)) {
      return navigationIndex;
    }

    const state = win.history.state as Record<string, unknown> | null;
    for (const key of ['idx', 'position', 'index']) {
      const value = state?.[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
    }

    return null;
  }

  private resolveNavigationDirection(explicitDirection: TransitionDirection | undefined): TransitionDirection {
    if (explicitDirection) {
      this.pendingHistoryDirection = null;
      return explicitDirection;
    }

    const currentHref = this.getCurrentNavigationHref();
    const existingHrefIndex = this.findNavigationHrefIndex(currentHref, this.navigationHrefs.length - 2);
    if (existingHrefIndex !== -1) {
      this.pendingHistoryDirection = null;
      return 'back';
    }

    if (currentHref !== null && currentHref === this.lastNavigationHref) {
      this.pendingHistoryDirection = null;
      return 'none';
    }

    if (this.pendingHistoryDirection) {
      const direction = this.pendingHistoryDirection;
      this.pendingHistoryDirection = null;
      return direction;
    }

    const currentPosition = this.getCurrentNavigationPosition();
    if (currentPosition !== null && this.lastNavigationPosition !== null) {
      if (currentPosition < this.lastNavigationPosition) {
        return 'back';
      }

      if (currentPosition === this.lastNavigationPosition) {
        return 'none';
      }
    }

    return 'forward';
  }

  private recordCompletedNavigation(
    direction: TransitionDirection,
    options: { hadPageBefore: boolean; forceForward?: boolean },
  ): void {
    const currentHref = this.getCurrentNavigationHref();
    const currentPosition = this.getCurrentNavigationPosition();

    if (!options.hadPageBefore || direction === 'root') {
      this.resetNavigationDepth(currentHref, currentPosition);
      return;
    }

    if (direction === 'back') {
      this.recordBackNavigation(currentHref);
      this.lastNavigationPosition = currentPosition;
      return;
    }

    if (direction === 'none') {
      if (this.navigationHrefs.length === 0) {
        this.navigationHrefs = [currentHref];
      } else {
        this.navigationHrefs[this.navigationHrefs.length - 1] = currentHref;
      }

      this.syncSwipeBackDepth();
      this.lastNavigationHref = currentHref;
      this.lastNavigationPosition = currentPosition;
      return;
    }

    if (direction === 'forward') {
      const hrefChanged =
        currentHref === null || this.lastNavigationHref === null || currentHref !== this.lastNavigationHref;

      if (options.forceForward || hrefChanged) {
        this.navigationHrefs.push(currentHref);
      } else if (this.navigationHrefs.length === 0) {
        this.navigationHrefs = [currentHref];
      }

      this.syncSwipeBackDepth();
      this.lastNavigationHref = currentHref;
      this.lastNavigationPosition = currentPosition;
      return;
    }

    this.lastNavigationHref = currentHref;
    this.lastNavigationPosition = currentPosition;
  }

  private resetNavigationDepth(currentHref: string | null, currentPosition: number | null): void {
    this.navigationHrefs = [currentHref];
    this.swipeBackDepth = 0;
    this.lastNavigationHref = currentHref;
    this.lastNavigationPosition = currentPosition;
  }

  private recordBackNavigation(currentHref: string | null): void {
    const existingHrefIndex = this.findNavigationHrefIndex(currentHref, this.navigationHrefs.length - 2);

    if (existingHrefIndex !== -1) {
      this.navigationHrefs = this.navigationHrefs.slice(0, existingHrefIndex + 1);
    } else if (this.navigationHrefs.length > 1) {
      // Router redirects can land on an unexpected URL; drop the stale entry and align with currentHref.
      this.navigationHrefs.pop();
      this.navigationHrefs[this.navigationHrefs.length - 1] = currentHref;
    } else {
      this.navigationHrefs = [currentHref];
    }

    this.syncSwipeBackDepth();
    this.lastNavigationHref = currentHref;
  }

  private findNavigationHrefIndex(href: string | null, fromIndex: number): number {
    for (let index = Math.min(fromIndex, this.navigationHrefs.length - 1); index >= 0; index -= 1) {
      if (this.navigationHrefs[index] === href) {
        return index;
      }
    }

    return -1;
  }

  private syncSwipeBackDepth(): void {
    this.swipeBackDepth = Math.max(0, this.navigationHrefs.length - 1);
  }

  private getSwipeBackDestination(): PageState | null {
    const stack = this.controller.stack;

    if (this.swipeBackDepth <= 0 || stack.length <= 1) {
      return null;
    }

    return stack[stack.length - 2] ?? null;
  }

  private canStartSwipeGesture(event: PointerEvent): boolean {
    if (
      !this.isSwipeGestureEnabled() ||
      this.controller.animating ||
      this.pendingPage ||
      !this.getSwipeBackDestination()
    ) {
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

    if (event.clientY < rect.top || event.clientY > rect.bottom) {
      return false;
    }

    return this.isRTL() ? startX >= rect.width - this.swipeGestureEdgeWidth : startX <= this.swipeGestureEdgeWidth;
  }

  private isRTL(): boolean {
    const doc = this.ownerDocument;
    return doc.dir === 'rtl' || doc.documentElement.dir === 'rtl' || getComputedStyle(this).direction === 'rtl';
  }

  private getSwipeGestureDeltaX(pointer: SwipeGesturePointerState): number {
    const deltaX = pointer.currentX - pointer.startX;
    return this.isRTL() ? -deltaX : deltaX;
  }

  private isInteractiveSwipeTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) {
      return false;
    }

    return Boolean(
      target.closest(
        'a, button, input, textarea, select, option, [contenteditable="true"], [data-swipe-gesture-ignore], [data-swipe-back-ignore]',
      ),
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

  private handleSwipeGesturePointerDown = (event: PointerEvent): void => {
    if (!this.canStartSwipeGesture(event)) {
      return;
    }

    const width = Math.max(this.getBoundingClientRect().width, 1);

    this.swipeGesturePointer = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
      width,
      startTime: performance.now(),
      dragging: false,
      transitionStarted: false,
    };

    try {
      this.setPointerCapture(event.pointerId);
    } catch {
      // Some WebViews can throw if capture is unavailable for this pointer.
    }
  };

  private handleSwipeGesturePointerMove = (event: PointerEvent): void => {
    const pointer = this.swipeGesturePointer;
    if (!pointer || pointer.pointerId !== event.pointerId) {
      return;
    }

    pointer.currentX = event.clientX;
    pointer.currentY = event.clientY;

    const deltaX = this.getSwipeGestureDeltaX(pointer);
    const deltaY = pointer.currentY - pointer.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (!pointer.dragging && absY > 12 && absY > absX) {
      this.cancelSwipeGesturePointer(event.pointerId);
      return;
    }

    if (deltaX < -this.swipeGestureThreshold) {
      this.cancelSwipeGesture(event.pointerId);
      return;
    }

    let transitionStartedOnThisMove = false;

    if (!pointer.dragging && deltaX > this.swipeGestureThreshold && absX > absY) {
      if (!this.getSwipeBackDestination()) {
        this.cancelSwipeGesturePointer(event.pointerId);
        return;
      }

      pointer.dragging = true;
      pointer.transitionStarted = this.controller.beginInteractiveBack({ direction: 'back' });
      transitionStartedOnThisMove = pointer.transitionStarted;

      if (!pointer.transitionStarted) {
        this.cancelSwipeGesturePointer(event.pointerId);
        return;
      }
    }

    if (pointer.dragging && pointer.transitionStarted) {
      if (!this.getSwipeBackDestination()) {
        this.cancelSwipeGesture(event.pointerId);
        return;
      }

      if (event.cancelable) event.preventDefault();
      const step = deltaX / pointer.width;
      if (transitionStartedOnThisMove) {
        this.controller.stepInteractiveBack(step);
      } else {
        this.queueSwipeGestureStep(step);
      }
    }
  };

  private handleSwipeGesturePointerEnd = (event: PointerEvent): void => {
    const pointer = this.swipeGesturePointer;
    if (!pointer || pointer.pointerId !== event.pointerId) {
      return;
    }

    pointer.currentX = event.clientX;
    pointer.currentY = event.clientY;

    const deltaX = this.getSwipeGestureDeltaX(pointer);
    const elapsed = Math.max(performance.now() - pointer.startTime, 1);
    const velocityX = deltaX / elapsed;
    const width = pointer.width;
    const step = deltaX / width;
    const shouldCommit =
      pointer.dragging &&
      pointer.transitionStarted &&
      velocityX >= 0 &&
      (velocityX > this.swipeGestureMinimumVelocity || deltaX > width / 2);
    const missing = shouldCommit ? 1 - step : step;
    const missingDistance = Math.max(missing, 0) * width;
    const releaseDuration =
      missingDistance > 5 && Math.abs(velocityX) > 0 ? Math.min(missingDistance / Math.abs(velocityX), 540) : 0;

    if (pointer.transitionStarted) {
      this.flushQueuedSwipeGestureStep();
    } else {
      this.clearQueuedSwipeGestureStep();
    }

    this.releaseSwipeGesturePointer(event.pointerId);

    void this.finishSwipeGestureBack(shouldCommit, releaseDuration);
  };

  private handleSwipeGesturePointerCancel = (event: PointerEvent): void => {
    this.cancelSwipeGesture(event.pointerId);
  };

  private cancelSwipeGesturePointer(pointerId: number): void {
    this.clearQueuedSwipeGestureStep();
    this.releaseSwipeGesturePointer(pointerId);
  }

  private releaseSwipeGesturePointer(pointerId: number): void {
    if (this.swipeGesturePointer?.pointerId !== pointerId) {
      return;
    }

    try {
      this.releasePointerCapture(pointerId);
    } catch {
      // Ignore missing pointer capture.
    }

    this.swipeGesturePointer = null;
  }

  private cancelSwipeGesture(pointerId: number): void {
    const pointer = this.swipeGesturePointer;
    if (!pointer || pointer.pointerId !== pointerId) {
      return;
    }

    this.releaseSwipeGesturePointer(pointerId);
    this.clearQueuedSwipeGestureStep();

    if (pointer.transitionStarted) {
      void this.finishSwipeGestureBack(false, 0);
    }
  }

  private queueSwipeGestureStep(step: number): void {
    this.swipeGesturePendingStep = step;

    if (this.swipeGestureFrame !== 0) {
      return;
    }

    const win = this.ownerDocument.defaultView;
    if (!win) {
      this.flushQueuedSwipeGestureStep();
      return;
    }

    this.swipeGestureFrame = win.requestAnimationFrame(() => {
      this.swipeGestureFrame = 0;
      this.flushQueuedSwipeGestureStep();
    });
  }

  private flushQueuedSwipeGestureStep(): void {
    const step = this.swipeGesturePendingStep;
    this.swipeGesturePendingStep = null;

    if (this.swipeGestureFrame !== 0) {
      this.ownerDocument.defaultView?.cancelAnimationFrame(this.swipeGestureFrame);
      this.swipeGestureFrame = 0;
    }

    if (step !== null) {
      this.controller.stepInteractiveBack(step);
    }
  }

  private clearQueuedSwipeGestureStep(): void {
    if (this.swipeGestureFrame !== 0) {
      this.ownerDocument.defaultView?.cancelAnimationFrame(this.swipeGestureFrame);
      this.swipeGestureFrame = 0;
    }

    this.swipeGesturePendingStep = null;
  }

  private async finishSwipeGestureBack(shouldComplete: boolean, releaseDuration: number): Promise<void> {
    const canComplete = shouldComplete && this.getSwipeBackDestination() !== null;
    const shouldUseHistory = canComplete && typeof window !== 'undefined' && window.history.length > 1;

    await this.controller.endInteractiveBack(canComplete, canComplete ? releaseDuration : 0, !shouldUseHistory);

    if (!canComplete) {
      return;
    }

    if (shouldUseHistory) {
      this.skipNextHistoryBackTransition = true;
      setOutletDirectionIntent(this, 'back');
      window.history.back();
      return;
    }

    if (!this.options.keepInDom) {
      this.cleanupOldPages();
    }
  }
}

// Register the custom element
if (typeof customElements !== 'undefined' && !customElements.get('cap-router-outlet')) {
  customElements.define('cap-router-outlet', CapRouterOutlet);
}
