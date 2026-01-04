/**
 * Cap Page
 * A container for page content with header, content, and footer slots
 * Integrates with cap-router-outlet for transitions
 */

import type { TransitionLifecycle, NavigationEvent } from '../core/types';

export interface CapPageOptions {
  /** Unique key for this page */
  key?: string;
  /** Cache scroll position */
  cacheScroll?: boolean;
}

/**
 * Custom element for a page container
 * Usage:
 * <cap-page>
 *   <cap-header slot="header">...</cap-header>
 *   <cap-content slot="content">...</cap-content>
 *   <cap-footer slot="footer">...</cap-footer>
 * </cap-page>
 */
export class CapPage extends HTMLElement {
  private _lifecycle: TransitionLifecycle = {};
  private _isActive = false;

  static get observedAttributes(): string[] {
    return ['key', 'cache-scroll'];
  }

  constructor() {
    super();

    // Create shadow DOM with slots
    const shadow = this.attachShadow({ mode: 'open' });

    shadow.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
        }

        .header-container {
          flex-shrink: 0;
          position: relative;
          z-index: 10;
        }

        .content-container {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        .footer-container {
          flex-shrink: 0;
          position: relative;
          z-index: 10;
        }

        ::slotted([slot="header"]),
        ::slotted([data-cap-header]) {
          display: block;
        }

        ::slotted([slot="content"]),
        ::slotted([data-cap-content]) {
          display: block;
          height: 100%;
          overflow: auto;
        }

        ::slotted([slot="footer"]),
        ::slotted([data-cap-footer]) {
          display: block;
        }
      </style>

      <div class="header-container" part="header">
        <slot name="header"></slot>
      </div>

      <div class="content-container" part="content">
        <slot name="content"></slot>
        <slot></slot>
      </div>

      <div class="footer-container" part="footer">
        <slot name="footer"></slot>
      </div>
    `;
  }

  connectedCallback(): void {
    // Mark elements for the transition controller to find
    this.markTransitionElements();

    // Dispatch connected event
    this.dispatchEvent(
      new CustomEvent('cap-page-connected', {
        bubbles: true,
        composed: true,
        detail: { page: this },
      }),
    );
  }

  disconnectedCallback(): void {
    this.dispatchEvent(
      new CustomEvent('cap-page-disconnected', {
        bubbles: true,
        composed: true,
        detail: { page: this },
      }),
    );
  }

  /**
   * Mark child elements for transition controller
   */
  private markTransitionElements() {
    // Find and mark header
    const header = this.querySelector('[slot="header"]');
    if (header) {
      header.setAttribute('data-cap-header', '');
    }

    // Find and mark content
    const content = this.querySelector('[slot="content"]');
    if (content) {
      content.setAttribute('data-cap-content', '');
    }

    // Find and mark footer
    const footer = this.querySelector('[slot="footer"]');
    if (footer) {
      footer.setAttribute('data-cap-footer', '');
    }
  }

  /**
   * Set lifecycle callbacks
   */
  set lifecycle(callbacks: TransitionLifecycle) {
    this._lifecycle = callbacks;
  }

  get lifecycle(): TransitionLifecycle {
    return this._lifecycle;
  }

  /**
   * Check if page is active
   */
  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * Called when page will enter view
   */
  async willEnter(event: NavigationEvent): Promise<void> {
    await this._lifecycle.onWillEnter?.(event);
    this.dispatchEvent(
      new CustomEvent('cap-will-enter', {
        bubbles: true,
        detail: event,
      }),
    );
  }

  /**
   * Called when page has entered view
   */
  async didEnter(event: NavigationEvent): Promise<void> {
    this._isActive = true;
    await this._lifecycle.onDidEnter?.(event);
    this.dispatchEvent(
      new CustomEvent('cap-did-enter', {
        bubbles: true,
        detail: event,
      }),
    );
  }

  /**
   * Called when page will leave view
   */
  async willLeave(event: NavigationEvent): Promise<void> {
    await this._lifecycle.onWillLeave?.(event);
    this.dispatchEvent(
      new CustomEvent('cap-will-leave', {
        bubbles: true,
        detail: event,
      }),
    );
  }

  /**
   * Called when page has left view
   */
  async didLeave(event: NavigationEvent): Promise<void> {
    this._isActive = false;
    await this._lifecycle.onDidLeave?.(event);
    this.dispatchEvent(
      new CustomEvent('cap-did-leave', {
        bubbles: true,
        detail: event,
      }),
    );
  }

  /**
   * Get the header element
   */
  get headerElement(): HTMLElement | null {
    return this.querySelector('[slot="header"], [data-cap-header]');
  }

  /**
   * Get the content element
   */
  get contentElement(): HTMLElement | null {
    return this.querySelector('[slot="content"], [data-cap-content]');
  }

  /**
   * Get the footer element
   */
  get footerElement(): HTMLElement | null {
    return this.querySelector('[slot="footer"], [data-cap-footer]');
  }

  /**
   * Save scroll position
   */
  saveScrollPosition(): { x: number; y: number } | null {
    const content = this.contentElement;
    if (!content) return null;

    return {
      x: content.scrollLeft,
      y: content.scrollTop,
    };
  }

  /**
   * Restore scroll position
   */
  restoreScrollPosition(position: { x: number; y: number }): void {
    const content = this.contentElement;
    if (!content) return;

    content.scrollLeft = position.x;
    content.scrollTop = position.y;
  }
}

// Register the custom element
if (typeof customElements !== 'undefined' && !customElements.get('cap-page')) {
  customElements.define('cap-page', CapPage);
}
