/**
 * Cap Router Outlet
 * A web component that manages page transitions
 * Works with any framework's router
 */

import {
  TransitionController,
  createTransitionController,
} from '../core/transition-controller'
import type {
  TransitionConfig,
  TransitionGlobalConfig,
  TransitionDirection,
  PageState,
} from '../core/types'

export interface CapRouterOutletOptions extends TransitionGlobalConfig {
  /** Keep pages in DOM after navigating away */
  keepInDom?: boolean
  /** Maximum cached pages */
  maxCached?: number
}

/**
 * Custom element for managing page transitions
 * Usage: <cap-router-outlet></cap-router-outlet>
 */
export class CapRouterOutlet extends HTMLElement {
  private controller: TransitionController
  private options: CapRouterOutletOptions
  private observer: MutationObserver | null = null
  private pendingPage: HTMLElement | null = null

  static get observedAttributes() {
    return ['platform', 'duration', 'keep-in-dom', 'max-cached']
  }

  constructor() {
    super()

    this.options = {
      keepInDom: true,
      maxCached: 10,
    }

    this.controller = createTransitionController()

    // Set up styles
    this.style.display = 'block'
    this.style.position = 'relative'
    this.style.width = '100%'
    this.style.height = '100%'
    this.style.overflow = 'hidden'
  }

  connectedCallback() {
    // Observe child changes to detect page additions
    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations)
    })

    this.observer.observe(this, {
      childList: true,
      subtree: false,
    })

    // Initialize with existing children
    const children = Array.from(this.children) as HTMLElement[]
    if (children.length > 0) {
      this.initializeFirstPage(children[children.length - 1])
    }
  }

  disconnectedCallback() {
    this.observer?.disconnect()
    this.controller.clear()
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    switch (name) {
      case 'platform':
        this.controller.configure({ platform: newValue as 'ios' | 'android' | 'auto' })
        break
      case 'duration':
        this.controller.configure({ duration: parseInt(newValue, 10) })
        break
      case 'keep-in-dom':
        this.options.keepInDom = newValue !== 'false'
        break
      case 'max-cached':
        this.options.maxCached = parseInt(newValue, 10)
        break
    }
  }

  /**
   * Handle DOM mutations (child additions/removals)
   */
  private handleMutations(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement && node !== this.pendingPage) {
          // New page added - trigger transition
          this.handleNewPage(node)
        }
      }
    }
  }

  /**
   * Initialize the first page without animation
   */
  private initializeFirstPage(page: HTMLElement) {
    page.style.position = 'relative'
    page.style.width = '100%'
    page.style.height = '100%'

    const state = this.controller.createPageState(page)
    state.isActive = true

    // Add to controller stack manually
    ;(this.controller as unknown as { pageStack: PageState[] }).pageStack.push(state)
  }

  /**
   * Handle a new page being added
   */
  private async handleNewPage(page: HTMLElement) {
    // Determine direction from data attribute or default to forward
    const direction = (page.dataset.direction as TransitionDirection) || 'forward'

    // Set up the page element
    page.style.position = 'absolute'
    page.style.top = '0'
    page.style.left = '0'
    page.style.width = '100%'
    page.style.height = '100%'

    this.pendingPage = page

    try {
      await this.controller.navigate(page, { direction })
    } finally {
      this.pendingPage = null
    }

    // Clean up old pages if not keeping in DOM
    if (!this.options.keepInDom) {
      this.cleanupOldPages()
    } else {
      this.enforceCacheLimit()
    }
  }

  /**
   * Clean up pages that are no longer needed
   */
  private cleanupOldPages() {
    const stack = this.controller.stack
    const children = Array.from(this.children) as HTMLElement[]

    for (const child of children) {
      const inStack = stack.some((s) => s.element === child)
      if (!inStack && !child.dataset.keepInDom) {
        child.remove()
      }
    }
  }

  /**
   * Enforce the cache limit
   */
  private enforceCacheLimit() {
    const stack = this.controller.stack
    const maxCached = this.options.maxCached || 10

    if (stack.length > maxCached) {
      // Remove oldest pages (keeping the newest maxCached)
      const toRemove = stack.slice(0, stack.length - maxCached)
      for (const page of toRemove) {
        if (!page.isActive) {
          page.element.remove()
          this.controller.removePage(page.id)
        }
      }
    }
  }

  /**
   * Programmatic navigation - push a new page
   */
  async push(page: HTMLElement, config: TransitionConfig = {}): Promise<void> {
    page.style.position = 'absolute'
    page.style.top = '0'
    page.style.left = '0'
    page.style.width = '100%'
    page.style.height = '100%'

    this.appendChild(page)
    await this.controller.push(page, config)
  }

  /**
   * Programmatic navigation - pop current page
   */
  async pop(config: TransitionConfig = {}): Promise<void> {
    const result = await this.controller.pop(config)

    if (result.success && !this.options.keepInDom) {
      // Remove the popped page from DOM
      const children = Array.from(this.children) as HTMLElement[]
      const lastChild = children[children.length - 1]
      if (lastChild) {
        lastChild.remove()
      }
    }
  }

  /**
   * Programmatic navigation - set root page
   */
  async setRoot(page: HTMLElement, config: TransitionConfig = {}): Promise<void> {
    const oldChildren = Array.from(this.children) as HTMLElement[]

    page.style.position = 'absolute'
    page.style.top = '0'
    page.style.left = '0'
    page.style.width = '100%'
    page.style.height = '100%'

    this.appendChild(page)
    await this.controller.setRoot(page, config)

    // Remove all old pages
    for (const child of oldChildren) {
      child.remove()
    }
  }

  /**
   * Get the current page stack length
   */
  get stackLength(): number {
    return this.controller.stack.length
  }

  /**
   * Check if we can go back
   */
  get canGoBack(): boolean {
    return this.controller.stack.length > 1
  }

  /**
   * Get the transition controller for advanced usage
   */
  getController(): TransitionController {
    return this.controller
  }
}

// Register the custom element
if (typeof customElements !== 'undefined' && !customElements.get('cap-router-outlet')) {
  customElements.define('cap-router-outlet', CapRouterOutlet)
}
