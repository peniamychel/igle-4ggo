import { Component, Inject, OnInit, AfterViewInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PlantillaCertificado } from '../../../../core/models/plantilla-certificado.model';
import { PlantillaCertificadoService } from '../../../../core/services/plantilla-certificado.service';
import { FormsModule } from '@angular/forms';
import { NgxImageCompressService } from 'ngx-image-compress';
import { environment } from '../../../../../environments/environment';

export interface DragElement {
  id: string;
  type?: 'text' | 'qr' | 'logo' | 'firma' | 'marcaAgua';
  label: string;
  x: number;
  y: number;
  fontSize?: number;
  color?: string;
  width?: number;
}

@Component({
  selector: 'app-certificado-designer',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, DragDropModule, MatButtonModule, MatIconModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDividerModule, MatTooltipModule
  ],
  templateUrl: './certificado-designer.component.html',
  styleUrls: ['./certificado-designer.component.css']
})
export class CertificadoDesignerComponent implements OnInit, AfterViewInit {

  private plantillaService = inject(PlantillaCertificadoService);
  private imageCompress = inject(NgxImageCompressService);

  plantilla: PlantillaCertificado;
  
  elements: DragElement[] = [
    { id: 'nombre_miembro', type: 'text', label: '[Nombre del Miembro]', x: 100, y: 150, fontSize: 24, color: '#000000' },
    { id: 'nombre_evento', type: 'text', label: '[Nombre del Evento]', x: 100, y: 200, fontSize: 18, color: '#000000' },
    { id: 'fecha', type: 'text', label: '[Fecha]', x: 100, y: 250, fontSize: 16, color: '#000000' },
    { id: 'qr', type: 'qr', label: '[Código QR]', x: 50, y: 50, width: 100 },
    { id: 'codigo_verificacion', type: 'text', label: '[Código de Verificación]', x: 100, y: 300, fontSize: 12, color: '#666666' }
  ];

  selectedElement: DragElement | null = null;
  
  private _orientacion: 'horizontal' | 'vertical' = 'horizontal';
  get orientacion(): 'horizontal' | 'vertical' {
    return this._orientacion;
  }
  set orientacion(value: 'horizontal' | 'vertical') {
    this._orientacion = value;
    // Delay scale update so drag elements re-render first unscaled
    setTimeout(() => this.updateScale(), 0);
  }

  scale = 1;

  // Files to upload
  imageUploadType: 'logo' | 'marcaAgua' | 'firma' = 'marcaAgua';
  logoFile?: File;
  marcaAguaFile?: File;
  firmaFile?: File;

  // Local previews
  logoPreview?: string;
  marcaAguaPreview?: string;
  firmaPreview?: string;

  constructor(
    public dialogRef: MatDialogRef<CertificadoDesignerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { plantillaId?: number }
  ) {
    this.plantilla = { nombre: 'Nueva Plantilla', configuracionJson: '{}' };
  }

  ngOnInit() {
    if (this.data.plantillaId) {
      this.plantillaService.findById(this.data.plantillaId).subscribe(res => {
        this.plantilla = res.datos;
        this.loadConfig();
      });
    }
  }

  ngAfterViewInit() {
    // Delay applying the scale until AFTER Angular CDK DragDrop has initialized
    // its boundaries and coordinates at scale=1
    setTimeout(() => {
      this.updateScale();
    }, 50);
  }

  @HostListener('window:resize')
  onResize() {
    this.updateScale();
  }

  updateScale() {
    // Determine available width (leaving some margin for padding)
    const screenWidth = window.innerWidth;
    const canvasWidth = this.orientacion === 'horizontal' ? 1123 : 794;
    
    // Si la pantalla es más pequeña que el canvas, escalamos
    if (screenWidth < canvasWidth + 40) {
      this.scale = (screenWidth - 40) / canvasWidth;
    } else {
      this.scale = 1;
    }
  }

