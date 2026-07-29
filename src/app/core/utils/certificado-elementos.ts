/**
 * Catálogo de elementos del diseñador de plantillas de certificado y resolución
 * de su valor real al imprimir.
 *
 * El diseñador, la vista previa individual (certificado-render) y la impresión
 * por lote (certificado-print-dialog) comparten estas definiciones para que un
 * elemento nuevo no haya que darlo de alta en tres sitios distintos.
 */

export type FormatoHoja = 'a4' | 'carta' | 'oficio';
export type OrientacionHoja = 'horizontal' | 'vertical';

/**
 * Tamaños de hoja disponibles. Los píxeles son la medida a 96 DPI (la que usa el
 * navegador para dibujar el lienzo) y los milímetros los que recibe jsPDF.
 */
export const FORMATOS_HOJA: Record<FormatoHoja, {
  etiqueta: string; anchoPx: number; altoPx: number; anchoMm: number; altoMm: number;
}> = {
  a4:     { etiqueta: 'A4 (210 × 297 mm)',     anchoPx: 794, altoPx: 1123, anchoMm: 210,   altoMm: 297 },
  carta:  { etiqueta: 'Carta (216 × 279 mm)',  anchoPx: 816, altoPx: 1056, anchoMm: 215.9, altoMm: 279.4 },
  oficio: { etiqueta: 'Oficio (216 × 330 mm)', anchoPx: 816, altoPx: 1247, anchoMm: 216,   altoMm: 330 }
};

/** Medidas del lienzo en píxeles según formato y orientación. */
export function dimensionesCanvas(formato: FormatoHoja | undefined, orientacion: OrientacionHoja) {
  const hoja = FORMATOS_HOJA[formato || 'a4'] || FORMATOS_HOJA['a4'];
  return orientacion === 'horizontal'
    ? { ancho: hoja.altoPx, alto: hoja.anchoPx }
    : { ancho: hoja.anchoPx, alto: hoja.altoPx };
}

/** Medidas en milímetros (vertical) para el formato de página de jsPDF. */
export function formatoPdf(formato: FormatoHoja | undefined): [number, number] {
  const hoja = FORMATOS_HOJA[formato || 'a4'] || FORMATOS_HOJA['a4'];
  return [hoja.anchoMm, hoja.altoMm];
}

export interface ElementoCertificadoDef {
  id: string;
  type: 'text' | 'qr';
  label: string;
  x: number;
  y: number;
  fontSize?: number;
  color?: string;
  width?: number;
  /**
   * Texto centrado dentro de un ancho fijo. Sirve cuando el valor real es mucho
   * más corto que la etiqueta de diseño (el código de verificación bajo el QR,
   * por ejemplo): sin esto el texto se alinea a la izquierda y queda descentrado
   * respecto de lo que se diseñó.
   */
  centrado?: boolean;
}

/** Elementos que se ofrecen en el lienzo de una plantilla nueva. */
export const ELEMENTOS_CERTIFICADO: ElementoCertificadoDef[] = [
  { id: 'nombre_miembro', type: 'text', label: '[Nombre del Miembro]', x: 100, y: 150, fontSize: 24, color: '#000000' },

  // Fecha de la participación, desglosada para redactar frases del tipo
  // "el 5 de abril de 2026".
  { id: 'part_dia', type: 'text', label: '[Día Evento]', x: 100, y: 220, fontSize: 16, color: '#000000' },
  { id: 'part_mes', type: 'text', label: '[Mes Evento]', x: 200, y: 220, fontSize: 16, color: '#000000' },
  { id: 'part_anio', type: 'text', label: '[Año Evento]', x: 330, y: 220, fontSize: 16, color: '#000000' },

  // Fecha de nacimiento desglosada
  { id: 'nac_dia', type: 'text', label: '[Día Nac.]', x: 100, y: 300, fontSize: 16, color: '#000000' },
  { id: 'nac_mes', type: 'text', label: '[Mes Nac.]', x: 200, y: 300, fontSize: 16, color: '#000000' },
  { id: 'nac_anio', type: 'text', label: '[Año Nac.]', x: 330, y: 300, fontSize: 16, color: '#000000' },

  // Lugar de nacimiento del miembro
  { id: 'localidad', type: 'text', label: '[Localidad Nac.]', x: 100, y: 350, fontSize: 16, color: '#000000' },
  { id: 'provincia', type: 'text', label: '[Provincia Nac.]', x: 300, y: 350, fontSize: 16, color: '#000000' },
  { id: 'departamento', type: 'text', label: '[Departamento Nac.]', x: 520, y: 350, fontSize: 16, color: '#000000' },

  // Filiación
  { id: 'nombre_padre', type: 'text', label: '[Nombre del Padre]', x: 100, y: 400, fontSize: 16, color: '#000000' },
  { id: 'nombre_madre', type: 'text', label: '[Nombre de la Madre]', x: 100, y: 440, fontSize: 16, color: '#000000' },

  // Lugar donde se realizó el evento
  { id: 'evento_localidad', type: 'text', label: '[Localidad Evento]', x: 100, y: 490, fontSize: 16, color: '#000000' },
  { id: 'evento_provincia', type: 'text', label: '[Provincia Evento]', x: 300, y: 490, fontSize: 16, color: '#000000' },
  { id: 'evento_departamento', type: 'text', label: '[Departamento Evento]', x: 520, y: 490, fontSize: 16, color: '#000000' },

  // Registro físico: se cargan en la vista previa justo antes de emitir el PDF
  { id: 'numero_libro', type: 'text', label: '[N° Libro]', x: 100, y: 545, fontSize: 14, color: '#000000' },
  { id: 'numero_folio', type: 'text', label: '[N° Folio]', x: 250, y: 545, fontSize: 14, color: '#000000' },

  { id: 'qr', type: 'qr', label: '[Código QR]', x: 50, y: 50, width: 100 },
  { id: 'codigo_verificacion', type: 'text', label: '[Código de Verificación]', x: 100, y: 590, fontSize: 12, color: '#666666', centrado: true, width: 200 }
];

