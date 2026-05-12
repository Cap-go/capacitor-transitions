import { describe, expect, it, vi } from 'vitest';

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
