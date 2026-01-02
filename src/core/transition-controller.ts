/**
 * Transition Controller
 * Orchestrates page transitions and manages the navigation stack
 */

import type {
  TransitionConfig,
  TransitionGlobalConfig,
  TransitionDirection,
  TransitionResult,
  PageState,
  NavigationEvent,
  TransitionLifecycle,
  TransitionAnimationOptions,
} from './types'
import {
  createTransition,
  waitForAnimations,
  cancelAnimations,
  getDefaultDuration,
  getDefaultEasing,
  detectPlatform,
  createHeaderTransition,
  createFooterTransition,
} from './animations'
import {
  supportsViewTransitions,
  runViewTransition,
  injectViewTransitionsCSS,
} from './view-transitions'

/** Default global configuration */
const DEFAULT_CONFIG: Required<TransitionGlobalConfig> = {
  platform: 'auto',
  duration: 0, // Will use platform default
  easing: '', // Will use platform default
  useViewTransitions: true,
  detectPlatform,
}

/**
 * Transition Controller
 * Central manager for all page transitions
 */
export class TransitionController {
  private config: Required<TransitionGlobalConfig>
  private pageStack: PageState[] = []
  private currentAnimations: Animation[] = []
  private isAnimating = false
  private lifecycleCallbacks: Map<string, TransitionLifecycle> = new Map()

  constructor(config: TransitionGlobalConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Inject View Transitions CSS if using that feature
    if (this.config.useViewTransitions && supportsViewTransitions()) {
      injectViewTransitionsCSS()
    }
  }

  /**
   * Get the resolved platform
   */
  get platform() {
    return this.config.platform === 'auto'
      ? this.config.detectPlatform()
      : this.config.platform
  }

  /**
   * Get the current page state
   */
  get currentPage(): PageState | undefined {
    return this.pageStack[this.pageStack.length - 1]
  }

  /**
   * Get the page stack
   */
  get stack(): readonly PageState[] {
    return this.pageStack
  }

  /**
   * Check if an animation is in progress
   */
  get animating(): boolean {
    return this.isAnimating
  }

