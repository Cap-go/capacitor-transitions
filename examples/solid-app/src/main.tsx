/* @refresh reload */
import { render } from 'solid-js/web'
import { Router, Route, useNavigate, useParams } from '@solidjs/router'
import { For, onMount, onCleanup } from 'solid-js'
import {
  initTransitions,
  setDirection,
  setupPage,
  setupRouterOutlet,
} from '@capgo/transitions/solid'
import '@capgo/transitions'
import './styles.css'

// Initialize transitions
initTransitions({ platform: 'auto' })

// Home Page
function HomePage() {
  const navigate = useNavigate()
  let pageRef: HTMLElement | undefined

  const goToDetails = (id: number) => {
    setDirection('forward')
    navigate(`/details/${id}`)
  }

  onMount(() => {
    if (pageRef) {
      const cleanup = setupPage(pageRef, {
        onDidEnter: () => console.log('Home entered'),
        onDidLeave: () => console.log('Home left'),
      })
      onCleanup(cleanup)
    }
  })

  return (
    <cap-page ref={pageRef}>
      <cap-header slot="header">
        <div class="toolbar">
          <h1>Home</h1>
        </div>
      </cap-header>
      <cap-content slot="content">
        <div class="page-content">
          <h2>Welcome to Cap Transitions</h2>
          <p>This example shows iOS-style page transitions in Solid.</p>

          <div class="list">
            <For each={[1, 2, 3, 4, 5]}>
              {(id) => (
                <button class="list-item" onClick={() => goToDetails(id)}>
                  <span>Item {id}</span>
                  <span class="chevron">›</span>
                </button>
              )}
            </For>
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
  )
}

// Details Page
function DetailsPage() {
  const navigate = useNavigate()
  const params = useParams()
  let pageRef: HTMLElement | undefined

  const goBack = () => {
    setDirection('back')
    navigate('/')
  }

  const goDeeper = () => {
    setDirection('forward')
    navigate(`/nested/${params.id}`)
  }

  onMount(() => {
    if (pageRef) {
      const cleanup = setupPage(pageRef)
      onCleanup(cleanup)
    }
  })

  return (
    <cap-page ref={pageRef}>
      <cap-header slot="header">
        <div class="toolbar">
          <button class="back-button" onClick={goBack}>
            ‹ Back
          </button>
          <h1>Details {params.id}</h1>
        </div>
      </cap-header>
      <cap-content slot="content">
        <div class="page-content">
          <h2>Detail View</h2>
          <p>This is the details page for item {params.id}.</p>
          <p>Notice the smooth iOS-style transition when navigating.</p>

          <button class="primary-button" onClick={goDeeper}>
            Go Deeper
          </button>

          <div class="scroll-demo">
            <h3>Scroll Content</h3>
            <For each={Array.from({ length: 20 }, (_, i) => i + 1)}>
              {(i) => <p>Scroll item {i}</p>}
            </For>
          </div>
        </div>
      </cap-content>
    </cap-page>
  )
}

// Nested Page
function NestedPage() {
  const navigate = useNavigate()
  const params = useParams()
  let pageRef: HTMLElement | undefined

  const goBack = () => {
    setDirection('back')
    navigate(`/details/${params.id}`)
  }

  const goHome = () => {
    setDirection('root')
    navigate('/')
  }

  onMount(() => {
    if (pageRef) {
      const cleanup = setupPage(pageRef)
      onCleanup(cleanup)
    }
  })

  return (
    <cap-page ref={pageRef}>
      <cap-header slot="header">
        <div class="toolbar">
          <button class="back-button" onClick={goBack}>
            ‹ Back
          </button>
          <h1>Nested {params.id}</h1>
        </div>
      </cap-header>
      <cap-content slot="content">
        <div class="page-content">
          <h2>Deeply Nested View</h2>
          <p>This is a nested page to demonstrate multi-level navigation.</p>

          <button class="primary-button" onClick={goHome}>
            Go to Root (with fade)
          </button>
        </div>
      </cap-content>
    </cap-page>
  )
}

// App
function App() {
  let outletRef: HTMLElement | undefined

  onMount(() => {
    if (outletRef) {
      setupRouterOutlet(outletRef, { platform: 'auto' })
    }
  })

  return (
    <cap-router-outlet ref={outletRef}>
      <Route path="/" component={HomePage} />
      <Route path="/details/:id" component={DetailsPage} />
      <Route path="/nested/:id" component={NestedPage} />
    </cap-router-outlet>
  )
}

render(
  () => (
    <Router>
      <App />
    </Router>
  ),
  document.getElementById('app')!
)
