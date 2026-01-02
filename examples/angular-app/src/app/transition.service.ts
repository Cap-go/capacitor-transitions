import { Injectable } from '@angular/core'
import type { TransitionDirection } from '@capgo/transitions'

@Injectable({
  providedIn: 'root',
})
export class TransitionService {
  private _direction: TransitionDirection = 'forward'

  get direction(): TransitionDirection {
    return this._direction
  }

  setDirection(direction: TransitionDirection): void {
    this._direction = direction
  }

  forward(): void {
    this._direction = 'forward'
  }

  back(): void {
    this._direction = 'back'
  }

  root(): void {
    this._direction = 'root'
  }
}
