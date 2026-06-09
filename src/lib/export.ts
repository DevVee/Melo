/**
 * Export utilities — PDF, PNG, DOCX
 *
 * WHY html-to-image instead of html2canvas:
 *   Tailwind v4 uses oklch() colors. html2canvas has its own CSS parser that
 *   fails to parse oklch(), producing blank/black canvases.
 *   html-to-image uses the browser's native SVGForeignObject renderer, so all
 *   modern CSS (oklch, color-mix, container queries…) just works.
 *
 * WHY zIndex 999999 during capture (not -999):
 *   html-to-image calls getComputedStyle which works fine on off-screen
 *   elements, BUT the browser won't paint elements that are behind a solid
 *   background (z:-999 below body background). We move the element to top-left
 *   at maximum z-index for the 2-3 frame window of capture, then restore.
 *   An overlay div at z:999998 hides it from the user during that moment.
 */

import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx'

const A4_W_PX = 794   // A4 width at 96 dpi
const PIXEL_RATIO = 2 // retina / print quality

/** Wait N animation frames */
function waitFrames(n = 2): Promise<void> {
  return new Promise(resolve => {
    let count = 0
    function tick() { if (++count >= n) resolve(); else requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
  })
}

/** Wait for fonts to finish loading */
async function fontsReady(): Promise<void> {
  try { if (document.fonts?.ready) await document.fonts.ready } catch { /* non-critical */ }
}

/**
 * Capture element to PNG data URL using html-to-image.
 *
 * Strategy:
 *  1. Show a "Generating…" overlay so user can't see the element flash.
 *  2. Move element to position:fixed top:0 left:0 z:999999 (above overlay).
 *  3. Wait 3 frames for repaint.
 *  4. Capture with html-to-image (SVG foreign object — handles all CSS).
 *  5. Restore element styles, remove overlay.
 */
async function captureElement(element: HTMLElement): Promise<string> {
  await fontsReady()

  // ── 1. Overlay to hide the brief flash ──────────────────────────────────────
  const overlay = document.createElement('div')
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:999998',
    'background:rgba(255,255,255,0.97)',
    'display:flex', 'align-items:center', 'justify-content:center',
    'font-family:sans-serif', 'font-size:14px', 'color:#888',
    'pointer-events:none',
  ].join(';')
  overlay.textContent = 'Generating your resume…'
  document.body.appendChild(overlay)

  // ── 2. Save & override element styles ───────────────────────────────────────
  const saved: Record<string, string> = {}
  const overrides: Record<string, string> = {
    position:      'fixed',
    top:           '0',
    left:          '0',
    right:         'auto',
    bottom:        'auto',
    zIndex:        '999999',
    width:         `${A4_W_PX}px`,
    maxWidth:      'none',
    borderRadius:  '0',
    boxShadow:     'none',
    overflow:      'visible',
    pointerEvents: 'none',
    margin:        '0',
    transform:     'none',
  }
  for (const key of Object.keys(overrides)) {
    saved[key] = (element.style as unknown as Record<string, string>)[key]
  }
  Object.assign(element.style, overrides)

  // ── 3. Wait for browser to repaint ──────────────────────────────────────────
  await waitFrames(3)

  // ── 4. Capture ──────────────────────────────────────────────────────────────
  try {
    const dataUrl = await toPng(element, {
      pixelRatio: PIXEL_RATIO,
      width:  A4_W_PX,
      height: element.scrollHeight,
      style: {
        margin:      '0',
        padding:     '0',
        borderRadius:'0',
        boxShadow:   'none',
        overflow:    'visible',
      },
    })
    return dataUrl
  } finally {
    // ── 5. Restore ─────────────────────────────────────────────────────────────
    for (const key of Object.keys(saved)) {
      (element.style as unknown as Record<string, string>)[key] = saved[key]
    }
    document.body.removeChild(overlay)
  }
}

// ─── PDF export ───────────────────────────────────────────────────────────────

