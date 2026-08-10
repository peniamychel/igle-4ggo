import { jsPDF } from 'jspdf';

/**
 * Carta de solicitud de traspaso.
 *
 * La genera la iglesia de origen desde el modal de solicitud, para imprimirla,
 * firmarla y entregarla. La iglesia destino luego adjunta la foto de esa carta
 * firmada al aceptar el traspaso.
 */
export interface DatosCartaTraspaso {
  miembroNombre: string;
  miembroCi?: string | number | null;
  iglesiaOrigen: string;
  direccionOrigen?: string;
  pastorOrigen?: string;
  iglesiaDestino: string;
  direccionDestino?: string;
  pastorDestino?: string;
  motivo: string;
  fecha: Date;
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

function fechaEnLetras(fecha: Date): string {
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

/** Quita el prefijo "Pastor: " que agrega la vista para mostrarlo en pantalla. */
function soloNombre(valor?: string): string {
  if (!valor) return '';
  return valor.replace(/^pastor:\s*/i, '').trim();
}

export function generarCartaTraspasoPdf(datos: DatosCartaTraspaso): void {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });

  const anchoPagina = doc.internal.pageSize.getWidth();
  const margen = 25;
  const anchoUtil = anchoPagina - margen * 2;
  let y = 25;

  // ── Encabezado ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('SOLICITUD DE TRASPASO DE MIEMBRO', anchoPagina / 2, y, { align: 'center' });

  y += 7;
  doc.setDrawColor(127, 11, 133);
  doc.setLineWidth(0.6);
  doc.line(margen, y, anchoPagina - margen, y);

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.text(`${datos.iglesiaOrigen}, ${fechaEnLetras(datos.fecha)}`, anchoPagina - margen, y, { align: 'right' });

  // ── Destinatario ──
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Señor(a) Pastor(a)', margen, y);

  y += 6;
  const pastorDestino = soloNombre(datos.pastorDestino);
  if (pastorDestino && !/por asignar/i.test(pastorDestino)) {
    doc.text(pastorDestino, margen, y);
    y += 6;
  }
  doc.text(datos.iglesiaDestino, margen, y);

  if (datos.direccionDestino) {
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.text(datos.direccionDestino, margen, y);
  }

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Presente.-', margen, y);

  // ── Cuerpo ──
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const ci = datos.miembroCi ? `, con cédula de identidad N° ${datos.miembroCi},` : ',';
  const cuerpo =
    `De nuestra mayor consideración:\n\n` +
    `Por medio de la presente, la congregación ${datos.iglesiaOrigen} solicita a su digna ` +
    `autoridad el traspaso del hermano(a) ${datos.miembroNombre}${ci} miembro activo de nuestra ` +
    `congregación, a la iglesia ${datos.iglesiaDestino} que usted preside.`;

  const lineasCuerpo = doc.splitTextToSize(cuerpo, anchoUtil);
  doc.text(lineasCuerpo, margen, y, { align: 'justify', maxWidth: anchoUtil });
  y += lineasCuerpo.length * 6 + 6;

  // ── Motivo ──
  doc.setFont('helvetica', 'bold');
  doc.text('Motivo del traspaso:', margen, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  const lineasMotivo = doc.splitTextToSize(datos.motivo, anchoUtil);
  doc.text(lineasMotivo, margen, y, { align: 'justify', maxWidth: anchoUtil });
  y += lineasMotivo.length * 6 + 8;

  const cierre = doc.splitTextToSize(
    'Agradeciendo de antemano la atención brindada a la presente y rogando a Dios por su ' +
    'ministerio, nos despedimos con las consideraciones más distinguidas.',
    anchoUtil
  );
  doc.text(cierre, margen, y, { align: 'justify', maxWidth: anchoUtil });
  y += cierre.length * 6;

  // ── Datos del miembro ──
  y += 6;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(margen, y, anchoUtil, 30, 2, 2);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL MIEMBRO', margen + 5, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${datos.miembroNombre}`, margen + 5, y + 14);
  doc.text(`Cédula de identidad: ${datos.miembroCi || 'No registrada'}`, margen + 5, y + 20);
  doc.text(`Iglesia de origen: ${datos.iglesiaOrigen}`, margen + 5, y + 26);

  const mitad = margen + anchoUtil / 2;
  doc.text(`Iglesia de destino: ${datos.iglesiaDestino}`, mitad, y + 14);
  doc.text(`Fecha de solicitud: ${datos.fecha.toLocaleDateString('es-ES')}`, mitad, y + 20);

  y += 45;

  // ── Firma ──
  const centroFirma = anchoPagina / 2;
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.4);
  doc.line(centroFirma - 35, y, centroFirma + 35, y);

  y += 6;
  doc.setFontSize(10.5);
  const pastorOrigen = soloNombre(datos.pastorOrigen);
  if (pastorOrigen && !/por asignar/i.test(pastorOrigen)) {
    doc.setFont('helvetica', 'bold');
    doc.text(pastorOrigen, centroFirma, y, { align: 'center' });
    y += 5.5;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Pastor(a) — ${datos.iglesiaOrigen}`, centroFirma, y, { align: 'center' });

  // ── Pie ──
  const alto = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text(
    'Documento generado por el sistema de gestión de la iglesia. Requiere firma y sello para su validez.',
    anchoPagina / 2, alto - 15, { align: 'center' }
  );

  const nombreArchivo = `Carta_Traspaso_${datos.miembroNombre.replace(/\s+/g, '_')}.pdf`;
  doc.save(nombreArchivo);
}
