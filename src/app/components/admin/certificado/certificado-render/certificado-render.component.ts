import { Component, Inject, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ParticipacionEvento } from '../../../../core/models/participacion-evento.model';
import { PlantillaCertificado } from '../../../../core/models/plantilla-certificado.model';
import { PlantillaCertificadoService } from '../../../../core/services/plantilla-certificado.service';
import { ParticipacionEventoService } from '../../../../core/services/participacion-evento.service';
import { environment } from '../../../../../environments/environment';
import { QRCodeModule } from 'angularx-qrcode';
import { firstValueFrom } from 'rxjs';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  normalizarElementos, valorElementoCertificado, dimensionesCanvas, formatoPdf,
  FormatoHoja, OrientacionHoja
} from '../../../../core/utils/certificado-elementos';

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
  selector: 'app-certificado-render',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatIconModule, QRCodeModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule, FormsModule, MatTooltipModule
  ],
  templateUrl: './certificado-render.component.html',
  styleUrls: ['./certificado-render.component.css']
})
export class CertificadoRenderComponent implements OnInit {

  private plantillaService = inject(PlantillaCertificadoService);
  private participacionService = inject(ParticipacionEventoService);

  plantilla?: PlantillaCertificado;
  elements: DragElement[] = [];
  orientacion: OrientacionHoja = 'horizontal';
  formatoHoja: FormatoHoja = 'a4';

  qrData: string = '';
  loading = true;

  // Libro y folio del registro físico: sin ambos no se genera el PDF, y al
  // generarlo es cuando la participación queda registrada como entregada.
  numeroLibro = '';
  numeroFolio = '';
  guardando = false;

  // El lienzo mide siempre A4 en píxeles (96 DPI); previewScale solo lo encoge
  // visualmente para que quepa en el diálogo, sin tocar las coordenadas.
  previewScale = 1;

  get anchoCanvas(): number {
    return dimensionesCanvas(this.formatoHoja, this.orientacion).ancho;
  }

  get altoCanvas(): number {
    return dimensionesCanvas(this.formatoHoja, this.orientacion).alto;
  }

  constructor(
    public dialogRef: MatDialogRef<CertificadoRenderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { participacion: ParticipacionEvento },
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Si es una reimpresión, se muestran el libro y folio ya asentados
    this.numeroLibro = this.data.participacion.numeroLibro || '';
    this.numeroFolio = this.data.participacion.numeroFolio || '';

    const certDto = this.data.participacion.certificadoDto;
    if (certDto && certDto.plantillaCertificadoId) {
      this.plantillaService.findById(certDto.plantillaCertificadoId).subscribe({
        next: (res) => {
          this.plantilla = res.datos;
          this.loadConfig();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar la plantilla', err);
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
    
    // Generate QR Code using the unique code of the participation if available, else fallback to generic certificate code
    // El QR lleva el token (UUID): al ser imposible de adivinar, quien lo escanea
    // ve la verificación completa. El código corto queda como respaldo para las
    // participaciones antiguas que todavía no tienen token.
    const claveVerificacion = this.data.participacion?.tokenVerificacion
      || this.data.participacion?.codigoUnico
      || '';
    // Ruta corta /v/: cada carácter de más agranda el dibujo del QR
    this.qrData = `${environment.apiUrl}/v/${claveVerificacion}`;
  }

  loadConfig() {
    if (!this.plantilla) return;

    if (this.plantilla.configuracionJson) {
      try {
        const config = JSON.parse(this.plantilla.configuracionJson);
        if (config.elements) {
          this.elements = normalizarElementos(config.elements);

          // Cada elemento de texto resuelve su valor con el catálogo compartido
          this.elements.forEach(el => {
            if (el.type === 'text') {
              el.value = valorElementoCertificado(el.id, this.data.participacion);
            }
          });
        }
        if (config.orientacion) this.orientacion = config.orientacion;
        if (config.formatoHoja) this.formatoHoja = config.formatoHoja;
        this.ajustarPreview();
      } catch (e) {
        console.error("Error parsing config JSON", e);
      }
    }
  }

  /** Calcula cuánto hay que encoger el lienzo para que entre en el diálogo. */
  ajustarPreview() {
    const anchoDisponible = Math.min(window.innerWidth * 0.98, 1000) - 60;
    this.previewScale = Math.min(1, anchoDisponible / this.anchoCanvas);
  }

  @HostListener('window:resize')
  onResize() {
    this.ajustarPreview();
  }

  /** El PDF solo se habilita con libro y folio cargados. */
  get datosRegistroCompletos(): boolean {
    return this.numeroLibro.trim().length > 0 && this.numeroFolio.trim().length > 0;
  }

  /**
   * Refleja en el lienzo lo que se va escribiendo en libro y folio: esos dos
   * elementos son los únicos cuyo valor no existe todavía al abrir la vista
   * previa, se cargan en este mismo momento.
   */
  sincronizarRegistro() {
    this.data.participacion.numeroLibro = this.numeroLibro.trim();
    this.data.participacion.numeroFolio = this.numeroFolio.trim();

    this.elements.forEach(el => {
      if (el.id === 'numero_libro' || el.id === 'numero_folio') {
        el.value = valorElementoCertificado(el.id, this.data.participacion);
      }
    });
  }

  /**
   * Genera el PDF y, en el mismo acto, asienta la entrega: libro, folio,
   * certificado, fecha y usuario. Si el registro falla no se descarga nada,
   * para que no circule un certificado sin constancia en el sistema.
   */
  async downloadPdf() {
    if (!this.datosRegistroCompletos || this.guardando) return;

    const participacion = this.data.participacion;
    const certId = participacion.certificadoDto?.id || participacion.certificadoId;

    if (!participacion.id || !certId) {
      this.snackBar.open('No se pudo identificar el certificado de esta participación.', 'Cerrar', {
        duration: 4000, panelClass: ['snackbar-error']
      });
      return;
    }

    const canvasElement = document.getElementById('render-canvas');
    if (!canvasElement) return;

    this.guardando = true;
    try {
      // Primero se asienta la entrega: si el backend rechaza, no se emite el PDF.
      await firstValueFrom(this.participacionService.registrarEntrega(
        participacion.id, certId, this.numeroLibro.trim(), this.numeroFolio.trim()
      ));

      // El libro y el folio deben estar dibujados antes de capturar el lienzo, y
      // el lienzo debe volver a su tamaño real: si se captura reducido, el PDF
      // sale recortado y deformado.
      this.sincronizarRegistro();
      this.previewScale = 1;
      await new Promise(resolve => setTimeout(resolve, 80));

      const canvas = await html2canvas(canvasElement, {
        scale: 2,
        useCORS: true,
        // Se fija el área exacta del lienzo para que el scroll del contenedor no
        // recorte la captura.
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
      pdf.save(`Certificado_${participacion.miembroDto?.nombre || 'Miembro'}_${participacion.miembroDto?.apellido || 'Apellido'}.pdf`);

      this.dialogRef.close(true);
    } catch (err) {
      console.error('Error al registrar la entrega del certificado:', err);
      this.snackBar.open('No se pudo registrar la entrega. El PDF no se generó.', 'Cerrar', {
        duration: 5000, panelClass: ['snackbar-error']
      });
    } finally {
      this.guardando = false;
      // Devuelve el lienzo a su tamaño de pantalla aunque la captura haya fallado
      this.ajustarPreview();
    }
  }

}
