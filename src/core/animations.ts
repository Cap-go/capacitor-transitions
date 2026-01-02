/**
 * Core animation system using Web Animations API
 * Provides iOS and Android style page transitions
 */

import type {
  TransitionAnimationOptions,
  TransitionDirection,
  TransitionEasing,
  TransitionPlatform,
} from './types'

/** iOS easing curve - matches UIKit spring animation feel */
export const IOS_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)'

/** Android Material Design easing */
export const ANDROID_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

/** Default iOS transition duration */
export const IOS_DURATION = 540

/** Default Android transition duration */
export const ANDROID_DURATION = 300

/**
 * Resolve easing string to CSS value
 */
export function resolveEasing(easing: TransitionEasing): string {
  switch (easing) {
    case 'ios':
      return IOS_EASING
    case 'android':
      return ANDROID_EASING
    case 'linear':
      return 'linear'
    case 'ease':
      return 'ease'
    case 'ease-in':
      return 'ease-in'
    case 'ease-out':
      return 'ease-out'
    case 'ease-in-out':
      return 'ease-in-out'
    default:
      return easing // Custom cubic-bezier
  }
}

/**
 * Detect platform from user agent
 */
export function detectPlatform(): TransitionPlatform {
  if (typeof navigator === 'undefined') return 'ios'

  const ua = navigator.userAgent.toLowerCase()

  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'

  // Default to iOS for web/desktop - it's the more polished animation
  return 'ios'
}

/**
 * Get default duration for platform
 */
export function getDefaultDuration(platform: TransitionPlatform): number {
  const resolved = platform === 'auto' ? detectPlatform() : platform
  return resolved === 'ios' ? IOS_DURATION : ANDROID_DURATION
}

/**
 * Get default easing for platform
 */
export function getDefaultEasing(platform: TransitionPlatform): string {
  const resolved = platform === 'auto' ? detectPlatform() : platform
  return resolved === 'ios' ? IOS_EASING : ANDROID_EASING
}

/**
 * iOS-style horizontal slide transition
 * Forward: new page slides in from right
 * Back: old page slides out to right
 */
export function createIOSTransition(options: TransitionAnimationOptions): Animation[] {
  const { enteringEl, leavingEl, direction, duration, easing } = options
  const animations: Animation[] = []

  const isBack = direction === 'back'
  const isRoot = direction === 'root'

  // Ensure elements are positioned for animation
  enteringEl.style.position = 'absolute'
  enteringEl.style.top = '0'
  enteringEl.style.left = '0'
  enteringEl.style.width = '100%'
  enteringEl.style.height = '100%'

  if (isRoot) {
    // Root transition - fade in new page, no animation on old
    const enterAnimation = enteringEl.animate(
      [
        { opacity: 0 },
        { opacity: 1 },
      ],
      {
        duration,
        easing,
        fill: 'forwards',
      }
    )
    animations.push(enterAnimation)
  } else if (isBack) {
    // Back navigation - entering page comes from left, leaving slides out to right
    const enterAnimation = enteringEl.animate(
      [
        { transform: 'translateX(-30%)', opacity: 0.8 },
        { transform: 'translateX(0%)', opacity: 1 },
      ],
      {
        duration,
        easing,
        fill: 'forwards',
      }
    )
    animations.push(enterAnimation)

    if (leavingEl) {
      leavingEl.style.position = 'absolute'
      leavingEl.style.top = '0'
      leavingEl.style.left = '0'
      leavingEl.style.width = '100%'
      leavingEl.style.height = '100%'

      const leaveAnimation = leavingEl.animate(
        [
          { transform: 'translateX(0%)', opacity: 1 },
          { transform: 'translateX(100%)', opacity: 1 },
        ],
        {
          duration,
          easing,
          fill: 'forwards',
        }
      )
      animations.push(leaveAnimation)
    }
  } else {
    // Forward navigation - entering page comes from right, leaving slides out to left
    const enterAnimation = enteringEl.animate(
      [
        { transform: 'translateX(100%)', opacity: 1 },
        { transform: 'translateX(0%)', opacity: 1 },
      ],
      {
        duration,
        easing,
        fill: 'forwards',
      }
    )
    animations.push(enterAnimation)

    if (leavingEl) {
      leavingEl.style.position = 'absolute'
      leavingEl.style.top = '0'
      leavingEl.style.left = '0'
      leavingEl.style.width = '100%'
      leavingEl.style.height = '100%'

      const leaveAnimation = leavingEl.animate(
        [
          { transform: 'translateX(0%)', opacity: 1 },
          { transform: 'translateX(-30%)', opacity: 0.8 },
        ],
        {
          duration,
          easing,
          fill: 'forwards',
        }
      )
      animations.push(leaveAnimation)
    }
  }

  return animations
}

/**
 * Android-style vertical slide transition
 * Forward: new page slides up from bottom
 * Back: old page slides down to bottom
 */
