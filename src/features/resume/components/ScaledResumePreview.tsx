/**
 * ScaledResumePreview — renders the resume at exact A4 width (794px)
 * then scales it down via CSS transform to fit any container.
 * Always shows at least a full A4 page height so the preview never looks "short".
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

const A4_WIDTH  = 794
const A4_HEIGHT = 1123  // minimum — always show at least one full A4 page

export function ScaledResumePreview({ sections, templateName, className }: Props) {
  const outerRef  = useRef<HTMLDivElement>(null)
  const innerRef  = useRef<HTMLDivElement>(null)
  const [scale, setScale]             = useState(1)
  const [innerHeight, setInnerHeight] = useState(A4_HEIGHT)

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

  // Track rendered height — never shorter than one A4 page
  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    const obs = new ResizeObserver(() => {
      if (innerRef.current) {
        setInnerHeight(Math.max(A4_HEIGHT, innerRef.current.scrollHeight))
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
        height: `${Math.round(innerHeight * scale)}px`,
      }}
    >
      <div
        ref={innerRef}
        style={{
          width: `${A4_WIDTH}px`,
          height: `${innerHeight}px`,   // explicit height so children can use height:100%
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
        }}
      >
        <ResumePreviewPanel sections={sections} templateName={templateName} />
      </div>
    </div>
  )
}
