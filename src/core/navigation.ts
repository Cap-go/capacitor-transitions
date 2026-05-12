import type { NavigationAction, TransitionDirection } from './types';

export function getDefaultNavigationDirection(action: NavigationAction): TransitionDirection {
  return action;
}

export function setOutletDirectionIntent(outlet: Element, direction: TransitionDirection): void {
  const element = outlet as HTMLElement;
  element.dataset.direction = direction;
  delete element.dataset.navigationAction;
}

export function setOutletNavigationIntent(
  outlet: Element,
  action: NavigationAction,
  direction: TransitionDirection = getDefaultNavigationDirection(action),
): void {
  const element = outlet as HTMLElement;
  element.dataset.navigationAction = action;
  element.dataset.direction = direction;
}
