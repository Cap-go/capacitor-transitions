import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { Router } from '@angular/router'
import { NgFor } from '@angular/common'
import { TransitionService } from './transition.service'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgFor],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <cap-page>
      <cap-header slot="header">
        <div class="toolbar">
          <h1>Home</h1>
        </div>
      </cap-header>
      <cap-content slot="content">
        <div class="page-content">
          <h2>Welcome to Cap Transitions</h2>
          <p>This example shows iOS-style page transitions in Angular.</p>

          <div class="list">
            <button
              *ngFor="let id of items"
              class="list-item"
              (click)="goToDetails(id)"
            >
              <span>Item {{ id }}</span>
              <span class="chevron">›</span>
            </button>
          </div>
        </div>
      </cap-content>
      <cap-footer slot="footer">
        <div class="tab-bar">
          <button class="tab active">Home</button>
          <button class="tab">Search</button>
          <button class="tab">Profile</button>
        </div>
      </cap-footer>
    </cap-page>
  `,
})
export class HomeComponent {
  items = [1, 2, 3, 4, 5]

  constructor(
    private router: Router,
    private transition: TransitionService
  ) {}

  goToDetails(id: number): void {
    this.transition.forward()
    this.router.navigate(['/details', id])
  }
}
