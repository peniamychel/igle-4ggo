import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

/** Morado institucional. */
const PRIMARY: [number, number, number] = [127, 11, 133];
const MARGIN = 14;
const PAGE_WIDTH = 210;   // A4 vertical (mm)
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

/** Carga /logo.png como dataURL (o null si falla). */
export function cargarLogo(): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = '/logo.png';
  });
}

export interface InformeHeaderOpts {
  titulo: string;
  iglesia?: string;
  periodo?: string;
  logo?: string | null;
}

/** Crea el documento, dibuja la cabecera institucional y devuelve { doc, y }. */
export function iniciarInforme(opts: InformeHeaderOpts): { doc: jsPDF; y: number } {
  const doc = new jsPDF();
  let y = 20;

  if (opts.logo) {
    doc.addImage(opts.logo, 'PNG', MARGIN, 12, 18, 18);
  }
  const textX = opts.logo ? 36 : MARGIN;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text('Movimiento Cristiano Misionero Maranatha', textX, 20);
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text(opts.titulo, textX, 27);
  y = 35;

  doc.setDrawColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  if (opts.iglesia) {
    doc.setFont('helvetica', 'bold');
    doc.text('Sede:', MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.text(opts.iglesia, MARGIN + 16, y);
    y += 6;
  }
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha:', MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('es-ES'), MARGIN + 16, y);
  if (opts.periodo) {
    doc.setFont('helvetica', 'bold');
    doc.text('Periodo:', MARGIN + 70, y);
    doc.setFont('helvetica', 'normal');
    doc.text(opts.periodo, MARGIN + 90, y);
  }
  y += 10;

  return { doc, y };
}

/** Escribe un título de sección; devuelve la nueva y (con salto de página si hace falta). */
export function tituloSeccion(doc: jsPDF, y: number, texto: string): number {
  y = asegurarEspacio(doc, y, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text(texto, MARGIN, y);
  return y + 6;
}

/** Agrega una tabla con autoTable a partir de y; devuelve la y final. */
export function agregarTabla(doc: jsPDF, y: number, head: string[], body: (string | number)[][]): number {
  autoTable(doc, {
    head: [head],
    body: body,
    startY: y,
    theme: 'striped',
    headStyles: { fillColor: PRIMARY, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: MARGIN, right: MARGIN }
  });
  return (doc as any).lastAutoTable.finalY + 8;
}

/**
 * Captura un elemento del DOM (un gráfico) y lo agrega como imagen; devuelve la nueva y.
 * Usa JPEG (mucho más liviano que PNG para gráficos) y escala 1.5 para mantener legibilidad
 * con archivos pequeños y generación rápida.
 */
export async function agregarGrafico(doc: jsPDF, y: number, el: HTMLElement): Promise<number> {
  const canvas = await html2canvas(el, { scale: 1.5, backgroundColor: '#ffffff', logging: false });
  const imgData = canvas.toDataURL('image/jpeg', 0.85);
  const imgW = CONTENT_WIDTH;
  const imgH = (canvas.height * imgW) / canvas.width;
  y = asegurarEspacio(doc, y, imgH + 4);
  doc.addImage(imgData, 'JPEG', MARGIN, y, imgW, imgH);
  return y + imgH + 6;
}

/** Pausa breve para que ngx-charts termine de renderizar antes de capturar (batch por iglesia). */
export function esperarRender(ms = 220): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Si no cabe `alto` mm antes del final de página, agrega una página nueva. Devuelve la y a usar. */
function asegurarEspacio(doc: jsPDF, y: number, alto: number): number {
  if (y + alto > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    return 20;
  }
  return y;
}
