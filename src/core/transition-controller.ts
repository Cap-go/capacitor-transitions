/**
 * Transition Controller
 * Orchestrates page transitions and manages the navigation stack
 */

import {
  createTransition,
  waitForAnimations,
  cancelAnimations,
  getDefaultDuration,
  getDefaultEasing,
  resolveEasing,
  detectPlatform,
} from './animations';
import type {
  TransitionConfig,
  TransitionGlobalConfig,
  TransitionResult,
  PageState,
  NavigationEvent,
  TransitionLifecycle,
  TransitionAnimationOptions,
} from './types';
import {
  supportsViewTransitions,
  runViewTransition,
  injectViewTransitionsCSS,
  setViewTransitionName,
  clearViewTransitionName,
} from './view-transitions';

/** Default global configuration */
const DEFAULT_CONFIG: Required<TransitionGlobalConfig> = {
  platform: 'auto',
  duration: 0, // Will use platform default
  easing: '', // Will use platform default
  useViewTransitions: false,
  detectPlatform,
};

/**
 * Transition Controller
 * Central manager for all page transitions
 */
export class TransitionController {
  private config: Required<TransitionGlobalConfig>;
  private pageStack: PageState[] = [];
  private currentAnimations: Animation[] = [];
  private isAnimating = false;
  private lifecycleCallbacks: Map<string, TransitionLifecycle> = new Map();

  constructor(config: TransitionGlobalConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Inject View Transitions CSS if using that feature
    if (this.config.useViewTransitions && supportsViewTransitions()) {
      injectViewTransitionsCSS();
    }
  }

  /**
   * Get the resolved platform
   */
  get platform(): 'ios' | 'android' {
    if (this.config.platform === 'ios') {
      return 'ios';
    }
    if (this.config.platform === 'android') {
      return 'android';
    }
    return this.config.detectPlatform();
  }

  /**
   * Get the current page state
   */
  get currentPage(): PageState | undefined {
    return this.pageStack[this.pageStack.length - 1];
  }

  /**
   * Get the page stack
   */
  get stack(): readonly PageState[] {
    return this.pageStack;
  }

  /**
   * Check if an animation is in progress
   */
  get animating(): boolean {
    return this.isAnimating;
  }

