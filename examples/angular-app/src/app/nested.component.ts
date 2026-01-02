import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { TransitionService } from './transition.service'

@Component({
  selector: 'app-nested',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <cap-page>
      <cap-header slot="header">
        <div class="toolbar">
          <button class="back-button" (click)="goBack()">‹ Back</button>
          <h1>Nested {{ id }}</h1>
        </div>
      </cap-header>
      <cap-content slot="content">
        <div class="page-content">
          <h2>Deeply Nested View</h2>
          <p>This is a nested page to demonstrate multi-level navigation.</p>

          <button class="primary-button" (click)="goHome()">
            Go to Root (with fade)
          </button>
        </div>
      </cap-content>
    </cap-page>
  `,
})
export class NestedComponent {
  id: string = ''

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private transition: TransitionService
  ) {
    this.route.params.subscribe((params) => {
      this.id = params['id']
    })
  }

  goBack(): void {
    this.transition.back()
    this.router.navigate(['/details', this.id])
  }

  goHome(): void {
    this.transition.root()
    this.router.navigate(['/'])
  }
}
