import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useRef, useEffect } from 'react'
import { initTransitions, setupRouterOutlet } from '@capgo/transitions/react'
import '@capgo/transitions'
import '../styles.css'

// Initialize transitions
if (typeof window !== 'undefined') {
  initTransitions({ platform: 'auto' })
}

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

export const Route = createRootRoute({
  component: RootComponent,
})
