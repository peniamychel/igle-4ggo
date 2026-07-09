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
import { forkJoin, firstValueFrom } from 'rxjs';
import { Certificado } from '../../../../core/models/certificado.model';
import { ParticipacionEvento } from '../../../../core/models/participacion-evento.model';
import { ParticipacionEventoService } from '../../../../core/services/participacion-evento.service';
import { MiembroService } from '../../../../core/services/miembro.service';
import { PlantillaCertificadoService } from '../../../../core/services/plantilla-certificado.service';
import { PlantillaCertificado } from '../../../../core/models/plantilla-certificado.model';
import { CertificadoRenderComponent } from '../certificado-render/certificado-render.component';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { QRCodeModule } from 'angularx-qrcode';
import { environment } from '../../../../../environments/environment';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface DragElement {
  id: string;
  type?: 'text' | 'qr' | 'logo' | 'firma' | 'marcaAgua';
  label: string;
  x: number;
  y: number;
  fontSize?: number;
  color?: string;
  width?: number;
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
  orientacion: 'horizontal' | 'vertical' = 'horizontal';
  logoUrl?: string;
  marcaAguaUrl?: string;
  firmaUrl?: string;

  // Variables reactivas para el renderizado por participante en el bucle
  currentPrintingPart: ParticipacionEvento | null = null;
  printingElements: DragElement[] = [];
  printingQrData: string = '';

  dataSource = new MatTableDataSource<ParticipacionEvento>([]);
  displayedColumns: string[] = ['select', 'miembro', 'contacto', 'entrega', 'acciones'];
  selection = new SelectionModel<ParticipacionEvento>(true, []);

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
            } catch (e) {
              console.error('Error al parsear orientación:', e);
            }
          }
          const baseUrl = `${environment.apiUrl}/uploads/plantillas/`;
          if (this.plantilla?.uriLogo) this.logoUrl = baseUrl + this.plantilla.uriLogo;
          if (this.plantilla?.uriMarcaAgua) this.marcaAguaUrl = baseUrl + this.plantilla.uriMarcaAgua;
          if (this.plantilla?.uriFirma) this.firmaUrl = baseUrl + this.plantilla.uriFirma;
        },
        error: (err) => {
          console.error('Error al cargar plantilla:', err);
        }
      });
    }
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
        this.selection.clear() :
        this.dataSource.data.forEach(row => this.selection.select(row));
  }

  printCertificado(participacion: ParticipacionEvento) {
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
    const selectedParts = this.selection.selected;
    if (selectedParts.length === 0) return;

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
            const hasCodigo = config.elements.some((el: any) => el.id === 'codigo_verificacion');
            const finalElements = [...config.elements];
            if (!hasCodigo) {
              finalElements.push({
                id: 'codigo_verificacion',
                type: 'text',
                label: '[Código de Verificación]',
                x: 100,
                y: 300,
                fontSize: 12,
                color: '#666666'
              });
            }

            this.printingElements = finalElements.map((el: any) => {
              const newEl = { ...el };
              if (newEl.id === 'nombre_miembro') {
                newEl.value = `${part.miembroDto?.nombre} ${part.miembroDto?.apellido}`;
              }
              if (newEl.id === 'nombre_evento') {
                newEl.value = part.eventoDto?.nombre || this.certificado.eventoDto?.nombre || '';
              }
              if (newEl.id === 'fecha') {
                newEl.value = new Date(part.fecha).toLocaleDateString();
              }
              if (newEl.id === 'codigo_verificacion') {
                newEl.value = part.codigoUnico || '';
              }
              return newEl;
            });
          }
        } catch (e) {
          console.error('Error al procesar elementos del canvas:', e);
        }
      }
      
      const uniqueCode = part.codigoUnico || '';
      this.printingQrData = `${environment.apiUrl}/verificar-certificado/${uniqueCode}`;
      
      // Esperar brevemente a que el DOM dibuje el canvas oculto y carguen las imágenes
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const canvasElement = document.getElementById('hidden-render-canvas');
      if (canvasElement) {
        try {
          const canvas = await html2canvas(canvasElement, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL('image/png');
          
          const pdf = new jsPDF({
            orientation: this.orientacion === 'horizontal' ? 'l' : 'p',
            unit: 'mm',
            format: 'a4'
          });

          const width = pdf.internal.pageSize.getWidth();
          const height = pdf.internal.pageSize.getHeight();
          
          pdf.addImage(imgData, 'PNG', 0, 0, width, height);
          pdf.save(`Certificado_${part.miembroDto?.nombre || 'Miembro'}_${part.miembroDto?.apellido || 'Apellido'}.pdf`);
          
          // Registrar entrega y vincular certificado
          if (part.id && this.certificado.id) {
            await firstValueFrom(this.participacionService.toggleEntregadoConCertificado(part.id, this.certificado.id));
          }
        } catch (error) {
          console.error('Error generando PDF para el participante:', part, error);
        }
      }
    }
    
    this.printingAll = false;
    this.currentPrintingPart = null;
    this.printingProgress = '';
    this.messageSnackBar('Los certificados seleccionados se han generado e impreso exitosamente.');
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