/**
 * Elementos retirados del diseñador. Se filtran al cargar plantillas antiguas
 * para que dejen de imprimirse sin tener que editar cada plantilla guardada.
 */
export const ELEMENTOS_OBSOLETOS: string[] = [
  'nombre_evento',
  // La fecha completa se sustituyó por el desglose part_dia / part_mes / part_anio
  'fecha'
];

const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

/**
 * Convierte a Date respetando el día tal cual viene del backend.
 * Con `new Date('1990-03-12')` el navegador interpreta UTC y en Bolivia (UTC-4)
 * el día retrocede al 11: por eso las fechas sin hora se arman a mano.
 */
export function parseFechaLocal(valor: any): Date | null {
  if (!valor) return null;
  if (valor instanceof Date) return isNaN(valor.getTime()) ? null : valor;

  const texto = String(valor);
  const soloFecha = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (soloFecha) {
    return new Date(+soloFecha[1], +soloFecha[2] - 1, +soloFecha[3]);
  }

  const fecha = new Date(texto);
  return isNaN(fecha.getTime()) ? null : fecha;
}

/** Devuelve el texto que corresponde a un elemento para una participación dada. */
export function valorElementoCertificado(id: string, participacion: any): string {
  const miembro: any = participacion?.miembroDto;
  // El evento no viaja dentro de la participación: lo adjunta el frontend, ya
  // sea directamente o a través del certificado.
  const evento: any = participacion?.eventoDto || participacion?.certificadoDto?.eventoDto;

  const nacimiento = parseFechaLocal(miembro?.fechaNac);
  // La fecha de la participación es la de su registro (createdAt)
  const fechaParticipacion = parseFechaLocal(participacion?.createdAt);

  switch (id) {
    case 'nombre_miembro':
      return miembro ? `${miembro.nombre ?? ''} ${miembro.apellido ?? ''}`.trim() : '';

    case 'part_dia':
      return fechaParticipacion ? String(fechaParticipacion.getDate()) : '';
    case 'part_mes':
      return fechaParticipacion ? MESES_ES[fechaParticipacion.getMonth()] : '';
    case 'part_anio':
      return fechaParticipacion ? String(fechaParticipacion.getFullYear()) : '';

    case 'nac_dia':
      return nacimiento ? String(nacimiento.getDate()) : '';
    case 'nac_mes':
      return nacimiento ? MESES_ES[nacimiento.getMonth()] : '';
    case 'nac_anio':
      return nacimiento ? String(nacimiento.getFullYear()) : '';

    case 'localidad':
      return miembro?.localidadNacimiento || '';
    case 'provincia':
      return miembro?.provincia || '';
    case 'departamento':
      return miembro?.departamento || '';

    case 'nombre_padre':
      return miembro?.nombrePadre || '';
    case 'nombre_madre':
      return miembro?.nombreMadre || '';

    case 'evento_localidad':
      return evento?.localidad || '';
    case 'evento_provincia':
      return evento?.provincia || '';
    case 'evento_departamento':
      return evento?.departamento || '';

    case 'numero_libro':
      return participacion?.numeroLibro || '';
    case 'numero_folio':
      return participacion?.numeroFolio || '';

    case 'codigo_verificacion':
      return participacion?.codigoUnico || '';

    default:
      return '';
  }
}

/**
 * Normaliza los elementos guardados en una plantilla: descarta los obsoletos,
 * deduce el `type` de las plantillas antiguas que no lo guardaban, aplica los
 * anchos por defecto de las imágenes y da de alta los elementos de texto que
 * aún no existían cuando se guardó la plantilla.
 */
export function normalizarElementos(guardados: any[]): any[] {
  const elementos = (guardados || [])
    .filter(el => !ELEMENTOS_OBSOLETOS.includes(el.id))
    .map(el => {
      if (!el.type) {
        if (el.id === 'qr') el.type = 'qr';
        else if (el.id === 'logo') el.type = 'logo';
        else if (el.id === 'firma') el.type = 'firma';
        else if (el.id === 'marcaAgua') el.type = 'marcaAgua';
        else el.type = 'text';
      }
      if (el.type === 'qr' && !el.width) el.width = 100;
      if (el.type === 'logo' && !el.width) el.width = 100;
      if (el.type === 'firma' && !el.width) el.width = 150;
      if (el.type === 'marcaAgua' && !el.width) el.width = 400;

      // La etiqueta es solo el texto guía del diseñador: se toma siempre del
      // catálogo para que un cambio de nombre alcance a las plantillas viejas.
      const def = ELEMENTOS_CERTIFICADO.find(d => d.id === el.id);
      if (def) {
        el.label = def.label;
        // El centrado se hereda del catálogo solo si la plantilla no decidió nada
        if (el.centrado === undefined) el.centrado = def.centrado ?? false;
        if (el.centrado && !el.width) el.width = def.width ?? 200;
      }

      return el;
    });

  // Elementos incorporados después de que se guardara la plantilla
  ELEMENTOS_CERTIFICADO.forEach(def => {
    if (!elementos.some(el => el.id === def.id)) {
      elementos.push({ ...def });
    }
  });

  return elementos;
}
