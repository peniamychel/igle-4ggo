import { Component, Inject, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { DragDropModule, CdkDragEnd, CdkDragMove } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { PlantillaCertificado } from '../../../../core/models/plantilla-certificado.model';
import { PlantillaCertificadoService } from '../../../../core/services/plantilla-certificado.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import {
  ELEMENTOS_CERTIFICADO, normalizarElementos, dimensionesCanvas,
  FORMATOS_HOJA, FormatoHoja, OrientacionHoja
} from '../../../../core/utils/certificado-elementos';
import { QRCodeModule } from 'angularx-qrcode';

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
}

@Component({
  selector: 'app-certificado-designer',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, DragDropModule, MatButtonModule, MatIconModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDividerModule, MatTooltipModule,
    MatMenuModule, QRCodeModule
  ],
  templateUrl: './certificado-designer.component.html',
  styleUrls: ['./certificado-designer.component.css']
})
export class CertificadoDesignerComponent implements OnInit {

  private plantillaService = inject(PlantillaCertificadoService);

  plantilla: PlantillaCertificado;
  
  // El catálogo vive en core/utils para que el diseñador, la vista previa y la
  // impresión por lote compartan los mismos elementos.
  elements: DragElement[] = ELEMENTOS_CERTIFICADO.map(el => ({ ...el }));

  /** Elemento que gobierna el panel de propiedades (el último tocado). */
  selectedElement: DragElement | null = null;

  /**
   * Marcador para el panel de propiedades cuando no hay nada seleccionado: así
   * los controles siguen visibles (deshabilitados) y la barra no cambia de alto.
   */
  private readonly elementoPlaceholder: DragElement = {
    id: '', type: 'text', label: '', x: 0, y: 0, fontSize: 16, color: '#000000'
  };

  get elementoPanel(): DragElement {
    return this.selectedElement ?? this.elementoPlaceholder;
  }

  /** Selección múltiple: con Ctrl/Shift + clic o con marquesina del mouse. */
  selectedElements: DragElement[] = [];

  /** Rectángulo de selección que se dibuja al arrastrar sobre el lienzo vacío. */
  marquesina: { x: number; y: number; ancho: number; alto: number } | null = null;

  private canvasEl?: HTMLElement;
  private marcoInicio = { x: 0, y: 0 };
  private huboMarquesina = false;
  private posicionesAlIniciar = new Map<DragElement, { x: number; y: number }>();

  /** Contenido de muestra del QR: en el certificado real lleva el código único. */
  qrPreviewData = `${environment.apiUrl}/v/DEMOxxxxxxxxxxxx`;
  
  // El lienzo se muestra SIEMPRE a tamaño real (1123x794 px = A4 a 96 DPI) y el
  // contenedor hace scroll si no entra en pantalla. Antes se reducía con `zoom`
  // para que cupiera, pero el CDK de arrastre mide el desplazamiento en píxeles
  // de pantalla y no conoce ese zoom: guardaba coordenadas encogidas por el
  // factor de escala y el certificado impreso no coincidía con el diseño.
  orientacion: OrientacionHoja = 'horizontal';
  formatoHoja: FormatoHoja = 'a4';

  /** Opciones del selector de tamaño de hoja. */
  formatos = Object.entries(FORMATOS_HOJA).map(([valor, hoja]) => ({ valor, etiqueta: hoja.etiqueta }));

  get anchoCanvas(): number {
    return dimensionesCanvas(this.formatoHoja, this.orientacion).ancho;
  }

  get altoCanvas(): number {
    return dimensionesCanvas(this.formatoHoja, this.orientacion).alto;
  }

  // La plantilla ya no admite imágenes (logo, firma ni marca de agua): el
  // certificado se imprime sobre papel preimpreso y el sistema solo coloca los
  // datos encima.

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

