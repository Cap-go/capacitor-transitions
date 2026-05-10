/**
 * Core animation system using Web Animations API
 * Provides iOS and Android style page transitions
 */

import type { TransitionAnimationOptions, TransitionEasing, TransitionPlatform, ResolvedPlatform } from './types';

/** iOS easing curve - matches UIKit spring animation feel */
export const IOS_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';

/** Android Material Design forward easing */
export const ANDROID_EASING = 'cubic-bezier(0.36, 0.66, 0.04, 1)';

/** Android Material Design back easing */
export const ANDROID_BACK_EASING = 'cubic-bezier(0.47, 0, 0.745, 0.715)';

/** Default iOS transition duration */
export const IOS_DURATION = 540;

/** Default Android forward transition duration */
export const ANDROID_DURATION = 280;

/** Default Android back transition duration */
export const ANDROID_BACK_DURATION = 200;

const IOS_OFF_OPACITY = 0.8;
const IOS_CENTER = '0%';
const IOS_OFF_RIGHT = '99.5%';
const IOS_OFF_LEFT = '-33%';
const IOS_OFF_RIGHT_RTL = '-99.5%';
const IOS_OFF_LEFT_RTL = '33%';
const MD_OFF_BOTTOM = '40px';
const MD_CENTER = '0px';

/**
 * Resolve easing string to CSS value
 */
export function resolveEasing(easing: TransitionEasing): string {
  switch (easing) {
    case 'ios':
      return IOS_EASING;
    case 'android':
      return ANDROID_EASING;
    case 'linear':
      return 'linear';
    case 'ease':
      return 'ease';
    case 'ease-in':
      return 'ease-in';
    case 'ease-out':
      return 'ease-out';
    case 'ease-in-out':
      return 'ease-in-out';
    default:
      return easing; // Custom cubic-bezier
  }
}

/**
 * Detect platform from user agent
 */
export function detectPlatform(): ResolvedPlatform {
  if (typeof navigator === 'undefined') return 'ios';

  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';

  // Default to iOS for web/desktop - it's the more polished animation
  return 'ios';
}

/**
 * Get default duration for platform
 */
export function getDefaultDuration(
  platform: TransitionPlatform,
  direction: 'forward' | 'back' | 'root' | 'none' = 'forward',
): number {
  const resolved = platform === 'auto' ? detectPlatform() : platform;
  if (resolved === 'ios') {
    return IOS_DURATION;
  }
  return direction === 'back' ? ANDROID_BACK_DURATION : ANDROID_DURATION;
}

/**
 * Get default easing for platform
 */
export function getDefaultEasing(
  platform: TransitionPlatform,
  direction: 'forward' | 'back' | 'root' | 'none' = 'forward',
): string {
  const resolved = platform === 'auto' ? detectPlatform() : platform;
  if (resolved === 'ios') {
    return IOS_EASING;
  }
  return direction === 'back' ? ANDROID_BACK_EASING : ANDROID_EASING;
}

function getDocumentDirection(element: HTMLElement): 'ltr' | 'rtl' {
  const doc = element.ownerDocument;
  return doc.dir === 'rtl' || doc.documentElement.dir === 'rtl' ? 'rtl' : 'ltr';
}

function preparePageLayer(element: HTMLElement, zIndex: string): void {
  element.style.display = '';
  element.style.visibility = 'visible';
  element.style.position = 'absolute';
  element.style.top = '0';
  element.style.left = '0';
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.zIndex = zIndex;
  element.style.pointerEvents = 'none';
  element.style.willChange = 'transform, opacity';
  element.style.backfaceVisibility = 'hidden';
  element.style.transformStyle = 'preserve-3d';
}

function createAnimation(element: HTMLElement, keyframes: Keyframe[], duration: number, easing: string): Animation {
  return element.animate(keyframes, {
    duration,
    easing,
    fill: 'both',
  });
}

function resolvePageChrome(element: HTMLElement): HTMLElement[] {
  return Array.from(
    element.querySelectorAll<HTMLElement>(
      '[data-cap-header], .cap-header, cap-header, [slot="header"], [data-cap-footer], .cap-footer, cap-footer, [slot="footer"]',
    ),
  );
}

function invertTranslateOffset(offset: string): string {
  if (offset === IOS_CENTER) {
    return IOS_CENTER;
  }

  return offset.startsWith('-') ? offset.slice(1) : `-${offset}`;
}

function createPinnedChromeAnimations(
  elements: HTMLElement[],
  fromTransform: string,
  toTransform: string,
  duration: number,
  easing: string,
): Animation[] {
  return elements.map((element) => {
    element.style.willChange = 'transform';
    element.style.backfaceVisibility = 'hidden';

    return createAnimation(element, [{ transform: fromTransform }, { transform: toTransform }], duration, easing);
  });
}

/**
 * iOS-style horizontal slide transition
 * Forward: new page slides in from right
 * Back: old page slides out to right
 */
