import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useRef, useEffect } from 'react'
import { setDirection, setupPage } from '@capgo/transitions/react'

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
          <p>TanStack Start provides full-stack type safety with Cap Transitions.</p>

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

export const Route = createFileRoute('/details/$id')({
  component: DetailsPage,
})
