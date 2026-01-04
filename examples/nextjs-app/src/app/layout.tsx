'use client'

import { useEffect, useRef } from 'react'
import { initTransitions, setupRouterOutlet } from '@capgo/transitions/react'
import '@capgo/transitions'
import './globals.css'

// Initialize transitions once
if (typeof window !== 'undefined') {
  initTransitions({ platform: 'auto' })
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const outletRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (outletRef.current) {
      setupRouterOutlet(outletRef.current, { platform: 'auto' })
    }
  }, [])

  return (
    <html lang="en">
      <body>
        <cap-router-outlet ref={outletRef}>
          {children}
        </cap-router-outlet>
      </body>
    </html>
  )
}
