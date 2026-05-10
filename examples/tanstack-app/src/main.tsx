import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
  useNavigate,
  useParams,
} from '@tanstack/react-router'
import { initTransitions, setDirection, setupPage, setupRouterOutlet } from '@capgo/capacitor-transitions/react'
import '@capgo/capacitor-transitions'
import './styles.css'

// Initialize transitions
initTransitions({ platform: 'auto' })

// Root route
function RootComponent() {
  const outletRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (outletRef.current) {
      setupRouterOutlet(outletRef.current, { platform: 'auto' })
    }
  }, [])

  return (
    <cap-router-outlet ref={outletRef}>
      <Outlet />
    </cap-router-outlet>
  )
}

const rootRoute = createRootRoute({
  component: RootComponent,
})

// Home page
function HomePage() {
  const navigate = useNavigate()
  const pageRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (pageRef.current) {
      return setupPage(pageRef.current, {
        onDidEnter: () => console.log('Home entered'),
        onDidLeave: () => console.log('Home left'),
      })
    }
  }, [])

  const goToDetails = (id: number) => {
    setDirection('forward')
    navigate({ to: '/details/$id', params: { id: String(id) } })
  }

  return (
    <cap-page ref={pageRef}>
      <cap-header slot="header">
        <div className="toolbar">
          <h1>Home</h1>
        </div>
      </cap-header>
      <cap-content slot="content">
        <div className="page-content">
          <h2>Welcome to Cap Transitions</h2>
          <p>This example shows iOS-style page transitions with TanStack Router.</p>

          <div className="list">
            {[1, 2, 3, 4, 5].map((id) => (
              <button key={id} className="list-item" onClick={() => goToDetails(id)}>
                <span>Item {id}</span>
                <span className="chevron">›</span>
              </button>
            ))}
          </div>
        </div>
      </cap-content>
      <cap-footer slot="footer">
        <div className="tab-bar">
          <button className="tab active">Home</button>
          <button className="tab">Search</button>
          <button className="tab">Profile</button>
        </div>
      </cap-footer>
    </cap-page>
  )
}

// Details page
function DetailsPage() {
  const navigate = useNavigate()
  const { id } = useParams({ from: '/details/$id' })
  const pageRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (pageRef.current) {
      return setupPage(pageRef.current, {
        onDidEnter: () => console.log(`Details ${id} entered`),
        onDidLeave: () => console.log(`Details ${id} left`),
      })
    }
  }, [id])

  const goBack = () => {
    setDirection('back')
    navigate({ to: '/' })
  }

  const goDeeper = () => {
    setDirection('forward')
    navigate({ to: '/nested/$id', params: { id } })
  }

  return (
    <cap-page ref={pageRef}>
      <cap-header slot="header">
        <div className="toolbar">
          <button className="back-button" onClick={goBack}>
            ‹ Back
          </button>
          <h1>Details {id}</h1>
        </div>
      </cap-header>
      <cap-content slot="content">
        <div className="page-content">
          <h2>Detail View</h2>
          <p>This is the details page for item {id}.</p>
          <p>TanStack Router works with the same transition primitives.</p>

          <button className="primary-button" onClick={goDeeper}>
            Go Deeper
          </button>

          <div className="scroll-demo">
            <h3>Scroll Content</h3>
            {Array.from({ length: 20 }).map((_, i) => (
              <p key={i}>Scroll item {i + 1}</p>
            ))}
          </div>
        </div>
      </cap-content>
    </cap-page>
  )
}

// Nested page
function NestedPage() {
  const navigate = useNavigate()
  const { id } = useParams({ from: '/nested/$id' })
  const pageRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (pageRef.current) {
      return setupPage(pageRef.current)
    }
  }, [])

  const goBack = () => {
    setDirection('back')
    navigate({ to: '/details/$id', params: { id } })
  }

  const goHome = () => {
    setDirection('root')
    navigate({ to: '/' })
  }

  return (
    <cap-page ref={pageRef}>
      <cap-header slot="header">
        <div className="toolbar">
          <button className="back-button" onClick={goBack}>
            ‹ Back
          </button>
          <h1>Nested {id}</h1>
        </div>
      </cap-header>
      <cap-content slot="content">
        <div className="page-content">
          <h2>Deeply Nested View</h2>
          <p>This is a nested page demonstrating multi-level navigation.</p>

          <button className="primary-button" onClick={goHome}>
            Go to Root (with fade)
          </button>
        </div>
      </cap-content>
    </cap-page>
  )
}

// Routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const detailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/details/$id',
  component: DetailsPage,
})

const nestedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nested/$id',
  component: NestedPage,
})

const routeTree = rootRoute.addChildren([indexRoute, detailsRoute, nestedRoute])
const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />)
