import { afterEach, describe, expect, it, vi } from 'vitest';

import { setOutletDirectionIntent, setOutletNavigationIntent } from './navigation';
import { createTransitionController } from './transition-controller';

function createMockAnimation(): Animation {
  return {
    cancel: vi.fn(),
    effect: {
      getTiming: () => ({ duration: 0 }),
    },
    finished: Promise.resolve(),
    pause: vi.fn(),
    play: vi.fn(),
    currentTime: 0,
    playbackRate: 1,
  } as unknown as Animation;
}

function createMockElement() {
  const style = {
    removeProperty: vi.fn(),
  } as unknown as CSSStyleDeclaration;

  return {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    ownerDocument: {
      dir: 'ltr',
      documentElement: {
        dir: 'ltr',
      },
    },
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    remove: vi.fn(),
    style,
    animate: vi.fn(() => createMockAnimation()),
  } as unknown as HTMLElement & {
    animate: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
}

afterEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});
describe('navigation intents', () => {
  it('stores and clears router navigation intent on outlets', () => {
    const outlet = { dataset: {} } as HTMLElement;

    setOutletNavigationIntent(outlet, 'root', 'forward');

    expect(outlet.dataset.navigationAction).toBe('root');
    expect(outlet.dataset.direction).toBe('forward');

    setOutletDirectionIntent(outlet, 'back');

    expect(outlet.dataset.navigationAction).toBeUndefined();
    expect(outlet.dataset.direction).toBe('back');
  });

  it('can reset the stack while using the forward animation', async () => {
    const controller = createTransitionController({ platform: 'ios' });
    const firstPage = createMockElement();
    const secondPage = createMockElement();

    await controller.setRoot(firstPage, { duration: 0 });
    await controller.setRoot(secondPage, { direction: 'forward', duration: 0 });

    expect(controller.stack).toHaveLength(1);
    expect(controller.currentPage?.element).toBe(secondPage);
    expect(firstPage.remove).not.toHaveBeenCalled();
    expect(secondPage.animate).toHaveBeenCalled();
    expect(secondPage.animate.mock.calls[0][0]).toEqual([
      { transform: 'translate3d(99.5%, 0, 0)' },
      { transform: 'translate3d(0%, 0, 0)' },
    ]);
  });
});

describe('swipe-back gesture responsiveness', () => {
  it('applies the first accepted swipe step without waiting for animation frame batching', async () => {
    class TestHTMLElement {
      ownerDocument = {
        dir: 'ltr',
        documentElement: { dir: 'ltr' },
        defaultView: {
          cancelAnimationFrame: vi.fn(),
          requestAnimationFrame: vi.fn(),
        },
      };
      style = {};
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
    }

    vi.stubGlobal('HTMLElement', TestHTMLElement);
    vi.stubGlobal('customElements', { define: vi.fn(), get: vi.fn(() => true) });
    vi.stubGlobal(
      'getComputedStyle',
      vi.fn(() => ({ direction: 'ltr' })),
    );

    const { CapRouterOutlet } = await import('../components/cap-router-outlet');
    const outlet = new CapRouterOutlet() as unknown as TestHTMLElement & {
      controller: {
        beginInteractiveBack: ReturnType<typeof vi.fn>;
        stack: unknown[];
        stepInteractiveBack: ReturnType<typeof vi.fn>;
      };
      handleSwipeGesturePointerMove: (event: PointerEvent) => void;
      pendingPage: HTMLElement | null;
      swipeBackDepth: number;
      swipeGesturePointer: {
        pointerId: number;
        startX: number;
        startY: number;
        currentX: number;
        currentY: number;
        width: number;
        startTime: number;
        dragging: boolean;
        transitionStarted: boolean;
      };
    };
    const requestAnimationFrame = outlet.ownerDocument.defaultView?.requestAnimationFrame as ReturnType<typeof vi.fn>;
    outlet.controller = {
      beginInteractiveBack: vi.fn(() => true),
      stack: [{}, {}],
      stepInteractiveBack: vi.fn(),
    };
    outlet.pendingPage = null;
    outlet.swipeBackDepth = 1;
    outlet.swipeGesturePointer = {
      pointerId: 1,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      width: 100,
      startTime: 0,
      dragging: false,
      transitionStarted: false,
    };

    outlet.handleSwipeGesturePointerMove({
      cancelable: true,
      clientX: 20,
      clientY: 0,
      pointerId: 1,
      preventDefault: vi.fn(),
    } as unknown as PointerEvent);

    expect(outlet.controller.beginInteractiveBack).toHaveBeenCalledWith({ direction: 'back' });
    expect(outlet.controller.stepInteractiveBack).toHaveBeenCalledWith(0.2);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
});
