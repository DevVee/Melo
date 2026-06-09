/**
 * Export utilities — PDF, PNG, DOCX
 *
 * WHY html-to-image instead of html2canvas:
 *   Tailwind v4 uses oklch() colors. html2canvas has its own CSS parser that
 *   fails to parse oklch(), producing blank/black canvases.
 *   html-to-image uses the browser's native SVGForeignObject renderer, so all
 *   modern CSS (oklch, color-mix, container queries…) just works.
 *
 * A4 sizing strategy:
 *   - Capture at exactly 794px wide (A4 at 96 dpi), minimum 1123px tall.
 *   - PDF pages are always exactly 210mm × 297mm; last page padded white.
 *   - PNG is the full natural height of the resume content.
 */

import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx'

const A4_W_PX  = 794    // A4 width  at 96 dpi
const A4_H_PX  = 1123   // A4 height at 96 dpi
const A4_W_MM  = 210    // jsPDF millimetres
const A4_H_MM  = 297
const PX_RATIO = 2      // retina capture quality

/** Wait N animation frames for browser repaint */
function waitFrames(n = 3): Promise<void> {
  return new Promise(resolve => {
    let c = 0
    const tick = () => { if (++c >= n) resolve(); else requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
  })
}

/** Wait for web fonts to finish loading */
async function fontsReady(): Promise<void> {
  try { if (document.fonts?.ready) await document.fonts.ready } catch { /* non-critical */ }
}

/** Load an Image from a data URL */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// ─── Core capture ─────────────────────────────────────────────────────────────

/**
 * Capture element as a hi-res PNG data URL.
 *
 * 1. Show a white overlay (hides the flash from the user).
 * 2. Move element to top:0 left:0 z:999999 so browser paints it fully.
 * 3. Wait 3 frames for reflow + repaint.
 * 4. Capture with html-to-image (native SVG renderer — handles all CSS).
 * 5. Restore + remove overlay.
 */
async function captureElement(element: HTMLElement): Promise<string> {
  await fontsReady()

  // Measure natural height BEFORE any style override (most reliable)
  const naturalH = Math.max(A4_H_PX, element.scrollHeight || element.offsetHeight)

  // ── Overlay ──────────────────────────────────────────────────────────────────
  const overlay = document.createElement('div')
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:999998',
    'background:rgba(255,255,255,0.98)',
    'display:flex', 'align-items:center', 'justify-content:center',
    'font-family:sans-serif', 'font-size:14px', 'color:#9333ea',
    'font-weight:600', 'letter-spacing:0.02em',
    'pointer-events:none',
  ].join(';')
  overlay.textContent = '✨ Generating your resume…'
  document.body.appendChild(overlay)

  // ── Save & override element styles ───────────────────────────────────────────
  const keys = ['position','top','left','right','bottom','zIndex','width',
                 'minHeight','maxWidth','borderRadius','boxShadow','overflow',
                 'pointerEvents','margin','transform','opacity'] as const
  type StyleKey = typeof keys[number]
  const saved: Partial<CSSStyleDeclaration> = {}
  keys.forEach(k => { saved[k] = element.style[k as StyleKey] })

  Object.assign(element.style, {
    position:      'fixed',
    top:           '0',
    left:          '0',
    right:         'auto',
    bottom:        'auto',
    zIndex:        '999999',
    width:         `${A4_W_PX}px`,
    minHeight:     `${A4_H_PX}px`,   // always at least one A4 page
    maxWidth:      'none',
    borderRadius:  '0',
    boxShadow:     'none',
    overflow:      'visible',
    pointerEvents: 'none',
    margin:        '0',
    transform:     'none',
    opacity:       '1',
  })

  await waitFrames(6)

  // Re-measure after reflow (may have grown due to minHeight)
  const captureH = Math.max(naturalH, element.scrollHeight || A4_H_PX)

  try {
    const dataUrl = await toPng(element, {
      pixelRatio: PX_RATIO,
      width:      A4_W_PX,
      height:     captureH,
      style: {
        margin: '0', padding: '0',
        borderRadius: '0', boxShadow: 'none', overflow: 'visible',
      },
    })
    return dataUrl
  } finally {
    // Restore styles
    keys.forEach(k => {
      element.style[k as StyleKey] = (saved[k as StyleKey] ?? '') as string
    })
    document.body.removeChild(overlay)
  }
}

// ─── PDF export ───────────────────────────────────────────────────────────────

/**
 * Export to PDF — always proper A4 pages (210 × 297 mm).
 * Last page is padded with white to full A4 height so every page
 * looks like a real sheet of paper.
 */
export async function exportToPDF(element: HTMLElement, filename = 'resume.pdf'): Promise<void> {
  const dataUrl = await captureElement(element)
  const img     = await loadImage(dataUrl)

  // Content dimensions at 1× (undo pixel ratio)
  const contentW = img.width  / PX_RATIO   // ≈ A4_W_PX
  const contentH = img.height / PX_RATIO

  // How many full A4 pages?
  const numPages = Math.max(1, Math.ceil(contentH / A4_H_PX))

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  for (let page = 0; page < numPages; page++) {
    if (page > 0) pdf.addPage()

    // Source slice in canvas (2×) pixels
    const srcY = page * A4_H_PX * PX_RATIO
    const srcH = Math.min(A4_H_PX * PX_RATIO, img.height - srcY)

    // Create a full A4 page canvas — always 794×1123 at 1× (1588×2246 at 2×)
    const pageCanvas   = document.createElement('canvas')
    pageCanvas.width   = Math.round(contentW * PX_RATIO)     // 1588
    pageCanvas.height  = A4_H_PX * PX_RATIO                  // 2246 — always full A4
    const ctx = pageCanvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)  // white background

    // Draw only the slice that belongs to this page
    if (srcH > 0) {
      ctx.drawImage(img, 0, srcY, img.width, srcH, 0, 0, img.width, srcH)
    }

    // Add to PDF at exact A4 dimensions
    pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, A4_W_MM, A4_H_MM)
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

// ─── JPEG export ──────────────────────────────────────────────────────────────

export async function exportToJPEG(element: HTMLElement, filename = 'resume.jpg'): Promise<void> {
  const dataUrl = await captureElement(element)
  const img = await loadImage(dataUrl)
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

  children.push(new Paragraph({
    children: [new TextRun({ text: resumeData.name, bold: true, size: 36, font: 'Calibri', color: '111111' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
  }))

  if (resumeData.title) {
    children.push(new Paragraph({
      children: [new TextRun({ text: resumeData.title, size: 24, color: '444444', font: 'Calibri' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }))
  }

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
    styles: { default: { document: { run: { font: 'Calibri', size: 22, color: '111111' } } } },
    sections: [{ properties: {}, children }],
  })

  const blob = await Packer.toBlob(doc)
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = filename; link.click()
  URL.revokeObjectURL(url)
}