export function createIOSTransition(options: TransitionAnimationOptions): Animation[] {
  const { enteringEl, leavingEl, direction, duration, easing } = options;
  const animations: Animation[] = [];

  const isBack = direction === 'back';
  const isRoot = direction === 'root';
  const isRTL = getDocumentDirection(enteringEl) === 'rtl';
  const offRight = isRTL ? IOS_OFF_RIGHT_RTL : IOS_OFF_RIGHT;
  const offLeft = isRTL ? IOS_OFF_LEFT_RTL : IOS_OFF_LEFT;
  const chromeOffRight = invertTranslateOffset(offRight);
  const chromeOffLeft = invertTranslateOffset(offLeft);
  const leadingEdgeShadow = isRTL ? '8px 0 24px rgba(0, 0, 0, 0.18)' : '-8px 0 24px rgba(0, 0, 0, 0.18)';

  preparePageLayer(enteringEl, isBack ? '99' : '101');
  if (leavingEl) {
    preparePageLayer(leavingEl, '100');
  }

  if (isRoot) {
    animations.push(
      createAnimation(
        enteringEl,
        [
          { opacity: 0.01, transform: 'translate3d(0, 0, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        ],
        duration,
        easing,
      ),
    );

    if (leavingEl) {
      animations.push(
        createAnimation(
          leavingEl,
          [
            { opacity: 1, transform: 'translate3d(0, 0, 0)' },
            { opacity: 0, transform: 'translate3d(0, 0, 0)' },
          ],
          Math.min(duration, 240),
          easing,
        ),
      );
    }
  } else if (isBack) {
    // Matches Ionic iOS: previous page sits behind at one-third offset and brightens as the top page exits.
    animations.push(
      ...createPinnedChromeAnimations(
        resolvePageChrome(enteringEl),
        `translate3d(${chromeOffLeft}, 0, 0)`,
        `translate3d(${IOS_CENTER}, 0, 0)`,
        duration,
        easing,
      ),
    );
    animations.push(
      createAnimation(
        enteringEl,
        [
          { transform: `translate3d(${offLeft}, 0, 0)`, opacity: IOS_OFF_OPACITY },
          { transform: `translate3d(${IOS_CENTER}, 0, 0)`, opacity: 1 },
        ],
        duration,
        easing,
      ),
    );

    if (leavingEl) {
      leavingEl.style.boxShadow = leadingEdgeShadow;
      animations.push(
        ...createPinnedChromeAnimations(
          resolvePageChrome(leavingEl),
          `translate3d(${IOS_CENTER}, 0, 0)`,
          `translate3d(${chromeOffRight}, 0, 0)`,
          duration,
          easing,
        ),
      );
      animations.push(
        createAnimation(
          leavingEl,
          [
            { transform: `translate3d(${IOS_CENTER}, 0, 0)`, opacity: 1 },
            { transform: `translate3d(${offRight}, 0, 0)`, opacity: 1 },
          ],
          duration,
          easing,
        ),
      );
    }
  } else {
    enteringEl.style.boxShadow = leadingEdgeShadow;
    animations.push(
      ...createPinnedChromeAnimations(
        resolvePageChrome(enteringEl),
        `translate3d(${chromeOffRight}, 0, 0)`,
        `translate3d(${IOS_CENTER}, 0, 0)`,
        duration,
        easing,
      ),
    );
    animations.push(
      createAnimation(
        enteringEl,
        [
          { transform: `translate3d(${offRight}, 0, 0)`, opacity: 1 },
          { transform: `translate3d(${IOS_CENTER}, 0, 0)`, opacity: 1 },
        ],
        duration,
        easing,
      ),
    );

    if (leavingEl) {
      animations.push(
        ...createPinnedChromeAnimations(
          resolvePageChrome(leavingEl),
          `translate3d(${IOS_CENTER}, 0, 0)`,
          `translate3d(${chromeOffLeft}, 0, 0)`,
          duration,
          easing,
        ),
      );
      animations.push(
        createAnimation(
          leavingEl,
          [
            { transform: `translate3d(${IOS_CENTER}, 0, 0)`, opacity: 1 },
            { transform: `translate3d(${offLeft}, 0, 0)`, opacity: IOS_OFF_OPACITY },
          ],
          duration,
          easing,
        ),
      );
    }
  }

  return animations;
}

/**
 * Android-style vertical slide transition
 * Forward: new page slides up from bottom
 * Back: old page slides down to bottom
 */
export function createAndroidTransition(options: TransitionAnimationOptions): Animation[] {
  const { enteringEl, leavingEl, direction, duration, easing } = options;
  const animations: Animation[] = [];

  const isBack = direction === 'back';
  const isRoot = direction === 'root';

  preparePageLayer(enteringEl, isBack ? '99' : '101');
  if (leavingEl) {
    preparePageLayer(leavingEl, '100');
  }

  if (isRoot) {
    animations.push(
      createAnimation(
        enteringEl,
        [
          { opacity: 0.01, transform: `translate3d(0, ${MD_OFF_BOTTOM}, 0)` },
          { opacity: 1, transform: `translate3d(0, ${MD_CENTER}, 0)` },
        ],
        duration,
        easing,
      ),
    );

    if (leavingEl) {
      animations.push(
        createAnimation(
          leavingEl,
          [
            { opacity: 1, transform: `translate3d(0, ${MD_CENTER}, 0)` },
            { opacity: 0, transform: `translate3d(0, ${MD_CENTER}, 0)` },
          ],
          Math.min(duration, ANDROID_BACK_DURATION),
          ANDROID_BACK_EASING,
        ),
      );
    }
  } else if (isBack) {
    enteringEl.style.opacity = '1';
    enteringEl.style.transform = `translate3d(0, ${MD_CENTER}, 0)`;

    if (leavingEl) {
      animations.push(
        createAnimation(
          leavingEl,
          [
            { opacity: 1, transform: `translate3d(0, ${MD_CENTER}, 0)` },
            { opacity: 0, transform: `translate3d(0, ${MD_OFF_BOTTOM}, 0)` },
          ],
          duration,
          easing,
        ),
      );
    }
  } else {
    animations.push(
      createAnimation(
        enteringEl,
        [
          { opacity: 0.01, transform: `translate3d(0, ${MD_OFF_BOTTOM}, 0)` },
          { opacity: 1, transform: `translate3d(0, ${MD_CENTER}, 0)` },
        ],
        duration,
        easing,
      ),
    );

    if (leavingEl) {
      leavingEl.style.opacity = '1';
      leavingEl.style.transform = `translate3d(0, ${MD_CENTER}, 0)`;
    }
  }

  return animations;
}

/**
 * No animation - instant transition
 */
export function createNoneTransition(options: TransitionAnimationOptions): Animation[] {
  const { enteringEl, leavingEl } = options;

  enteringEl.style.opacity = '1';
  enteringEl.style.transform = 'none';

  if (leavingEl) {
    leavingEl.style.opacity = '0';
    leavingEl.style.transform = 'none';
  }

  return [];
}

/**
 * Create platform-appropriate transition
 */
export function createTransition(
  options: TransitionAnimationOptions,
  platform: TransitionPlatform = 'auto',
): Animation[] {
  if (options.direction === 'none') {
    return createNoneTransition(options);
  }

  const resolved = platform === 'auto' ? detectPlatform() : platform;

  if (resolved === 'android') {
    return createAndroidTransition(options);
  }

  return createIOSTransition(options);
}

/**
 * Wait for all animations to complete
 */
export async function waitForAnimations(animations: Animation[]): Promise<void> {
  if (animations.length === 0) return;

  await Promise.all(animations.map((anim) => anim.finished.catch(() => undefined)));
}

/**
 * Cancel all animations
 */
export function cancelAnimations(animations: Animation[]): void {
  animations.forEach((anim) => anim.cancel());
}

/**
 * Create header-specific animation
 * Headers can have different animations (e.g., title changes, back button appears)
 */
export function createHeaderTransition(
  options: TransitionAnimationOptions & {
    enteringHeader?: HTMLElement;
    leavingHeader?: HTMLElement;
  },
): Animation[] {
  const { enteringHeader, leavingHeader, direction, duration, easing } = options;
  const animations: Animation[] = [];

  const isBack = direction === 'back';

  if (enteringHeader) {
    if (isBack) {
      // Header fades in from left
      const enterAnim = enteringHeader.animate(
        [
          { opacity: 0, transform: 'translateX(-20px)' },
          { opacity: 1, transform: 'translateX(0)' },
        ],
        { duration: duration * 0.7, easing, fill: 'forwards' },
      );
      animations.push(enterAnim);
    } else {
      // Header fades in from right
      const enterAnim = enteringHeader.animate(
        [
          { opacity: 0, transform: 'translateX(20px)' },
          { opacity: 1, transform: 'translateX(0)' },
        ],
        { duration: duration * 0.7, easing, fill: 'forwards' },
      );
      animations.push(enterAnim);
    }
  }

  if (leavingHeader) {
    if (isBack) {
      // Header fades out to right
      const leaveAnim = leavingHeader.animate(
        [
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: 'translateX(20px)' },
        ],
        { duration: duration * 0.7, easing, fill: 'forwards' },
      );
      animations.push(leaveAnim);
    } else {
      // Header fades out to left
      const leaveAnim = leavingHeader.animate(
        [
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: 'translateX(-20px)' },
        ],
        { duration: duration * 0.7, easing, fill: 'forwards' },
      );
      animations.push(leaveAnim);
    }
  }

  return animations;
}

/**
 * Create footer-specific animation
 * Footers typically stay in place or fade
 */
export function createFooterTransition(
  options: TransitionAnimationOptions & {
    enteringFooter?: HTMLElement;
    leavingFooter?: HTMLElement;
  },
): Animation[] {
  const { enteringFooter, leavingFooter, duration, easing } = options;
  const animations: Animation[] = [];

  // Footers typically just fade in/out if they change
  if (enteringFooter && leavingFooter && enteringFooter !== leavingFooter) {
    const enterAnim = enteringFooter.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: duration * 0.5,
      easing,
      fill: 'forwards',
    });
    animations.push(enterAnim);

    const leaveAnim = leavingFooter.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: duration * 0.5,
      easing,
      fill: 'forwards',
    });
    animations.push(leaveAnim);
  }

  return animations;
}
