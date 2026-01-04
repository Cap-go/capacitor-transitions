import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useRef, useEffect } from 'react'
import { setDirection, setupPage } from '@capgo/transitions/react'

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
          <p>This is a nested page to demonstrate multi-level navigation.</p>

          <button className="primary-button" onClick={goHome}>
            Go to Root (with fade)
          </button>
        </div>
      </cap-content>
    </cap-page>
  )
}

export const Route = createFileRoute('/nested/$id')({
  component: NestedPage,
})
