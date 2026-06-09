import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx'

/**
 * Export the resume DOM element to PDF using html2canvas + jsPDF.
 * A4 size, high-DPI for print quality.
 */
export async function exportToPDF(element: HTMLElement, filename = 'resume.pdf'): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })

  const pdf      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW    = pdf.internal.pageSize.getWidth()
  const pageH    = pdf.internal.pageSize.getHeight()
  const imgW     = canvas.width
  const imgH     = canvas.height
  const ratio    = Math.min(pageW / imgW, pageH / imgH)
  const scaledW  = imgW * ratio
  const scaledH  = imgH * ratio
  const offsetX  = (pageW - scaledW) / 2
  const offsetY  = 0

  // Handle multi-page
  let remaining = scaledH
  let srcY = 0
  let page = 0
  while (remaining > 0) {
    if (page > 0) pdf.addPage()
    const sliceH = Math.min(pageH, remaining)
    const srcSliceH = sliceH / ratio
    const sliceCanvas = document.createElement('canvas')
    sliceCanvas.width = imgW
    sliceCanvas.height = srcSliceH
    const ctx = sliceCanvas.getContext('2d')!
    ctx.drawImage(canvas, 0, srcY, imgW, srcSliceH, 0, 0, imgW, srcSliceH)
    pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', offsetX, offsetY, scaledW, sliceH)
    srcY += srcSliceH
    remaining -= sliceH
    page++
  }

  pdf.save(filename)
}

/**
 * Export resume element to PNG.
 */
export async function exportToPNG(element: HTMLElement, filename = 'resume.png'): Promise<void> {
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

/**
 * Export resume element to JPEG.
 */
export async function exportToJPEG(element: HTMLElement, filename = 'resume.jpg'): Promise<void> {
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/jpeg', 0.95)
  link.click()
}

/**
 * Export resume data to DOCX.
 * ATS-friendly plain-text DOCX with structured headings.
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

  // Name
  children.push(new Paragraph({
    children: [new TextRun({ text: resumeData.name, bold: true, size: 32 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
  }))

  // Contact
  const contact = [resumeData.title, resumeData.email, resumeData.phone, resumeData.location].filter(Boolean)
  if (contact.length) {
    children.push(new Paragraph({
      children: [new TextRun({ text: contact.join(' | '), size: 20, color: '666666' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }))
  }

  function addSection(title: string) {
    children.push(new Paragraph({
      text: title.toUpperCase(),
      heading: HeadingLevel.HEADING_2,
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '333333', space: 1 } },
      spacing: { before: 240, after: 120 },
    }))
  }

  if (resumeData.summary) {
    addSection('Professional Summary')
    children.push(new Paragraph({ text: resumeData.summary, spacing: { after: 120 } }))
  }

  if (resumeData.experience?.length) {
    addSection('Work Experience')
    for (const exp of resumeData.experience) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: exp.position, bold: true }),
          new TextRun({ text: `  ${exp.company}  ${exp.dates}`, color: '666666' }),
        ],
        spacing: { before: 120, after: 60 },
      }))
      for (const bullet of exp.bullets.filter(Boolean)) {
        children.push(new Paragraph({ text: `• ${bullet}`, spacing: { after: 40 } }))
      }
    }
  }

  if (resumeData.education?.length) {
    addSection('Education')
    for (const edu of resumeData.education) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: edu.school, bold: true }),
          new TextRun({ text: `  ${edu.degree}  ${edu.years}`, color: '666666' }),
        ],
        spacing: { after: 60 },
      }))
    }
  }

  if (resumeData.skills?.length) {
    addSection('Skills')
    children.push(new Paragraph({ text: resumeData.skills.join(' • ') }))
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
