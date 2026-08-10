import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { forkJoin } from 'rxjs';
import { Certificado } from '../../../../core/models/certificado.model';
import { ParticipacionEvento } from '../../../../core/models/participacion-evento.model';
import { ParticipacionEventoService } from '../../../../core/services/participacion-evento.service';
import { MiembroService } from '../../../../core/services/miembro.service';
import { PlantillaCertificadoService } from '../../../../core/services/plantilla-certificado.service';
import { PlantillaCertificado } from '../../../../core/models/plantilla-certificado.model';
import { CertificadoRenderComponent } from '../certificado-render/certificado-render.component';
import { MiembroFormEditarComponent } from '../../miembro/miembro-edit/miembro-edit.component';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import {
  normalizarElementos, valorElementoCertificado, dimensionesCanvas, formatoPdf,
  FormatoHoja, OrientacionHoja
} from '../../../../core/utils/certificado-elementos';
import { QRCodeModule } from 'angularx-qrcode';
import { environment } from '../../../../../environments/environment';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface DragElement {
  id: string;
  type?: 'text' | 'qr';
  label: string;
  x: number;
  y: number;
  fontSize?: number;
  color?: string;
  width?: number;
  centrado?: boolean;
  value?: string;
}

@Component({
  selector: 'app-certificado-print-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatCheckboxModule,
    ImageUrlPipe,
    QRCodeModule,
    CertificadoRenderComponent
  ],
  templateUrl: './certificado-print-dialog.component.html',
  styleUrls: ['./certificado-print-dialog.component.css']
})
export class CertificadoPrintDialogComponent implements OnInit {
  certificado: Certificado;
  participantes: ParticipacionEvento[] = [];
  loading = false;
  printingAll = false;
  printingProgress = '';

  // Configuración de la plantilla para el canvas invisible
  plantilla?: PlantillaCertificado;
  orientacion: OrientacionHoja = 'horizontal';
  formatoHoja: FormatoHoja = 'a4';

  get anchoCanvas(): number {
    return dimensionesCanvas(this.formatoHoja, this.orientacion).ancho;
  }

  get altoCanvas(): number {
    return dimensionesCanvas(this.formatoHoja, this.orientacion).alto;
  }

  // Variables reactivas para el renderizado por participante en el bucle
  currentPrintingPart: ParticipacionEvento | null = null;
  printingElements: DragElement[] = [];
  printingQrData: string = '';

  dataSource = new MatTableDataSource<ParticipacionEvento>([]);
  displayedColumns: string[] = ['select', 'miembro', 'contacto', 'entrega', 'acciones'];
  selection = new SelectionModel<ParticipacionEvento>(true, []);

  /**
   * Datos del miembro que deben estar completos para poder emitir su certificado.
   * Son los mismos campos obligatorios del registro de miembros.
   */
  private readonly camposRequeridos: { campo: string; etiqueta: string }[] = [
    { campo: 'nombre', etiqueta: 'Nombre' },
    { campo: 'apellido', etiqueta: 'Apellido' },
    { campo: 'ci', etiqueta: 'CI' },
    { campo: 'fechaNac', etiqueta: 'Fecha de nacimiento' },
    { campo: 'sexo', etiqueta: 'Sexo' },
    { campo: 'celular', etiqueta: 'Celular' }
  ];

  /**
   * Datos complementarios del miembro (sección "Datos adicionales" del registro).
   * No bloquean la impresión, pero se informan en la columna para saber qué falta
   * por completar en la ficha del miembro.
   */
  private readonly camposAdicionales: { campo: string; etiqueta: string }[] = [
    { campo: 'direccion', etiqueta: 'Dirección' },
    { campo: 'localidadNacimiento', etiqueta: 'Localidad de nacimiento' },
    { campo: 'provincia', etiqueta: 'Provincia' },
    { campo: 'departamento', etiqueta: 'Departamento' },
    { campo: 'nombrePadre', etiqueta: 'Nombre del padre' },
    { campo: 'nombreMadre', etiqueta: 'Nombre de la madre' },
    { campo: 'fechaConvercion', etiqueta: 'Fecha de conversión' },
    { campo: 'lugarConvercion', etiqueta: 'Lugar de conversión' },
    { campo: 'interventores', etiqueta: 'Interventores' }
  ];

  constructor(
    private dialogRef: MatDialogRef<CertificadoPrintDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Certificado,
    private dialog: MatDialog,
    private participacionService: ParticipacionEventoService,
    private miembroService: MiembroService,
    private plantillaService: PlantillaCertificadoService,
    private snackBar: MatSnackBar
  ) {
    this.certificado = data;
  }

  ngOnInit() {
    this.loadData();
    this.loadTemplate();
  }

