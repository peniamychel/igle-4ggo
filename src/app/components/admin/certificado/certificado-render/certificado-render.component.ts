import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ParticipacionEvento } from '../../../../core/models/participacion-evento.model';
import { PlantillaCertificado } from '../../../../core/models/plantilla-certificado.model';
import { PlantillaCertificadoService } from '../../../../core/services/plantilla-certificado.service';
import { environment } from '../../../../../environments/environment';
import { QRCodeModule } from 'angularx-qrcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Miembro } from '../../../../core/models/miembro.model';

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
  selector: 'app-certificado-render',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, QRCodeModule],
  templateUrl: './certificado-render.component.html',
  styleUrls: ['./certificado-render.component.css']
})
export class CertificadoRenderComponent implements OnInit {

  private plantillaService = inject(PlantillaCertificadoService);

  plantilla?: PlantillaCertificado;
  elements: DragElement[] = [];
  orientacion: 'horizontal' | 'vertical' = 'horizontal';

  logoUrl?: string;
  marcaAguaUrl?: string;
  firmaUrl?: string;

  qrData: string = '';
  loading = true;

  constructor(
    public dialogRef: MatDialogRef<CertificadoRenderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { participacion: ParticipacionEvento }
  ) {}

  ngOnInit() {
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
    const uniqueCode = this.data.participacion?.codigoUnico || certDto?.codigoCertificado;
    this.qrData = `${environment.apiUrl}/verificar-certificado/${uniqueCode}`;
  }

  getMiembroNombre(miembro?: Miembro): string {
    if (!miembro || !miembro.personaDto) return '';
    return `${miembro.personaDto.nombre} ${miembro.personaDto.apellido}`;
  }

  loadConfig() {
    if (!this.plantilla) return;

    if (this.plantilla.configuracionJson) {
      try {
        const config = JSON.parse(this.plantilla.configuracionJson);
        if (config.elements) {
          this.elements = config.elements.map((el: any) => {
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
            return el;
          });
          
          // Map values
          this.elements.forEach(el => {
            if (el.id === 'nombre_miembro') el.value = this.getMiembroNombre(this.data.participacion.miembroDto);
            if (el.id === 'nombre_evento') el.value = this.data.participacion.eventoDto?.nombre || '';
            if (el.id === 'fecha') el.value = new Date(this.data.participacion.fecha).toLocaleDateString();
          });
        }
        if (config.orientacion) this.orientacion = config.orientacion;
      } catch (e) {
        console.error("Error parsing config JSON", e);
      }
    }
    const baseUrl = `${environment.apiUrl}/uploads/plantillas/`;
    if (this.plantilla.uriLogo) this.logoUrl = baseUrl + this.plantilla.uriLogo;
    if (this.plantilla.uriMarcaAgua) this.marcaAguaUrl = baseUrl + this.plantilla.uriMarcaAgua;
    if (this.plantilla.uriFirma) this.firmaUrl = baseUrl + this.plantilla.uriFirma;
  }

  async downloadPdf() {
    const canvasElement = document.getElementById('render-canvas');
    if (canvasElement) {
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
      pdf.save(`Certificado_${this.data.participacion.certificadoDto?.codigoCertificado}.pdf`);
      this.dialogRef.close(true);
    }
  }

}