  loadConfig() {
    if (this.plantilla.configuracionJson) {
      try {
        const config = JSON.parse(this.plantilla.configuracionJson);
        if (config.elements) {
          // Descarta los elementos retirados y da de alta los nuevos que la
          // plantilla guardada todavía no tenía.
          this.elements = normalizarElementos(config.elements);
        }
        if (config.orientacion) this.orientacion = config.orientacion;
        // Las plantillas anteriores no guardaban el formato: eran A4
        if (config.formatoHoja) this.formatoHoja = config.formatoHoja;
      } catch (e) {
        console.error("Error parsing config JSON", e);
      }
    }
  }

  // ───────────────────────── Selección ─────────────────────────

  estaSeleccionado(el: DragElement): boolean {
    return this.selectedElements.includes(el);
  }

  /**
   * Con Ctrl/Cmd o Shift se agrega o quita de la selección; sin modificador se
   * selecciona solo ese elemento, salvo que ya forme parte de una selección
   * múltiple (así se puede arrastrar el grupo sin deshacerlo).
   */
  selectElement(el: DragElement, event?: MouseEvent) {
    const aditivo = !!event && (event.ctrlKey || event.metaKey || event.shiftKey);

    if (aditivo) {
      const i = this.selectedElements.indexOf(el);
      if (i >= 0) {
        this.selectedElements.splice(i, 1);
      } else {
        this.selectedElements.push(el);
      }
    } else if (!this.estaSeleccionado(el)) {
      this.selectedElements = [el];
    }

    this.selectedElement = this.estaSeleccionado(el) ? el : (this.selectedElements[0] || null);
  }

  limpiarSeleccion() {
    this.selectedElements = [];
    this.selectedElement = null;
  }

  seleccionarTodo() {
    this.selectedElements = [...this.elements];
    this.selectedElement = this.elements[0] || null;
  }

  /**
   * Activa o desactiva el centrado del texto en todos los elementos de texto
   * seleccionados. Al centrar se les da un ancho por defecto para que el texto
   * tenga dentro de qué centrarse.
   */
  alternarCentrado() {
    if (!this.selectedElement) return;
    const centrar = !this.selectedElement.centrado;

    this.selectedElements
      .filter(el => el.type === 'text')
      .forEach(el => {
        el.centrado = centrar;
        if (centrar && !el.width) el.width = 200;
      });
  }

  /** Al editar tamaño o color se aplica a todos los elementos seleccionados. */
  aplicarASeleccion(propiedad: 'fontSize' | 'color' | 'width', valor: any) {
    this.selectedElements.forEach(el => (el as any)[propiedad] = valor);
  }

  // ─────────────────── Arrastre (individual y en grupo) ───────────────────

  onDragStarted(element: DragElement) {
    // Arrastrar un elemento que no estaba seleccionado reinicia la selección
    if (!this.estaSeleccionado(element)) {
      this.selectedElements = [element];
      this.selectedElement = element;
    }
    this.posicionesAlIniciar.clear();
    this.selectedElements.forEach(el => this.posicionesAlIniciar.set(el, { x: el.x, y: el.y }));
  }

  /** Mueve el resto de la selección con el mismo desplazamiento. */
  onDragMoved(event: CdkDragMove, arrastrado: DragElement) {
    if (this.selectedElements.length < 2) return;

    this.selectedElements.forEach(el => {
      if (el === arrastrado) return;
      const inicio = this.posicionesAlIniciar.get(el);
      if (inicio) {
        el.x = inicio.x + event.distance.x;
        el.y = inicio.y + event.distance.y;
      }
    });
  }

  onDragEnded(event: CdkDragEnd, element: DragElement) {
    const transform = event.source.getFreeDragPosition();
    const inicio = this.posicionesAlIniciar.get(element);

    element.x = transform.x;
    element.y = transform.y;

    // Se confirma el desplazamiento del grupo con el delta real del arrastre
    if (inicio && this.selectedElements.length > 1) {
      const dx = element.x - inicio.x;
      const dy = element.y - inicio.y;
      this.selectedElements.forEach(el => {
        if (el === element) return;
        const desde = this.posicionesAlIniciar.get(el);
        if (desde) {
          el.x = desde.x + dx;
          el.y = desde.y + dy;
        }
      });
    }
  }

