import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { NgFor } from '@angular/common'
import { TransitionService } from './transition.service'

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [NgFor],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <cap-page>
      <cap-header slot="header">
        <div class="toolbar">
          <button class="back-button" (click)="goBack()">‹ Back</button>
          <h1>Details {{ id }}</h1>
        </div>
      </cap-header>
      <cap-content slot="content">
        <div class="page-content">
          <h2>Detail View</h2>
          <p>This is the details page for item {{ id }}.</p>
          <p>Notice the smooth iOS-style transition when navigating.</p>

          <button class="primary-button" (click)="goDeeper()">Go Deeper</button>

          <div class="scroll-demo">
            <h3>Scroll Content</h3>
            <p *ngFor="let i of scrollItems">Scroll item {{ i }}</p>
          </div>
        </div>
      </cap-content>
    </cap-page>
  `,
})
export class DetailsComponent {
  id: string = ''
  scrollItems = Array.from({ length: 20 }, (_, i) => i + 1)

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
    this.router.navigate(['/'])
  }

  goDeeper(): void {
    this.transition.forward()
    this.router.navigate(['/nested', this.id])
  }
}
