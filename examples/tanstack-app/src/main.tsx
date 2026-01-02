import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Link,
  Outlet,
  useNavigate,
  useParams,
} from '@tanstack/react-router'
import {
  TransitionProvider,
  RouterOutlet,
  Page,
  Header,
  Content,
  Footer,
  useTransition,
} from '@capgo/transitions/react'
import './styles.css'

// Root route
const rootRoute = createRootRoute({
  component: () => (
    <TransitionProvider platform="auto">
      <RouterOutlet>
        <Outlet />
      </RouterOutlet>
    </TransitionProvider>
  ),
})

// Home Page Component
function HomePage() {
  const navigate = useNavigate()
  const { setDirection } = useTransition()

  const goToDetails = (id: number) => {
    setDirection('forward')
    navigate({ to: '/details/$id', params: { id: String(id) } })
  }

  return (
    <Page
      onDidEnter={() => console.log('Home entered')}
      onDidLeave={() => console.log('Home left')}
    >
      <Header>
        <div className="toolbar">
          <h1>Home</h1>
        </div>
      </Header>
      <Content>
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
      </Content>
      <Footer>
        <div className="tab-bar">
          <button className="tab active">Home</button>
          <button className="tab">Search</button>
          <button className="tab">Profile</button>
        </div>
      </Footer>
    </Page>
  )
}

// Details Page Component
function DetailsPage() {
  const navigate = useNavigate()
  const { id } = useParams({ from: '/details/$id' })
  const { setDirection } = useTransition()

  const goBack = () => {
    setDirection('back')
    navigate({ to: '/' })
  }

  const goDeeper = () => {
    setDirection('forward')
    navigate({ to: '/nested/$id', params: { id } })
  }

  return (
    <Page
      onDidEnter={() => console.log(`Details ${id} entered`)}
      onDidLeave={() => console.log(`Details ${id} left`)}
    >
      <Header>
        <div className="toolbar">
          <button className="back-button" onClick={goBack}>
            ‹ Back
          </button>
          <h1>Details {id}</h1>
        </div>
      </Header>
      <Content>
        <div className="page-content">
          <h2>Detail View</h2>
          <p>This is the details page for item {id}.</p>
          <p>TanStack Router provides type-safe routing with Cap Transitions.</p>

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
      </Content>
    </Page>
  )
}

// Nested Page Component
function NestedPage() {
  const navigate = useNavigate()
  const { id } = useParams({ from: '/nested/$id' })
  const { setDirection } = useTransition()

  const goBack = () => {
    setDirection('back')
    navigate({ to: '/details/$id', params: { id } })
  }

  const goHome = () => {
    setDirection('root')
    navigate({ to: '/' })
  }

  return (
    <Page>
      <Header>
        <div className="toolbar">
          <button className="back-button" onClick={goBack}>
            ‹ Back
          </button>
          <h1>Nested {id}</h1>
        </div>
      </Header>
      <Content>
        <div className="page-content">
          <h2>Deeply Nested View</h2>
          <p>This is a nested page demonstrating multi-level navigation.</p>

          <button className="primary-button" onClick={goHome}>
            Go to Root (with fade)
          </button>
        </div>
      </Content>
    </Page>
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

// Create router
const routeTree = rootRoute.addChildren([indexRoute, detailsRoute, nestedRoute])

const router = createRouter({ routeTree })

// Type registration for TypeScript
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
