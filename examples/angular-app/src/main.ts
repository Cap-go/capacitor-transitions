import { bootstrapApplication } from '@angular/platform-browser'
import { provideRouter, Routes } from '@angular/router'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import '@capgo/transitions'

import { AppComponent } from './app/app.component'
import { HomeComponent } from './app/home.component'
import { DetailsComponent } from './app/details.component'
import { NestedComponent } from './app/nested.component'

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'details/:id', component: DetailsComponent },
  { path: 'nested/:id', component: NestedComponent },
]

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes)],
}).catch((err) => console.error(err))