  /**
   * Update global configuration
   */
  configure(config: Partial<TransitionGlobalConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.config.useViewTransitions && supportsViewTransitions()) {
      injectViewTransitionsCSS();
    }
  }

  /**
   * Register lifecycle callbacks for a page
   */
  registerLifecycle(pageId: string, lifecycle: TransitionLifecycle): void {
    this.lifecycleCallbacks.set(pageId, lifecycle);
  }

  /**
   * Unregister lifecycle callbacks for a page
   */
  unregisterLifecycle(pageId: string): void {
    this.lifecycleCallbacks.delete(pageId);
  }

  /**
   * Create a page state from an element
   */
  createPageState(element: HTMLElement, options: { id?: string; data?: Record<string, unknown> } = {}): PageState {
    const id = options.id || `page-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Find header, content, footer within the page
    const header = element.querySelector(
      '[data-cap-header], .cap-header, cap-header, [slot="header"]',
    ) as HTMLElement | null;
    const content = element.querySelector(
      '[data-cap-content], .cap-content, cap-content, [slot="content"]',
    ) as HTMLElement | null;
    const footer = element.querySelector(
      '[data-cap-footer], .cap-footer, cap-footer, [slot="footer"]',
    ) as HTMLElement | null;

    return {
      id,
      element,
      header: header || undefined,
      content: content || undefined,
      footer: footer || undefined,
      isActive: false,
      data: options.data,
    };
  }

  /**
   * Navigate to a new page (push)
   */
  async push(enteringEl: HTMLElement, config: TransitionConfig = {}): Promise<TransitionResult> {
    return this.navigate(enteringEl, { ...config, direction: 'forward' });
  }

  /**
   * Navigate back (pop)
   */
  async pop(config: TransitionConfig = {}): Promise<TransitionResult> {
    if (this.pageStack.length <= 1) {
      return { success: false, duration: 0, error: new Error('Cannot pop: no page to go back to') };
    }

    const leavingState = this.pageStack[this.pageStack.length - 1];
    const enteringState = this.pageStack[this.pageStack.length - 2];

    return this.navigateWithStates(enteringState, leavingState, { ...config, direction: 'back' }, () => {
      // Remove the leaving page from stack after animation
      this.pageStack.pop();
    });
  }

  /**
   * Replace all pages with a new root
   */
  async setRoot(enteringEl: HTMLElement, config: TransitionConfig = {}): Promise<TransitionResult> {
    return this.navigate(enteringEl, { ...config, direction: 'root' });
  }

  /**
   * Main navigation method
   */
  async navigate(enteringEl: HTMLElement, config: TransitionConfig = {}): Promise<TransitionResult> {
    const direction = config.direction || 'forward';
    const enteringState = this.createPageState(enteringEl);
    const leavingState = this.currentPage;

    return this.navigateWithStates(enteringState, leavingState, config, () => {
      if (direction === 'root') {
        // Clear the stack and set new root
        this.pageStack = [enteringState];
      } else if (direction === 'back' && this.pageStack.length > 0) {
        // Routers usually create a fresh element for the destination route.
        // Drop both the leaving page and the stale cached destination so the
        // internal stack mirrors the visible route stack.
        this.pageStack.pop();
        const staleEnteringState = this.pageStack.pop();
        if (staleEnteringState && staleEnteringState.element !== enteringState.element) {
          staleEnteringState.element.remove();
          this.lifecycleCallbacks.delete(staleEnteringState.id);
        }
        this.pageStack.push(enteringState);
      } else {
        // Push new page onto stack
        this.pageStack.push(enteringState);
      }
    });
  }

  /**
   * Navigate between two known page states
   */
  private async navigateWithStates(
    enteringState: PageState,
    leavingState: PageState | undefined,
    config: TransitionConfig,
    updateStack: () => void,
  ): Promise<TransitionResult> {
    const startTime = performance.now();
    const direction = config.direction || 'forward';

    // Cancel any existing animations
    if (this.isAnimating) {
      cancelAnimations(this.currentAnimations);
    }

    this.isAnimating = true;

    const event: NavigationEvent = {
      direction,
      from: leavingState,
      to: enteringState,
    };

    try {
      // Call willLeave on leaving page
      if (leavingState) {
        const lifecycle = this.lifecycleCallbacks.get(leavingState.id);
        await lifecycle?.onWillLeave?.(event);
        config.onStart?.();
      }

      // Call willEnter on entering page
      const enteringLifecycle = this.lifecycleCallbacks.get(enteringState.id);
      await enteringLifecycle?.onWillEnter?.(event);

      // Determine animation parameters
      const duration = config.duration || this.config.duration || getDefaultDuration(this.platform, direction);
      const easing = this.resolveTransitionEasing(config.easing || this.config.easing, direction);

      // Check if we should use View Transitions API
      const useViewTransitions =
        config.useViewTransitions !== false && this.config.useViewTransitions && supportsViewTransitions();

      if (useViewTransitions) {
        this.prepareViewTransitionElements(enteringState, leavingState);

        // Use View Transitions API
        await runViewTransition({
          direction,
          update: () => {
            updateStack();
            this.updatePageVisibility(enteringState, leavingState);
            this.applyViewTransitionNames(enteringState);
            this.clearViewTransitionNames(leavingState);
          },
        });

        this.clearViewTransitionNames(enteringState, leavingState);
      } else {
        // Use Web Animations API
        updateStack();

        const animOptions: TransitionAnimationOptions = {
          enteringEl: enteringState.element,
          leavingEl: leavingState?.element,
          direction,
          duration,
          easing: easing as string,
          isBack: direction === 'back',
        };

        // Create main content animations
        this.currentAnimations = createTransition(animOptions, this.platform);

        // Wait for animations
        await waitForAnimations(this.currentAnimations);

        // Update visibility
        this.updatePageVisibility(enteringState, leavingState);
        cancelAnimations(this.currentAnimations);
      }

      // Call didEnter on entering page
      enteringState.isActive = true;
      await enteringLifecycle?.onDidEnter?.(event);

      // Call didLeave on leaving page
      if (leavingState) {
        leavingState.isActive = false;
        const lifecycle = this.lifecycleCallbacks.get(leavingState.id);
        await lifecycle?.onDidLeave?.(event);
      }

      config.onComplete?.();

      const totalDuration = performance.now() - startTime;

      return { success: true, duration: totalDuration };
    } catch (error) {
      return {
        success: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    } finally {
      this.isAnimating = false;
      this.currentAnimations = [];
    }
  }

  /**
   * Update page visibility after animation
   */
  private updatePageVisibility(enteringState: PageState, leavingState: PageState | undefined): void {
    // Make entering page visible
    enteringState.element.style.display = '';
    enteringState.element.style.visibility = 'visible';
    enteringState.element.style.opacity = '1';
    enteringState.element.style.transform = 'none';
    enteringState.element.style.position = 'relative';
    this.clearTransitionOnlyStyles(enteringState.element);
    this.clearPagePartTransitionStyles(enteringState);

    // Hide leaving page but keep in DOM
    if (leavingState) {
      leavingState.element.style.display = 'none';
      leavingState.element.style.visibility = 'hidden';
      leavingState.element.style.opacity = '1';
      leavingState.element.style.transform = 'none';
      this.clearTransitionOnlyStyles(leavingState.element);
      this.clearPagePartTransitionStyles(leavingState);
    }
  }

  /**
   * Resolve configured easing presets after platform/direction are known.
   */
  private resolveTransitionEasing(
    easing: TransitionGlobalConfig['easing'],
    direction: TransitionConfig['direction'],
  ): string {
    if (!easing) {
      return getDefaultEasing(this.platform, direction || 'forward');
    }

    if (typeof easing === 'string' && ['ios', 'android'].includes(easing)) {
      return getDefaultEasing(easing as 'ios' | 'android', direction || 'forward');
    }

    return resolveEasing(easing);
  }

  /**
   * Remove styles that should only exist while a page is actively transitioning.
   */
  private clearTransitionOnlyStyles(element: HTMLElement): void {
    element.style.removeProperty('z-index');
    element.style.removeProperty('pointer-events');
    element.style.removeProperty('will-change');
    element.style.removeProperty('backface-visibility');
    element.style.removeProperty('transform-style');
    element.style.removeProperty('box-shadow');
  }

  private clearPagePartTransitionStyles(pageState: PageState): void {
    const { header, content, footer } = this.resolvePageParts(pageState);

    for (const element of [header, content, footer]) {
      if (!element) continue;

      element.style.removeProperty('transform');
      element.style.removeProperty('opacity');
      this.clearTransitionOnlyStyles(element);
    }
  }

  /**
   * Prepare entering/leaving elements for a View Transition capture.
   * Entering page must be hidden in the "old" snapshot.
   */
  private prepareViewTransitionElements(enteringState: PageState, leavingState: PageState | undefined): void {
    this.clearAllKnownViewTransitionNames(enteringState, leavingState);

    if (leavingState) {
      this.applyViewTransitionNames(leavingState);
      enteringState.element.style.display = 'none';
      enteringState.element.style.visibility = 'hidden';
    }
  }

  /**
   * Assign view transition names to a page's layout parts.
   */
  private applyViewTransitionNames(pageState: PageState): void {
    const { header, content, footer } = this.resolvePageParts(pageState);

    if (header) {
      setViewTransitionName(header, 'cap-header');
    }
    if (content) {
      setViewTransitionName(content, 'cap-content');
    }
    if (footer) {
      setViewTransitionName(footer, 'cap-footer');
    }
  }

  /**
   * Clear view transition names for one or more page states.
   */
  private clearViewTransitionNames(...states: (PageState | undefined)[]): void {
    for (const state of states) {
      if (!state) continue;
      const { header, content, footer } = this.resolvePageParts(state);

      if (header) {
        clearViewTransitionName(header);
      }
      if (content) {
        clearViewTransitionName(content);
      }
      if (footer) {
        clearViewTransitionName(footer);
      }
    }
  }

  /**
   * Clear view transition names from all known pages plus transient states.
   */
  private clearAllKnownViewTransitionNames(...extraStates: (PageState | undefined)[]): void {
    const knownStates = new Set<PageState>();

    for (const state of this.pageStack) {
      knownStates.add(state);
    }
    for (const state of extraStates) {
      if (state) {
        knownStates.add(state);
      }
    }

    this.clearViewTransitionNames(...knownStates);
  }

  /**
   * Resolve page parts lazily to avoid timing issues with custom-element setup.
   */
  private resolvePageParts(pageState: PageState): {
    header?: HTMLElement;
    content?: HTMLElement;
    footer?: HTMLElement;
  } {
    const header =
      pageState.header ||
      (pageState.element.querySelector(
        '[data-cap-header], .cap-header, cap-header, [slot="header"]',
      ) as HTMLElement | null) ||
      undefined;
    const content =
      pageState.content ||
      (pageState.element.querySelector(
        '[data-cap-content], .cap-content, cap-content, [slot="content"]',
      ) as HTMLElement | null) ||
      undefined;
    const footer =
      pageState.footer ||
      (pageState.element.querySelector(
        '[data-cap-footer], .cap-footer, cap-footer, [slot="footer"]',
      ) as HTMLElement | null) ||
      undefined;

    if (header) pageState.header = header;
    if (content) pageState.content = content;
    if (footer) pageState.footer = footer;

    return { header, content, footer };
  }

  /**
   * Save scroll position for a page
   */
  saveScrollPosition(pageId: string): void {
    const page = this.pageStack.find((p) => p.id === pageId);
    if (page?.content) {
      page.scrollPosition = {
        x: page.content.scrollLeft,
        y: page.content.scrollTop,
      };
    }
  }

  /**
   * Restore scroll position for a page
   */
  restoreScrollPosition(pageId: string): void {
    const page = this.pageStack.find((p) => p.id === pageId);
    if (page?.content && page.scrollPosition) {
      page.content.scrollLeft = page.scrollPosition.x;
      page.content.scrollTop = page.scrollPosition.y;
    }
  }

  /**
   * Remove a page from the stack (used when cleaning up)
   */
  removePage(pageId: string): void {
    const index = this.pageStack.findIndex((p) => p.id === pageId);
    if (index !== -1) {
      this.pageStack.splice(index, 1);
      this.lifecycleCallbacks.delete(pageId);
    }
  }

  /**
   * Clear all pages
   */
  clear(): void {
    this.pageStack = [];
    this.lifecycleCallbacks.clear();
    cancelAnimations(this.currentAnimations);
    this.currentAnimations = [];
    this.isAnimating = false;
  }
}

// Singleton instance for convenience
let defaultController: TransitionController | null = null;

/**
 * Get or create the default transition controller
 */
export function getTransitionController(config?: TransitionGlobalConfig): TransitionController {
  if (!defaultController) {
    defaultController = new TransitionController(config);
  } else if (config) {
    defaultController.configure(config);
  }
  return defaultController;
}

/**
 * Create a new transition controller
 */
export function createTransitionController(config?: TransitionGlobalConfig): TransitionController {
  return new TransitionController(config);
}