  // ─────────────── Marquesina: selección arrastrando el mouse ───────────────

  iniciarMarquesina(event: MouseEvent) {
    if (event.button !== 0) return;

    this.canvasEl = event.currentTarget as HTMLElement;
    const rect = this.canvasEl.getBoundingClientRect();
    this.marcoInicio = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    this.marquesina = { x: this.marcoInicio.x, y: this.marcoInicio.y, ancho: 0, alto: 0 };
    this.huboMarquesina = false;

    if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
      this.limpiarSeleccion();
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.marquesina || !this.canvasEl) return;

    const rect = this.canvasEl.getBoundingClientRect();
    const actualX = event.clientX - rect.left;
    const actualY = event.clientY - rect.top;

    this.marquesina = {
      x: Math.min(this.marcoInicio.x, actualX),
      y: Math.min(this.marcoInicio.y, actualY),
      ancho: Math.abs(actualX - this.marcoInicio.x),
      alto: Math.abs(actualY - this.marcoInicio.y)
    };

    if (this.marquesina.ancho > 4 || this.marquesina.alto > 4) {
      this.huboMarquesina = true;
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    if (!this.marquesina) return;
    if (this.huboMarquesina) this.seleccionarDentroDeMarquesina();
    this.marquesina = null;
  }

  /** Selecciona todo elemento que se solape con el rectángulo dibujado. */
  private seleccionarDentroDeMarquesina() {
    if (!this.marquesina || !this.canvasEl) return;

    const canvasRect = this.canvasEl.getBoundingClientRect();
    const { x, y, ancho, alto } = this.marquesina;
    const nodos = this.canvasEl.querySelectorAll('.drag-element');

    nodos.forEach((nodo, i) => {
      const r = (nodo as HTMLElement).getBoundingClientRect();
      const ex = r.left - canvasRect.left;
      const ey = r.top - canvasRect.top;

      const solapa = ex < x + ancho && ex + r.width > x && ey < y + alto && ey + r.height > y;
      const elemento = this.elements[i];
      if (solapa && elemento && !this.estaSeleccionado(elemento)) {
        this.selectedElements.push(elemento);
      }
    });

    this.selectedElement = this.selectedElements[this.selectedElements.length - 1] || null;
  }

  // ─────────────────── Teclado: mover y seleccionar ───────────────────

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const destino = event.target as HTMLElement | null;
    const escribiendo = !!destino && ['INPUT', 'TEXTAREA', 'SELECT'].includes(destino.tagName);
    if (escribiendo) return;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      this.seleccionarTodo();
      return;
    }

    if (event.key === 'Escape') {
      this.limpiarSeleccion();
      return;
    }

    if (!this.selectedElements.length) return;

    // Shift acelera el desplazamiento a 10px por pulsación
    const paso = event.shiftKey ? 10 : 1;
    let dx = 0;
    let dy = 0;

    switch (event.key) {
      case 'ArrowLeft': dx = -paso; break;
      case 'ArrowRight': dx = paso; break;
      case 'ArrowUp': dy = -paso; break;
      case 'ArrowDown': dy = paso; break;
      default: return;
    }

    event.preventDefault();
    this.selectedElements.forEach(el => {
      el.x += dx;
      el.y += dy;
    });
  }

  save() {
    const config = {
      orientacion: this.orientacion,
      formatoHoja: this.formatoHoja,
      elements: this.elements
    };
    this.plantilla.configuracionJson = JSON.stringify(config);

    const request$ = this.plantilla.id
      ? this.plantillaService.update(this.plantilla.id, this.plantilla)
      : this.plantillaService.create(this.plantilla);

    request$.subscribe(res => {
      this.dialogRef.close(res.datos.id!);
    });
  }

}