export function createAndroidTransition(options: TransitionAnimationOptions): Animation[] {
  const { enteringEl, leavingEl, direction, duration, easing } = options
  const animations: Animation[] = []

  const isBack = direction === 'back'
  const isRoot = direction === 'root'

  // Ensure elements are positioned for animation
  enteringEl.style.position = 'absolute'
  enteringEl.style.top = '0'
  enteringEl.style.left = '0'
  enteringEl.style.width = '100%'
  enteringEl.style.height = '100%'

  if (isRoot) {
    // Root transition - fade in
    const enterAnimation = enteringEl.animate(
      [
        { opacity: 0, transform: 'scale(0.95)' },
        { opacity: 1, transform: 'scale(1)' },
      ],
      {
        duration,
        easing,
        fill: 'forwards',
      }
    )
    animations.push(enterAnimation)
  } else if (isBack) {
    // Back - entering fades in, leaving slides down
    const enterAnimation = enteringEl.animate(
      [
        { opacity: 0.8, transform: 'scale(0.95)' },
        { opacity: 1, transform: 'scale(1)' },
      ],
      {
        duration,
        easing,
        fill: 'forwards',
      }
    )
    animations.push(enterAnimation)

    if (leavingEl) {
      leavingEl.style.position = 'absolute'
      leavingEl.style.top = '0'
      leavingEl.style.left = '0'
      leavingEl.style.width = '100%'
      leavingEl.style.height = '100%'

      const leaveAnimation = leavingEl.animate(
        [
          { transform: 'translateY(0%)', opacity: 1 },
          { transform: 'translateY(100%)', opacity: 1 },
        ],
        {
          duration,
          easing,
          fill: 'forwards',
        }
      )
      animations.push(leaveAnimation)
    }
  } else {
    // Forward - entering slides up, leaving fades/scales down
    const enterAnimation = enteringEl.animate(
      [
        { transform: 'translateY(100%)', opacity: 1 },
        { transform: 'translateY(0%)', opacity: 1 },
      ],
      {
        duration,
        easing,
        fill: 'forwards',
      }
    )
    animations.push(enterAnimation)

    if (leavingEl) {
      leavingEl.style.position = 'absolute'
      leavingEl.style.top = '0'
      leavingEl.style.left = '0'
      leavingEl.style.width = '100%'
      leavingEl.style.height = '100%'

      const leaveAnimation = leavingEl.animate(
        [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0.8, transform: 'scale(0.95)' },
        ],
        {
          duration,
          easing,
          fill: 'forwards',
        }
      )
      animations.push(leaveAnimation)
    }
  }

  return animations
}

/**
 * No animation - instant transition
 */
export function createNoneTransition(options: TransitionAnimationOptions): Animation[] {
  const { enteringEl, leavingEl } = options

  enteringEl.style.opacity = '1'
  enteringEl.style.transform = 'none'

  if (leavingEl) {
    leavingEl.style.opacity = '0'
    leavingEl.style.transform = 'none'
  }

  return []
}

/**
 * Create platform-appropriate transition
 */
export function createTransition(
  options: TransitionAnimationOptions,
  platform: TransitionPlatform = 'auto'
): Animation[] {
  if (options.direction === 'none') {
    return createNoneTransition(options)
  }

  const resolved = platform === 'auto' ? detectPlatform() : platform

  if (resolved === 'android') {
    return createAndroidTransition(options)
  }

  return createIOSTransition(options)
}

/**
 * Wait for all animations to complete
 */
export async function waitForAnimations(animations: Animation[]): Promise<void> {
  if (animations.length === 0) return

  await Promise.all(
    animations.map(
      (anim) =>
        new Promise<void>((resolve) => {
          anim.onfinish = () => resolve()
          anim.oncancel = () => resolve()
        })
    )
  )
}

/**
 * Cancel all animations
 */
export function cancelAnimations(animations: Animation[]): void {
  animations.forEach((anim) => anim.cancel())
}

/**
 * Create header-specific animation
 * Headers can have different animations (e.g., title changes, back button appears)
 */
export function createHeaderTransition(
  options: TransitionAnimationOptions & {
    enteringHeader?: HTMLElement
    leavingHeader?: HTMLElement
  }
): Animation[] {
  const { enteringHeader, leavingHeader, direction, duration, easing } = options
  const animations: Animation[] = []

  const isBack = direction === 'back'

  if (enteringHeader) {
    if (isBack) {
      // Header fades in from left
      const enterAnim = enteringHeader.animate(
        [
          { opacity: 0, transform: 'translateX(-20px)' },
          { opacity: 1, transform: 'translateX(0)' },
        ],
        { duration: duration * 0.7, easing, fill: 'forwards' }
      )
      animations.push(enterAnim)
    } else {
      // Header fades in from right
      const enterAnim = enteringHeader.animate(
        [
          { opacity: 0, transform: 'translateX(20px)' },
          { opacity: 1, transform: 'translateX(0)' },
        ],
        { duration: duration * 0.7, easing, fill: 'forwards' }
      )
      animations.push(enterAnim)
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
        { duration: duration * 0.7, easing, fill: 'forwards' }
      )
      animations.push(leaveAnim)
    } else {
      // Header fades out to left
      const leaveAnim = leavingHeader.animate(
        [
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: 'translateX(-20px)' },
        ],
        { duration: duration * 0.7, easing, fill: 'forwards' }
      )
      animations.push(leaveAnim)
    }
  }

  return animations
}

/**
 * Create footer-specific animation
 * Footers typically stay in place or fade
 */
export function createFooterTransition(
  options: TransitionAnimationOptions & {
    enteringFooter?: HTMLElement
    leavingFooter?: HTMLElement
  }
): Animation[] {
  const { enteringFooter, leavingFooter, duration, easing } = options
  const animations: Animation[] = []

  // Footers typically just fade in/out if they change
  if (enteringFooter && leavingFooter && enteringFooter !== leavingFooter) {
    const enterAnim = enteringFooter.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: duration * 0.5, easing, fill: 'forwards' }
    )
    animations.push(enterAnim)

    const leaveAnim = leavingFooter.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: duration * 0.5, easing, fill: 'forwards' }
    )
    animations.push(leaveAnim)
  }

  return animations
}