  loadConfig() {
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
          
          // Inyectar el código de verificación por defecto si no existe en plantillas anteriores
          const hasCodigo = this.elements.some(el => el.id === 'codigo_verificacion');
          if (!hasCodigo) {
            this.elements.push({
              id: 'codigo_verificacion',
              type: 'text',
              label: '[Código de Verificación]',
              x: 100,
              y: 300,
              fontSize: 12,
              color: '#666666'
            });
          }
        }
        if (config.orientacion) this.orientacion = config.orientacion;
      } catch (e) {
        console.error("Error parsing config JSON", e);
      }
    }
    const baseUrl = `${environment.apiUrl}/uploads/plantillas/`;
    if (this.plantilla.uriLogo) {
      this.logoPreview = baseUrl + this.plantilla.uriLogo;
      this.ensureElementExists('logo', 'logo', 50, 50, 100);
    }
    if (this.plantilla.uriMarcaAgua) {
      this.marcaAguaPreview = baseUrl + this.plantilla.uriMarcaAgua;
      this.ensureElementExists('marcaAgua', 'marcaAgua', 0, 0, 800);
    }
    if (this.plantilla.uriFirma) {
      this.firmaPreview = baseUrl + this.plantilla.uriFirma;
      this.ensureElementExists('firma', 'firma', 400, 300, 150);
    }
  }

  ensureElementExists(id: string, type: 'logo' | 'firma' | 'marcaAgua', defaultX: number, defaultY: number, defaultWidth: number) {
    if (!this.elements.find(e => e.id === id)) {
      this.elements.push({ id, type, label: '', x: defaultX, y: defaultY, width: defaultWidth });
    }
  }

  selectElement(el: DragElement) {
    this.selectedElement = el;
  }

  onDragEnded(event: CdkDragEnd, element: DragElement) {
    const transform = event.source.getFreeDragPosition();
    // update element position
    element.x = transform.x;
    element.y = transform.y;
  }

  async onFileSelected(event: any, type: 'logo' | 'marcaAgua' | 'firma') {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        // Compress image before storing
        const compressedImage = await this.imageCompress.compressFile(e.target.result, -1, 50, 50);
        // convert base64 back to file
        const res = await fetch(compressedImage);
        const blob = await res.blob();
        const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
        
        if (type === 'logo') {
          this.logoFile = compressedFile;
          this.logoPreview = compressedImage;
          this.ensureElementExists('logo', 'logo', 50, 50, 100);
        } else if (type === 'marcaAgua') {
          this.marcaAguaFile = compressedFile;
          this.marcaAguaPreview = compressedImage;
          this.ensureElementExists('marcaAgua', 'marcaAgua', 0, 0, 800);
        } else {
          this.firmaFile = compressedFile;
          this.firmaPreview = compressedImage;
          this.ensureElementExists('firma', 'firma', 400, 300, 150);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(type: string) {
    // Remove from elements array
    this.elements = this.elements.filter(e => e.type !== type);
    
    // Clear preview and file
    if (type === 'logo') {
      this.logoPreview = undefined;
      this.logoFile = undefined;
      this.plantilla.uriLogo = ''; // So the backend deletes it
    } else if (type === 'marcaAgua') {
      this.marcaAguaPreview = undefined;
      this.marcaAguaFile = undefined;
      this.plantilla.uriMarcaAgua = '';
    } else if (type === 'firma') {
      this.firmaPreview = undefined;
      this.firmaFile = undefined;
      this.plantilla.uriFirma = '';
    }
    
    if (this.selectedElement?.type === type) {
      this.selectedElement = null;
    }
  }

  save() {
    const config = {
      orientacion: this.orientacion,
      elements: this.elements
    };
    this.plantilla.configuracionJson = JSON.stringify(config);

    const request$ = this.plantilla.id 
      ? this.plantillaService.update(this.plantilla.id, this.plantilla)
      : this.plantillaService.create(this.plantilla);

    request$.subscribe(res => {
      const savedId = res.datos.id!;
      
      // Handle uploads sequentially if there are files
      this.uploadFiles(savedId).then(() => {
        this.dialogRef.close(savedId);
      });
    });
  }

  async uploadFiles(id: number) {
    if (this.logoFile) {
      await this.plantillaService.uploadLogo(id, this.logoFile).toPromise();
    }
    if (this.marcaAguaFile) {
      await this.plantillaService.uploadMarcaAgua(id, this.marcaAguaFile).toPromise();
    }
    if (this.firmaFile) {
      await this.plantillaService.uploadFirma(id, this.firmaFile).toPromise();
    }
  }

}
