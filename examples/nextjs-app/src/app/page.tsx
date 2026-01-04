'use client'

import { useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setDirection, setupPage } from '@capgo/transitions/react'

export default function HomePage() {
  const router = useRouter()
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
    router.push(`/details/${id}`)
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
          <h2>Next.js + Cap Transitions</h2>
          <p>This example shows iOS-style page transitions with Next.js App Router.</p>

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
