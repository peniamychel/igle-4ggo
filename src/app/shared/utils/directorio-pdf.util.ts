import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Fila mínima requerida para el directorio de miembros en PDF.
 * Compatible con el modelo `Miembro`.
 */
export interface DirectorioMiembroRow {
  nombre?: string;
  apellido?: string;
  ci?: number | string;
  celular?: string;
  direccion?: string;
  iglesiaNombre?: string;
  cargoNombre?: string;
}

export interface DirectorioPdfOptions {
  /** Segunda línea de título. Por defecto "Directorio General de Miembros". */
  subtitulo?: string;
  /** Nombre del archivo descargado. Por defecto "Directorio_Miembros.pdf". */
  fileName?: string;
}

/**
 * Genera el "Directorio de Miembros" en PDF con el diseño institucional único
 * (usado por el rol administrador y por la vista del pastor). Recibe las filas
 * ya filtradas por quien llama, de modo que el filtro por iglesia se refleja en
 * el subtítulo y en los datos.
 */
export function generarDirectorioMiembrosPdf(
  miembros: DirectorioMiembroRow[],
  opts: DirectorioPdfOptions = {}
): void {
  const doc = new jsPDF();

  const tableColumn = ['Nombre Completo', 'CI', 'Celular', 'Dirección', 'Iglesia', 'Cargo'];
  const tableRows = miembros.map(m => [
    `${m.nombre ?? ''} ${m.apellido ?? ''}`.trim(),
    m.ci != null && m.ci !== '' ? String(m.ci) : 'Sin CI',
    m.celular || 'Sin celular',
    m.direccion || 'Sin dirección',
    m.iglesiaNombre || 'Sin Iglesia',
    m.cargoNombre || 'Miembro'
  ]);

  doc.setFontSize(18);
  doc.text('Movimiento Cristiano Misionero Maranatha', 14, 15);
  doc.setFontSize(14);
  doc.text(opts.subtitulo || 'Directorio General de Miembros', 14, 23);
  doc.setFontSize(10);
  doc.text(`Total Registros: ${miembros.length}`, 14, 30);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 30);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 35,
    theme: 'striped',
    headStyles: { fillColor: [127, 11, 133] }, // morado institucional
    margin: { top: 35 }
  });

  doc.save(opts.fileName || 'Directorio_Miembros.pdf');
}