  /**
   * Update global configuration
   */
  configure(config: Partial<TransitionGlobalConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Register lifecycle callbacks for a page
   */
  registerLifecycle(pageId: string, lifecycle: TransitionLifecycle): void {
    this.lifecycleCallbacks.set(pageId, lifecycle)
  }

  /**
   * Unregister lifecycle callbacks for a page
   */
  unregisterLifecycle(pageId: string): void {
    this.lifecycleCallbacks.delete(pageId)
  }

  /**
   * Create a page state from an element
   */
  createPageState(
    element: HTMLElement,
    options: { id?: string; data?: Record<string, unknown> } = {}
  ): PageState {
    const id = options.id || `page-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    // Find header, content, footer within the page
    const header = element.querySelector('[data-cap-header], .cap-header') as HTMLElement | null
    const content = element.querySelector('[data-cap-content], .cap-content') as HTMLElement | null
    const footer = element.querySelector('[data-cap-footer], .cap-footer') as HTMLElement | null

    return {
      id,
      element,
      header: header || undefined,
      content: content || undefined,
      footer: footer || undefined,
      isActive: false,
      data: options.data,
    }
  }

  /**
   * Navigate to a new page (push)
   */
  async push(
    enteringEl: HTMLElement,
    config: TransitionConfig = {}
  ): Promise<TransitionResult> {
    return this.navigate(enteringEl, { ...config, direction: 'forward' })
  }

  /**
   * Navigate back (pop)
   */
  async pop(config: TransitionConfig = {}): Promise<TransitionResult> {
    if (this.pageStack.length <= 1) {
      return { success: false, duration: 0, error: new Error('Cannot pop: no page to go back to') }
    }

    const leavingState = this.pageStack[this.pageStack.length - 1]
    const enteringState = this.pageStack[this.pageStack.length - 2]

    return this.navigateWithStates(
      enteringState,
      leavingState,
      { ...config, direction: 'back' },
      () => {
        // Remove the leaving page from stack after animation
        this.pageStack.pop()
      }
    )
  }

  /**
   * Replace all pages with a new root
   */
  async setRoot(
    enteringEl: HTMLElement,
    config: TransitionConfig = {}
  ): Promise<TransitionResult> {
    return this.navigate(enteringEl, { ...config, direction: 'root' })
  }

  /**
   * Main navigation method
   */
  async navigate(
    enteringEl: HTMLElement,
    config: TransitionConfig = {}
  ): Promise<TransitionResult> {
    const direction = config.direction || 'forward'
    const enteringState = this.createPageState(enteringEl)
    const leavingState = this.currentPage

    return this.navigateWithStates(
      enteringState,
      leavingState,
      config,
      () => {
        if (direction === 'root') {
          // Clear the stack and set new root
          this.pageStack = [enteringState]
        } else {
          // Push new page onto stack
          this.pageStack.push(enteringState)
        }
      }
    )
  }

  /**
   * Navigate between two known page states
   */
  private async navigateWithStates(
    enteringState: PageState,
    leavingState: PageState | undefined,
    config: TransitionConfig,
    updateStack: () => void
  ): Promise<TransitionResult> {
    const startTime = performance.now()
    const direction = config.direction || 'forward'

    // Cancel any existing animations
    if (this.isAnimating) {
      cancelAnimations(this.currentAnimations)
    }

    this.isAnimating = true

    const event: NavigationEvent = {
      direction,
      from: leavingState,
      to: enteringState,
    }

    try {
      // Call willLeave on leaving page
      if (leavingState) {
        const lifecycle = this.lifecycleCallbacks.get(leavingState.id)
        await lifecycle?.onWillLeave?.(event)
        config.onStart?.()
      }

      // Call willEnter on entering page
      const enteringLifecycle = this.lifecycleCallbacks.get(enteringState.id)
      await enteringLifecycle?.onWillEnter?.(event)

      // Determine animation parameters
      const duration = config.duration || this.config.duration || getDefaultDuration(this.platform)
      const easing = config.easing
        ? (typeof config.easing === 'string' && ['ios', 'android'].includes(config.easing)
          ? getDefaultEasing(config.easing as 'ios' | 'android')
          : config.easing)
        : (this.config.easing || getDefaultEasing(this.platform))

      // Check if we should use View Transitions API
      const useViewTransitions =
        config.useViewTransitions !== false &&
        this.config.useViewTransitions &&
        supportsViewTransitions()

      if (useViewTransitions) {
        // Use View Transitions API
        await runViewTransition({
          direction,
          update: () => {
            updateStack()
            this.updatePageVisibility(enteringState, leavingState)
          },
        })
      } else {
        // Use Web Animations API
        updateStack()

        const animOptions: TransitionAnimationOptions = {
          enteringEl: enteringState.element,
          leavingEl: leavingState?.element,
          direction,
          duration,
          easing: easing as string,
          isBack: direction === 'back',
        }

        // Create main content animations
        this.currentAnimations = createTransition(animOptions, this.platform)

        // Create header animations if headers exist
        if (enteringState.header || leavingState?.header) {
          const headerAnims = createHeaderTransition({
            ...animOptions,
            enteringHeader: enteringState.header,
            leavingHeader: leavingState?.header,
          })
          this.currentAnimations.push(...headerAnims)
        }

        // Create footer animations if footers exist
        if (enteringState.footer || leavingState?.footer) {
          const footerAnims = createFooterTransition({
            ...animOptions,
            enteringFooter: enteringState.footer,
            leavingFooter: leavingState?.footer,
          })
          this.currentAnimations.push(...footerAnims)
        }

        // Wait for animations
        await waitForAnimations(this.currentAnimations)

        // Update visibility
        this.updatePageVisibility(enteringState, leavingState)
      }

      // Call didEnter on entering page
      enteringState.isActive = true
      await enteringLifecycle?.onDidEnter?.(event)

      // Call didLeave on leaving page
      if (leavingState) {
        leavingState.isActive = false
        const lifecycle = this.lifecycleCallbacks.get(leavingState.id)
        await lifecycle?.onDidLeave?.(event)
      }

      config.onComplete?.()

      const totalDuration = performance.now() - startTime

      return { success: true, duration: totalDuration }
    } catch (error) {
      return {
        success: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    } finally {
      this.isAnimating = false
      this.currentAnimations = []
    }
  }

  /**
   * Update page visibility after animation
   */
  private updatePageVisibility(
    enteringState: PageState,
    leavingState: PageState | undefined
  ): void {
    // Make entering page visible
    enteringState.element.style.display = ''
    enteringState.element.style.visibility = 'visible'
    enteringState.element.style.opacity = '1'
    enteringState.element.style.transform = 'none'
    enteringState.element.style.position = 'relative'

    // Hide leaving page but keep in DOM
    if (leavingState) {
      leavingState.element.style.display = 'none'
      leavingState.element.style.visibility = 'hidden'
    }
  }

  /**
   * Save scroll position for a page
   */
  saveScrollPosition(pageId: string): void {
    const page = this.pageStack.find((p) => p.id === pageId)
    if (page?.content) {
      page.scrollPosition = {
        x: page.content.scrollLeft,
        y: page.content.scrollTop,
      }
    }
  }

  /**
   * Restore scroll position for a page
   */
  restoreScrollPosition(pageId: string): void {
    const page = this.pageStack.find((p) => p.id === pageId)
    if (page?.content && page.scrollPosition) {
      page.content.scrollLeft = page.scrollPosition.x
      page.content.scrollTop = page.scrollPosition.y
    }
  }

  /**
   * Remove a page from the stack (used when cleaning up)
   */
  removePage(pageId: string): void {
    const index = this.pageStack.findIndex((p) => p.id === pageId)
    if (index !== -1) {
      this.pageStack.splice(index, 1)
      this.lifecycleCallbacks.delete(pageId)
    }
  }

  /**
   * Clear all pages
   */
  clear(): void {
    this.pageStack = []
    this.lifecycleCallbacks.clear()
    cancelAnimations(this.currentAnimations)
    this.currentAnimations = []
    this.isAnimating = false
  }
}

// Singleton instance for convenience
let defaultController: TransitionController | null = null

/**
 * Get or create the default transition controller
 */
export function getTransitionController(
  config?: TransitionGlobalConfig
): TransitionController {
  if (!defaultController) {
    defaultController = new TransitionController(config)
  } else if (config) {
    defaultController.configure(config)
  }
  return defaultController
}

/**
 * Create a new transition controller
 */
export function createTransitionController(
  config?: TransitionGlobalConfig
): TransitionController {
  return new TransitionController(config)
}
