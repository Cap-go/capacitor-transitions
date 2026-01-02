/**
 * Cap Footer
 * A footer container that participates in page transitions
 * No styling opinions - just transition awareness
 */

/**
 * Custom element for footer content
 * Usage: <cap-footer>Your footer content</cap-footer>
 */
export class CapFooter extends HTMLElement {
  static get observedAttributes() {
    return ['translucent']
  }

  constructor() {
    super()

    // Mark for transition controller
    this.setAttribute('data-cap-footer', '')

    // Set up minimal required styles
    this.style.display = 'block'
    this.style.position = 'relative'
    this.style.zIndex = '10'

    // For view transitions API
    this.style.viewTransitionName = 'cap-footer'
  }

  connectedCallback() {
    // Ensure slot assignment if inside cap-page
    if (this.parentElement?.tagName === 'CAP-PAGE' && !this.hasAttribute('slot')) {
      this.setAttribute('slot', 'footer')
    }
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    switch (name) {
      case 'translucent':
        // Mark for framework-specific handling
        this.dataset.translucent = newValue !== null ? 'true' : 'false'
        break
    }
  }

  /**
   * Get the current height of the footer
   */
  get height(): number {
    return this.offsetHeight
  }
}

// Register the custom element
if (typeof customElements !== 'undefined' && !customElements.get('cap-footer')) {
  customElements.define('cap-footer', CapFooter)
}
