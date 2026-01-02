import React, { useRef, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import {
  initTransitions,
  setDirection,
  setupPage,
  setupRouterOutlet,
} from '@capgo/transitions/react'
import '@capgo/transitions'
import './styles.css'

// Initialize transitions
initTransitions({ platform: 'auto' })

// Home Page
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
    navigate(`/details/${id}`)
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
          <p>This example shows iOS-style page transitions in React.</p>

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

// Details Page
function DetailsPage() {
  const navigate = useNavigate()
  const pageRef = useRef<HTMLElement>(null)
  const id = window.location.pathname.split('/').pop()

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
    navigate('/')
  }

  const goDeeper = () => {
    setDirection('forward')
    navigate(`/nested/${id}`)
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
          <p>Notice the smooth iOS-style transition when navigating.</p>

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

// Nested Page
function NestedPage() {
  const navigate = useNavigate()
  const pageRef = useRef<HTMLElement>(null)
  const id = window.location.pathname.split('/').pop()

  useEffect(() => {
    if (pageRef.current) {
      return setupPage(pageRef.current)
    }
  }, [])

  const goBack = () => {
    setDirection('back')
    navigate(-1)
  }

  const goHome = () => {
    setDirection('root')
    navigate('/')
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
          <p>This is a nested page to demonstrate multi-level navigation.</p>

          <button className="primary-button" onClick={goHome}>
            Go to Root (with fade)
          </button>
        </div>
      </cap-content>
    </cap-page>
  )
}

// Main App with Router
function App() {
  const location = useLocation()
  const outletRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (outletRef.current) {
      setupRouterOutlet(outletRef.current, { platform: 'auto' })
    }
  }, [])

  return (
    <cap-router-outlet ref={outletRef}>
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/details/:id" element={<DetailsPage />} />
        <Route path="/nested/:id" element={<NestedPage />} />
      </Routes>
    </cap-router-outlet>
  )
}

// Root
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
