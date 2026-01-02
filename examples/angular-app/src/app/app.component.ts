import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterOutlet } from '@angular/router'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <cap-router-outlet platform="auto">
      <router-outlet></router-outlet>
    </cap-router-outlet>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }
  `],
})
export class AppComponent {}