  loadData() {
    this.loading = true;
    this.selection.clear();
    forkJoin({
      participaciones: this.participacionService.getParticipaciones(),
      miembros: this.miembroService.getMiembros()
    }).subscribe({
      next: (res) => {
        const allParts = res.participaciones.datos || [];
        const allMiembros = res.miembros.datos || [];
        
        this.participantes = allParts.filter(p => p.eventoId === this.certificado.eventoId);
        
        // Mapear los datos de cada miembro
        this.participantes.forEach(p => {
          p.miembroDto = allMiembros.find(m => m.id === p.miembroId);
          p.eventoDto = this.certificado.eventoDto;
        });
        
        this.dataSource.data = this.participantes;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos de impresión:', err);
        this.loading = false;
      }
    });
  }

  loadTemplate() {
    if (this.certificado.plantillaCertificadoId) {
      this.plantillaService.findById(this.certificado.plantillaCertificadoId).subscribe({
        next: (res) => {
          this.plantilla = res.datos;
          if (this.plantilla && this.plantilla.configuracionJson) {
            try {
              const config = JSON.parse(this.plantilla.configuracionJson);
              if (config.orientacion) this.orientacion = config.orientacion;
              if (config.formatoHoja) this.formatoHoja = config.formatoHoja;
            } catch (e) {
              console.error('Error al parsear orientación:', e);
            }
          }
        },
        error: (err) => {
          console.error('Error al cargar plantilla:', err);
        }
      });
    }
  }

  /** Etiquetas de la lista indicada que el miembro no tiene cargadas. */
  private faltantesDe(item: ParticipacionEvento, lista: { campo: string; etiqueta: string }[]): string[] {
    const m: any = item?.miembroDto;
    if (!m) return lista.map(c => c.etiqueta);
    return lista
      .filter(c => {
        const valor = m[c.campo];
        return valor === null || valor === undefined || String(valor).trim() === '';
      })
      .map(c => c.etiqueta);
  }

  /** Campos obligatorios que le faltan al miembro de una participación. */
  camposFaltantes(item: ParticipacionEvento): string[] {
    return this.faltantesDe(item, this.camposRequeridos);
  }

  /** Campos de la sección "Datos adicionales" que le faltan al miembro. */
  adicionalesFaltantes(item: ParticipacionEvento): string[] {
    return this.faltantesDe(item, this.camposAdicionales);
  }

  /** Cantidad total de datos pendientes en la ficha del miembro. */
  totalFaltantes(item: ParticipacionEvento): number {
    return this.camposFaltantes(item).length + this.adicionalesFaltantes(item).length;
  }

  /** Etiqueta corta del botón de la columna Acciones. */
  etiquetaFaltantes(item: ParticipacionEvento): string {
    const n = this.totalFaltantes(item);
    return n === 1 ? 'Falta 1 dato' : `Faltan ${n} datos`;
  }

  /** True si el miembro tiene todos sus datos obligatorios. */
  datosCompletos(item: ParticipacionEvento): boolean {
    return this.camposFaltantes(item).length === 0;
  }

  /** True si la ficha del miembro está completa: obligatorios y adicionales. */
  perfilCompleto(item: ParticipacionEvento): boolean {
    return this.datosCompletos(item) && this.adicionalesFaltantes(item).length === 0;
  }

  /**
   * El certificado solo se emite con la ficha del miembro completa: mientras falte
   * cualquier dato, la columna Acciones muestra "Faltan N dato(s)" en vez del botón
   * de imprimir.
   */
  puedeImprimir(item: ParticipacionEvento): boolean {
    return this.perfilCompleto(item);
  }

  /** Texto para el tooltip: detalle de lo que falta, separado por tipo de dato. */
  detalleFaltantes(item: ParticipacionEvento): string {
    const obligatorios = this.camposFaltantes(item);
    const adicionales = this.adicionalesFaltantes(item);

    if (!obligatorios.length && !adicionales.length) {
      return 'Ficha del miembro completa';
    }

    const partes: string[] = [];
    if (obligatorios.length) {
      partes.push(`Obligatorios (impiden imprimir): ${obligatorios.join(', ')}`);
    }
    if (adicionales.length) {
      partes.push(`Datos adicionales: ${adicionales.join(', ')}`);
    }
    return partes.join('\n');
  }

  /** Participaciones que sí pueden imprimirse (ficha del miembro completa). */
  get participantesImprimibles(): ParticipacionEvento[] {
    return this.dataSource.data.filter(p => this.puedeImprimir(p));
  }

