'use client'

import { useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { setDirection, setupPage } from '@capgo/transitions/react'

export default function NestedPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const pageRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (pageRef.current) {
      return setupPage(pageRef.current)
    }
  }, [])

  const goBack = () => {
    setDirection('back')
    router.back()
  }

  const goHome = () => {
    setDirection('root')
    router.push('/')
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
