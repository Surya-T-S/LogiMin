import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'

export async function exportElementAsPNG(el: HTMLElement, filename = 'logimin.png'): Promise<void> {
  const dataUrl = await toPng(el, { cacheBust: true, pixelRatio: 2, backgroundColor: 'white' })
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

export async function exportElementAsPDF(el: HTMLElement, filename = 'logimin.pdf'): Promise<void> {
  const dataUrl = await toPng(el, { cacheBust: true, pixelRatio: 2, backgroundColor: 'white' })
  const img = new Image()
  img.src = dataUrl
  await new Promise<void>((res) => { img.onload = () => res() })

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()

  // Fit image to page maintaining aspect ratio
  const ratio = Math.min(pageW / img.width, pageH / img.height)
  const w = img.width * ratio
  const h = img.height * ratio
  const x = (pageW - w) / 2
  const y = (pageH - h) / 2

  pdf.addImage(dataUrl, 'PNG', x, y, w, h)
  pdf.save(filename)
}