  /** Abre la edición del miembro para completar sus datos y recarga al guardar. */
  completarDatos(item: ParticipacionEvento) {
    if (!item?.miembroDto) {
      this.messageSnackBar('No se encontraron los datos del miembro.', 'error');
      return;
    }

    const ref = this.dialog.open(MiembroFormEditarComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: item.miembroDto
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        // Se recargan los participantes para reflejar los datos actualizados.
        this.loadData();
        this.messageSnackBar('Datos del miembro actualizados.', 'success');
      }
    });
  }

  isAllSelected() {
    // Solo se consideran las filas que se pueden imprimir.
    const imprimibles = this.participantesImprimibles;
    return imprimibles.length > 0 && imprimibles.every(row => this.selection.isSelected(row));
  }

  masterToggle() {
    this.isAllSelected() ?
        this.selection.clear() :
        this.participantesImprimibles.forEach(row => this.selection.select(row));
  }

  printCertificado(participacion: ParticipacionEvento) {
    // No se emite el certificado mientras la ficha del miembro esté incompleta.
    if (!this.puedeImprimir(participacion)) {
      this.messageSnackBar(this.detalleFaltantes(participacion), 'warning');
      return;
    }

    // Vincular el certificado actual a la participación para el renderizado
    participacion.certificadoDto = this.certificado;
    participacion.eventoDto = this.certificado.eventoDto;

    const ref = this.dialog.open(CertificadoRenderComponent, {
      width: '1000px',
      maxWidth: '98vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: { participacion }
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  async printSelectedCertificates() {
    // Se excluyen los miembros con datos incompletos (no se les puede emitir certificado).
    const selectedParts = this.selection.selected.filter(p => this.puedeImprimir(p));
    const omitidos = this.selection.selected.length - selectedParts.length;

    if (selectedParts.length === 0) {
      if (omitidos > 0) {
        this.messageSnackBar('Los miembros seleccionados tienen datos incompletos. Complete sus datos para imprimir.', 'warning');
      }
      return;
    }

    if (omitidos > 0) {
      this.messageSnackBar(`${omitidos} certificado(s) omitido(s) por datos incompletos del miembro.`, 'warning');
    }

    if (!this.plantilla) {
      this.messageSnackBar('Este certificado no tiene una plantilla asociada para imprimir.', 'error');
      return;
    }
    
    this.printingAll = true;
    let count = 0;
    
    for (const part of selectedParts) {
      count++;
      this.printingProgress = `Generando PDF ${count} de ${selectedParts.length}...`;
      
      // Establecer miembro activo para renderizado
      this.currentPrintingPart = part;
      
      // Parsear la configuración del canvas para inyectar sus datos
      if (this.plantilla.configuracionJson) {
        try {
          const config = JSON.parse(this.plantilla.configuracionJson);
          if (config.elements) {
            this.printingElements = normalizarElementos(config.elements).map((el: any) => {
              const newEl = { ...el };
              if (newEl.type === 'text') {
                newEl.value = valorElementoCertificado(newEl.id, part);
              }
              return newEl;
            });
          }
        } catch (e) {
          console.error('Error al procesar elementos del canvas:', e);
        }
      }
      
      // El QR lleva el token; el código corto solo como respaldo. Ruta corta /v/
      // para que el dibujo tenga menos módulos.
      const claveVerificacion = part.tokenVerificacion || part.codigoUnico || '';
      this.printingQrData = `${environment.apiUrl}/v/${claveVerificacion}`;
      
      // Esperar brevemente a que el DOM dibuje el canvas oculto y carguen las imágenes
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const canvasElement = document.getElementById('hidden-render-canvas');
      if (canvasElement) {
        try {
          // Se fija el área exacta del lienzo (tamaño de hoja a 96 DPI) para que
          // la captura no dependa del scroll ni del tamaño de la ventana.
          const canvas = await html2canvas(canvasElement, {
            scale: 2,
            useCORS: true,
            width: this.anchoCanvas,
            height: this.altoCanvas,
            windowWidth: this.anchoCanvas,
            windowHeight: this.altoCanvas,
            scrollX: 0,
            scrollY: 0
          });
          const imgData = canvas.toDataURL('image/png');
          
          const pdf = new jsPDF({
            orientation: this.orientacion === 'horizontal' ? 'l' : 'p',
            unit: 'mm',
            format: formatoPdf(this.formatoHoja)
          });

          const width = pdf.internal.pageSize.getWidth();
          const height = pdf.internal.pageSize.getHeight();
          
          pdf.addImage(imgData, 'PNG', 0, 0, width, height);
          pdf.save(`Certificado_${part.miembroDto?.nombre || 'Miembro'}_${part.miembroDto?.apellido || 'Apellido'}.pdf`);

          // La entrega NO se registra aquí: se asienta al generar el PDF desde la
          // vista previa individual, que es donde se cargan el libro y el folio.
        } catch (error) {
          console.error('Error generando PDF para el participante:', part, error);
        }
      }
    }
    
    this.printingAll = false;
    this.currentPrintingPart = null;
    this.printingProgress = '';
    this.messageSnackBar(
      'PDFs generados. La entrega no queda registrada en lote: ábralos uno por uno para asentar libro y folio.',
      'warning'
    );
    this.loadData();
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const placeholder = img.nextElementSibling as HTMLElement;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

  messageSnackBar(message: string, type: 'success' | 'warning' | 'error' = 'success') {
    const panelClass = type === 'success' ? 'success-snackbar' : type === 'warning' ? 'warning-snackbar' : 'error-snackbar';
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: [panelClass]
    });
  }
}