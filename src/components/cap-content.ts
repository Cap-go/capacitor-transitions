/**
 * Cap Content
 * Main scrollable content area that participates in page transitions
 * No styling opinions - just transition awareness and scroll management
 */

/**
 * Custom element for main content
 * Usage: <cap-content>Your content here</cap-content>
 */
export class CapContent extends HTMLElement {
  private _scrollPosition: { x: number; y: number } = { x: 0, y: 0 }

  static get observedAttributes() {
    return ['fullscreen', 'scroll-x', 'scroll-y']
  }

  constructor() {
    super()

    // Mark for transition controller
    this.setAttribute('data-cap-content', '')

    // Set up minimal required styles
    this.style.display = 'block'
    this.style.position = 'relative'
    this.style.flex = '1'
    this.style.overflow = 'auto'
    this.style.overscrollBehavior = 'contain'

    // For view transitions API
    this.style.viewTransitionName = 'cap-content'

    // iOS-style momentum scrolling
    // @ts-expect-error vendor prefix
    this.style.webkitOverflowScrolling = 'touch'
  }

  connectedCallback() {
    // Ensure slot assignment if inside cap-page
    if (this.parentElement?.tagName === 'CAP-PAGE' && !this.hasAttribute('slot')) {
      this.setAttribute('slot', 'content')
    }

    // Track scroll position
    this.addEventListener('scroll', this.handleScroll.bind(this), { passive: true })
  }

  disconnectedCallback() {
    this.removeEventListener('scroll', this.handleScroll.bind(this))
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    switch (name) {
      case 'fullscreen':
        // Mark for fullscreen content (scrolls behind header)
        this.dataset.fullscreen = newValue !== null ? 'true' : 'false'
        break
      case 'scroll-x':
        this.style.overflowX = newValue === 'false' ? 'hidden' : 'auto'
        break
      case 'scroll-y':
        this.style.overflowY = newValue === 'false' ? 'hidden' : 'auto'
        break
    }
  }

  /**
   * Handle scroll events
   */
  private handleScroll() {
    this._scrollPosition = {
      x: this.scrollLeft,
      y: this.scrollTop,
    }

    // Dispatch scroll event for parent components
    this.dispatchEvent(new CustomEvent('cap-scroll', {
      bubbles: true,
      detail: this._scrollPosition,
    }))
  }

  /**
   * Get current scroll position
   */
  get scrollPosition(): { x: number; y: number } {
    return { ...this._scrollPosition }
  }

  /**
   * Save current scroll position
   */
  saveScrollPosition(): { x: number; y: number } {
    this._scrollPosition = {
      x: this.scrollLeft,
      y: this.scrollTop,
    }
    return { ...this._scrollPosition }
  }

  /**
   * Restore scroll position
   */
  restoreScrollPosition(position?: { x: number; y: number }): void {
    const pos = position || this._scrollPosition
    this.scrollLeft = pos.x
    this.scrollTop = pos.y
  }

  /**
   * Scroll to top
   */
  scrollToTop(smooth = true): void {
    this.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'instant',
    })
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom(smooth = true): void {
    this.scrollTo({
      top: this.scrollHeight,
      behavior: smooth ? 'smooth' : 'instant',
    })
  }

  /**
   * Scroll to element
   */
  scrollToElement(element: HTMLElement, smooth = true): void {
    element.scrollIntoView({
      behavior: smooth ? 'smooth' : 'instant',
      block: 'start',
    })
  }
}

// Register the custom element
if (typeof customElements !== 'undefined' && !customElements.get('cap-content')) {
  customElements.define('cap-content', CapContent)
}