export async function exportToPDF(element: HTMLElement, filename = 'resume.pdf'): Promise<void> {
  const dataUrl = await captureElement(element)

  const pdf    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW  = pdf.internal.pageSize.getWidth()   // 210 mm
  const pageH  = pdf.internal.pageSize.getHeight()  // 297 mm

  // Load the image to get actual dimensions
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = dataUrl
  })

  // img dimensions are at pixelRatio × actual size
  const srcW   = img.width  / PIXEL_RATIO   // natural px at 1×
  const srcH   = img.height / PIXEL_RATIO
  const ratio  = pageW / srcW               // mm per px
  const totalH = srcH * ratio               // total mm height

  // Slice into A4 pages
  let remaining = totalH
  let page = 0

  while (remaining > 0) {
    if (page > 0) pdf.addPage()

    const sliceH    = Math.min(pageH, remaining)
    const srcSliceH = (sliceH / ratio) * PIXEL_RATIO   // in canvas px
    const srcOffY   = page * pageH / ratio * PIXEL_RATIO

    // Draw just this slice onto a temp canvas
    const slice = document.createElement('canvas')
    slice.width  = img.width
    slice.height = Math.ceil(srcSliceH)
    const ctx = slice.getContext('2d')!
    ctx.drawImage(img, 0, srcOffY, img.width, srcSliceH, 0, 0, img.width, srcSliceH)
    pdf.addImage(slice.toDataURL('image/png'), 'PNG', 0, 0, pageW, sliceH)

    remaining -= sliceH
    page++
  }

  pdf.save(filename)
}

// ─── PNG export ───────────────────────────────────────────────────────────────

export async function exportToPNG(element: HTMLElement, filename = 'resume.png'): Promise<void> {
  const dataUrl = await captureElement(element)
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

// ─── JPEG export ─────────────────────────────────────────────────────────────

export async function exportToJPEG(element: HTMLElement, filename = 'resume.jpg'): Promise<void> {
  // html-to-image toJpeg works too, but PNG -> canvas -> toDataURL gives better control
  const dataUrl = await captureElement(element)
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = dataUrl
  })
  const canvas = document.createElement('canvas')
  canvas.width  = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0)
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/jpeg', 0.95)
  link.click()
}

// ─── DOCX export ─────────────────────────────────────────────────────────────

export async function exportToDOCX(resumeData: {
  name: string
  title?: string
  email?: string
  phone?: string
  location?: string
  summary?: string
  experience?: { position: string; company: string; dates: string; bullets: string[] }[]
  education?: { school: string; degree: string; years: string }[]
  skills?: string[]
}, filename = 'resume.docx'): Promise<void> {
  const children: Paragraph[] = []

  // Name — large, centered
  children.push(new Paragraph({
    children: [new TextRun({ text: resumeData.name, bold: true, size: 36, font: 'Calibri', color: '111111' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
  }))

  // Title
  if (resumeData.title) {
    children.push(new Paragraph({
      children: [new TextRun({ text: resumeData.title, size: 24, color: '444444', font: 'Calibri' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }))
  }

  // Contact bar
  const contact = [resumeData.email, resumeData.phone, resumeData.location].filter(Boolean)
  if (contact.length) {
    children.push(new Paragraph({
      children: [new TextRun({ text: contact.join('  |  '), size: 20, color: '555555', font: 'Calibri' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 280 },
    }))
  }

  function section(title: string) {
    children.push(new Paragraph({
      text: title.toUpperCase(),
      heading: HeadingLevel.HEADING_2,
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '333333', space: 1 } },
      spacing: { before: 280, after: 120 },
    }))
  }

  if (resumeData.summary) {
    section('Professional Summary')
    children.push(new Paragraph({
      children: [new TextRun({ text: resumeData.summary, size: 22, font: 'Calibri', color: '111111' })],
      spacing: { after: 120 },
    }))
  }

  if (resumeData.experience?.length) {
    section('Work Experience')
    for (const exp of resumeData.experience) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: exp.position, bold: true, size: 24, font: 'Calibri', color: '111111' }),
          new TextRun({ text: `   ${exp.company}`, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: `   ${exp.dates}`, size: 20, color: '777777', font: 'Calibri' }),
        ],
        spacing: { before: 140, after: 60 },
      }))
      for (const bullet of exp.bullets.filter(Boolean)) {
        children.push(new Paragraph({
          children: [new TextRun({ text: `• ${bullet}`, size: 22, font: 'Calibri', color: '111111' })],
          spacing: { after: 40 },
          indent: { left: 360 },
        }))
      }
    }
  }

  if (resumeData.education?.length) {
    section('Education')
    for (const edu of resumeData.education) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: edu.school, bold: true, size: 24, font: 'Calibri', color: '111111' }),
          new TextRun({ text: `   ${edu.degree}`, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: `   ${edu.years}`, size: 20, color: '777777', font: 'Calibri' }),
        ],
        spacing: { after: 80 },
      }))
    }
  }

  if (resumeData.skills?.length) {
    section('Skills')
    for (const skill of resumeData.skills) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `• ${skill}`, size: 22, font: 'Calibri', color: '111111' })],
        spacing: { after: 40 },
        indent: { left: 360 },
      }))
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22, color: '111111' } },
      },
    },
    sections: [{ properties: {}, children }],
  })

  const blob = await Packer.toBlob(doc)
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
