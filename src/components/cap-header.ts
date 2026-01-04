/**
 * Cap Header
 * A header container that participates in page transitions
 * No styling opinions - just transition awareness
 */

/**
 * Custom element for header content
 * Usage: <cap-header>Your header content</cap-header>
 */
export class CapHeader extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['translucent', 'collapse'];
  }

  constructor() {
    super();

    // Mark for transition controller
    this.setAttribute('data-cap-header', '');

    // Set up minimal required styles
    this.style.display = 'block';
    this.style.position = 'relative';
    this.style.zIndex = '10';

    // For view transitions API
    this.style.viewTransitionName = 'cap-header';
  }

  connectedCallback(): void {
    // Ensure slot assignment if inside cap-page
    if (this.parentElement?.tagName === 'CAP-PAGE' && !this.hasAttribute('slot')) {
      this.setAttribute('slot', 'header');
    }
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string): void {
    switch (name) {
      case 'translucent':
        // Mark for framework-specific handling
        this.dataset.translucent = newValue !== null ? 'true' : 'false';
        break;
      case 'collapse':
        // Mark for collapsible header behavior
        this.dataset.collapse = newValue;
        break;
    }
  }

  /**
   * Get the current height of the header
   */
  get height(): number {
    return this.offsetHeight;
  }
}

// Register the custom element
if (typeof customElements !== 'undefined' && !customElements.get('cap-header')) {
  customElements.define('cap-header', CapHeader);
}
