import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx'

/** Wait for fonts to load before capture */
async function fontsReady(): Promise<void> {
  try {
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      await document.fonts.ready
    }
  } catch { /* non-critical */ }
}

/** Wait two animation frames for browser to paint */
function waitFrames(n = 2): Promise<void> {
  return new Promise(resolve => {
    let count = 0
    function tick() {
      if (++count >= n) resolve()
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

/**
 * Capture an element to high-res canvas.
 *
 * Key insight: html2canvas only captures elements that the browser has PAINTED
 * inside the visual viewport. We temporarily move the element to top:0, left:0
 * behind the page (z-index:-999) so the browser renders it, then restore.
 */
async function captureElement(element: HTMLElement): Promise<HTMLCanvasElement> {
  await fontsReady()

  // Save current inline styles we'll temporarily override
  const saved = {
    position: element.style.position,
    top:      element.style.top,
    left:     element.style.left,
    right:    element.style.right,
    bottom:   element.style.bottom,
    zIndex:   element.style.zIndex,
    width:    element.style.width,
    borderRadius: element.style.borderRadius,
    boxShadow:    element.style.boxShadow,
    overflow:     element.style.overflow,
    pointerEvents: element.style.pointerEvents,
  }

  // Move into viewport behind all page content
  Object.assign(element.style, {
    position: 'fixed',
    top:      '0',
    left:     '0',
    right:    'auto',
    bottom:   'auto',
    zIndex:   '-999',
    width:    '794px',          // A4 width @ 96 dpi
    borderRadius: '0',
    boxShadow:    'none',
    overflow:     'visible',
    pointerEvents: 'none',
  })

  // Let browser repaint with the new position
  await waitFrames(3)

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 794,
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0,
    })
    return canvas
  } finally {
    // Restore original styles
    Object.assign(element.style, saved)
  }
}

/**
 * Export the resume DOM element to PDF — A4, high-DPI, multi-page.
 */
export async function exportToPDF(element: HTMLElement, filename = 'resume.pdf'): Promise<void> {
  const canvas  = await captureElement(element)
  const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW   = pdf.internal.pageSize.getWidth()    // 210 mm
  const pageH   = pdf.internal.pageSize.getHeight()   // 297 mm
  const imgW    = canvas.width
  const imgH    = canvas.height
  // scale so canvas width == page width
  const ratio   = pageW / imgW
  const scaledH = imgH * ratio

  let remaining = scaledH
  let srcY      = 0
  let page      = 0

  while (remaining > 0) {
    if (page > 0) pdf.addPage()
    const sliceH    = Math.min(pageH, remaining)
    const srcSliceH = sliceH / ratio
    const sliceCanvas = document.createElement('canvas')
    sliceCanvas.width  = imgW
    sliceCanvas.height = Math.ceil(srcSliceH)
    const ctx = sliceCanvas.getContext('2d')!
    ctx.drawImage(canvas, 0, srcY, imgW, srcSliceH, 0, 0, imgW, srcSliceH)
    pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, sliceH)
    srcY      += srcSliceH
    remaining -= sliceH
    page++
  }

  pdf.save(filename)
}

/**
 * Export resume to PNG image.
 */
export async function exportToPNG(element: HTMLElement, filename = 'resume.png'): Promise<void> {
  const canvas = await captureElement(element)
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

/**
 * Export resume to JPEG image.
 */
export async function exportToJPEG(element: HTMLElement, filename = 'resume.jpg'): Promise<void> {
  const canvas = await captureElement(element)
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/jpeg', 0.95)
  link.click()
}

/**
 * ATS-friendly plain-text DOCX — clean structure, no design flourishes.
 * This is what ATS parsers expect.
 */
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
    children: [new TextRun({ text: resumeData.name, bold: true, size: 36, font: 'Calibri' })],
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
      children: [new TextRun({ text: contact.join('  |  '), size: 20, color: '666666', font: 'Calibri' })],
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
      children: [new TextRun({ text: resumeData.summary, size: 22, font: 'Calibri' })],
      spacing: { after: 120 },
    }))
  }

  if (resumeData.experience?.length) {
    section('Work Experience')
    for (const exp of resumeData.experience) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: exp.position, bold: true, size: 24, font: 'Calibri' }),
          new TextRun({ text: `   ${exp.company}`, size: 22, font: 'Calibri' }),
          new TextRun({ text: `   ${exp.dates}`, size: 20, color: '888888', font: 'Calibri' }),
        ],
        spacing: { before: 140, after: 60 },
      }))
      for (const bullet of exp.bullets.filter(Boolean)) {
        children.push(new Paragraph({
          children: [new TextRun({ text: `• ${bullet}`, size: 22, font: 'Calibri' })],
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
          new TextRun({ text: edu.school, bold: true, size: 24, font: 'Calibri' }),
          new TextRun({ text: `   ${edu.degree}`, size: 22, font: 'Calibri' }),
          new TextRun({ text: `   ${edu.years}`, size: 20, color: '888888', font: 'Calibri' }),
        ],
        spacing: { after: 80 },
      }))
    }
  }

  if (resumeData.skills?.length) {
    section('Skills')
    // List skills as bullet points — more ATS-friendly than comma-separated
    for (const skill of resumeData.skills) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `• ${skill}`, size: 22, font: 'Calibri' })],
        spacing: { after: 40 },
        indent: { left: 360 },
      }))
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
        },
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
