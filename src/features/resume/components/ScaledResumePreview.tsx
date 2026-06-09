/**
 * ScaledResumePreview — always renders the resume at exact A4 width (794px)
 * then scales it down via CSS transform to fit whatever container it's in.
 * This means mobile users see the exact same layout as desktop — just smaller.
 */
import { useRef, useEffect, useState } from 'react'
import { ResumePreviewPanel } from './ResumePreviewPanel'

type Section = {
  section_type: string
  content: Record<string, unknown>
  sort_order: number
  is_visible: boolean
}

type Props = {
  sections: Section[]
  templateName?: string
  className?: string
}

const A4_WIDTH = 794

export function ScaledResumePreview({ sections, templateName, className }: Props) {
  const outerRef  = useRef<HTMLDivElement>(null)
  const innerRef  = useRef<HTMLDivElement>(null)
  const [scale, setScale]             = useState(1)
  const [innerHeight, setInnerHeight] = useState(1123) // A4 default

  // Update scale when outer container resizes
  useEffect(() => {
    const update = () => {
      if (!outerRef.current) return
      const w = outerRef.current.clientWidth
      if (w > 0) setScale(w / A4_WIDTH)
    }
    update()
    const obs = new ResizeObserver(update)
    if (outerRef.current) obs.observe(outerRef.current)
    return () => obs.disconnect()
  }, [])

  // Track real rendered height of the inner resume
  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    const obs = new ResizeObserver(() => {
      if (innerRef.current) {
        setInnerHeight(innerRef.current.scrollHeight)
      }
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [sections, templateName])

  return (
    <div
      ref={outerRef}
      className={className}
      style={{
        width: '100%',
        overflow: 'hidden',
        // outer height = inner height scaled down, so no empty space below
        height: `${Math.round(innerHeight * scale)}px`,
      }}
    >
      <div
        ref={innerRef}
        style={{
          width: `${A4_WIDTH}px`,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
        }}
      >
        <ResumePreviewPanel sections={sections} templateName={templateName} />
      </div>
    </div>
  )
}
