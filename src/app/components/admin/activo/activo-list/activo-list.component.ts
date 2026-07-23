import { Component, OnInit, ViewChild, HostListener, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';

import { Activo } from '../../../../core/models/activo.model';
import { ActivoService } from '../../../../core/services/activo.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { AuthService } from '../../../../core/services/security/auth.service';
import { ActivoFormComponent } from '../activo-form/activo-form.component';
import { ActivoDetailComponent } from '../activo-detail/activo-detail.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { InformeLoteDialogComponent } from '../../informes/informe-lote-dialog/informe-lote-dialog.component';
import { finalize } from 'rxjs/operators';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-activo-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTabsModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatCheckboxModule,
    ImageUrlPipe,
    FormsModule,
    ActivoDetailComponent,
    ConfirmDialogComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './activo-list.component.html',
  styleUrls: ['./activo-list.component.css']
})
export class ActivoListComponent implements OnInit {
  isLoading = true;
  displayedColumns: string[] = ['select', 'foto', 'nombre', 'cantidad', 'estadoConservacion', 'acciones'];

  // Selección para impresión de códigos (etiquetas) de varios bienes a la vez
  selectedForPrint = new Set<number>();
  labelsToPrint: Activo[] = [];
  dataSource = new MatTableDataSource<Activo>([]);
  iglesias: Iglesia[] = [];
  selectedIglesiaId: string = 'all';
  isAdmin: boolean = false;
  searchText: string = '';
  isMobile: boolean = false;

  // Panel 2: Reportes
  reportDataSource = new MatTableDataSource<Activo>([]);
  reportSelectedIglesiaId: string = 'all';
  reportEstadoConservacion: string = 'all';
  reportSearchText: string = '';
  reportDisplayedColumns: string[] = ['codigo', 'nombre', 'descripcion', 'cantidad', 'estadoConservacion', 'valorEstimado', 'fechaAdquisicion'];

  // Resumen del Informe
  reportTotalCount: number = 0;
  reportTotalQty: number = 0;
  reportBuenoQty: number = 0;
  reportRegularQty: number = 0;
  reportMaloQty: number = 0;
  reportBajaQty: number = 0;
  todayDate: Date = new Date();

  // Resumen Panel 1 (Registro de Bienes)
  mainTotalCount: number = 0;
  mainTotalQty: number = 0;
  mainBuenoQty: number = 0;
  mainRegularQty: number = 0;
  mainMaloQty: number = 0;
  mainBajaQty: number = 0;

  @ViewChild('mainPaginator') paginator!: MatPaginator;
  @ViewChild('mainSort') sort!: MatSort;
  
  @ViewChild('reportPaginator') reportPaginator!: MatPaginator;
  @ViewChild('reportSort') reportSort!: MatSort;
  @ViewChild('previewDialogTpl') previewDialogTpl!: TemplateRef<any>;
  @ViewChild('labelsDialogTpl') labelsDialogTpl!: TemplateRef<any>;

  constructor(
    private activoService: ActivoService,
    private iglesiaService: IglesiaService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.isLoggedRolAdmin();
    this.isMobile = window.innerWidth < 768;
    
    // Si no es admin, fijamos la iglesia del usuario en el filtro de reportes
    if (!this.isAdmin) {
      const iglesiaId = this.authService.getCurrentIglesiaId();
      if (iglesiaId) {
        this.reportSelectedIglesiaId = iglesiaId.toString();
      }
    }
    
    this.loadActivos();
    this.loadIglesias();
    this.setupFilter();
    this.generarInforme();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent) {
    this.isMobile = (event.target as Window).innerWidth < 768;
  }

  setupFilter() {
    this.dataSource.filterPredicate = (data: Activo, filter: string) => {
      const textQuery = this.searchText.trim().toLowerCase();
      const matchesText = !textQuery || (
        (data.nombre || '') + ' ' + (data.descripcion || '') + ' ' + (data.codigo || '') + ' ' + (data.iglesiaNombre || '')
      ).toLowerCase().includes(textQuery);

      const matchesIglesia = this.selectedIglesiaId === 'all' || 
        data.iglesiaId?.toString() === this.selectedIglesiaId;

      return matchesText && matchesIglesia;
    };
  }

  loadActivos() {
    this.isLoading = true;
    this.reportCacheLoaded = false; // invalida la caché del informe al recargar activos
    if (this.isAdmin) {
      this.activoService.getActivos().pipe(finalize(() => this.isLoading = false)).subscribe(res => {
        this.dataSource.data = Array.isArray(res.datos) ? res.datos : [];
        this.applyFilters();
      });
    } else {
      const iglesiaId = this.authService.getCurrentIglesiaId();
      if (iglesiaId) {
        this.activoService.getActivosByIglesia(iglesiaId).pipe(finalize(() => this.isLoading = false)).subscribe(res => {
          this.dataSource.data = Array.isArray(res.datos) ? res.datos : [];
          this.applyFilters();
        });
      } else {
        this.isLoading = false;
      }
    }
  }

  loadIglesias() {
    this.iglesiaService.getIglesias().subscribe(res => {
      this.iglesias = Array.isArray(res.datos) ? res.datos.filter(ig => ig.estado) : [];
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.reportDataSource.paginator = this.reportPaginator;
    this.reportDataSource.sort = this.reportSort;
  }

  applyFilters() {
    this.dataSource.filter = '' + Math.random();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.calcularResumenPrincipal();
  }

  calcularResumenPrincipal() {
    const list = this.dataSource.filteredData || [];
    // Se cuenta la cantidad de bienes registrados, NO se suman las unidades (cantidad).
    this.mainTotalCount = list.length;
    this.mainTotalQty = list.length;
    this.mainBuenoQty = list.filter(item => item.estadoConservacion === 'BUENO').length;
    this.mainRegularQty = list.filter(item => item.estadoConservacion === 'REGULAR').length;
    this.mainMaloQty = list.filter(item => item.estadoConservacion === 'MALO').length;
    this.mainBajaQty = list.filter(item => item.estadoConservacion === 'BAJA').length;
  }

  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchText = value;
    this.applyFilters();
  }

  openCreateDialog() {
    if (this.isAdmin) return; // Guard
    const dialogRef = this.dialog.open(ActivoFormComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadActivos();
        this.generarInforme();
        this.snackBar.open('Activo registrado exitosamente.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openEditDialog(activo: Activo) {
    if (this.isAdmin) return; // Guard
    const dialogRef = this.dialog.open(ActivoFormComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: { mode: 'edit', activo }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadActivos();
        this.generarInforme();
        this.snackBar.open('Activo actualizado exitosamente.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openDetailDialog(activo: Activo) {
    const dialogRef = this.dialog.open(ActivoDetailComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: activo,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'print') {
        this.printLabel(activo);
      }
    });
  }

  toggleBaja(activo: Activo) {
    if (this.isAdmin) return;
    const isBaja = activo.estadoConservacion === 'BAJA';
    const actionText = isBaja ? 'reactivar' : 'dar de baja';
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: isBaja ? 'Reactivar Activo' : 'Dar de Baja Activo',
        message: `¿Está seguro que desea <strong>${actionText}</strong> el activo "<strong>${activo.nombre}</strong>"?`,
        confirmText: isBaja ? 'Reactivar' : 'Dar de Baja',
        cancelText: 'Cancelar',
        type: isBaja ? 'info' : 'warning'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed && activo.id) {
        const updatedActivo = { 
          ...activo, 
          estadoConservacion: isBaja ? 'BUENO' : 'BAJA' 
        };
        this.activoService.updateActivo(updatedActivo).subscribe(() => {
          this.loadActivos();
          this.generarInforme();
          this.snackBar.open(`Activo ${isBaja ? 'reactivado' : 'dado de baja'} exitosamente.`, 'Cerrar', { duration: 3000 });
        });
      }
    });
  }

  deleteActivo(activo: Activo) {
    if (this.isAdmin) return; // Guard
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Activo',
        message: `¿Está seguro que desea <strong>eliminar definitivamente</strong> el activo "<strong>${activo.nombre}</strong>"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed && activo.id) {
        this.activoService.deleteActivo(activo.id).subscribe(() => {
          this.loadActivos();
          this.generarInforme();
          this.snackBar.open('Activo eliminado exitosamente.', 'Cerrar', { duration: 3000 });
        });
      }
    });
  }

  /** Abre el modal de vista previa del código de UN activo. */
  printLabel(activo: Activo) {
    this.labelsToPrint = [activo];
    this.abrirModalEtiquetas();
  }

  /** Abre el modal con los códigos de todos los activos seleccionados. */
  printSelectedLabels() {
    const labels = this.dataSource.filteredData.filter(a => a.id != null && this.selectedForPrint.has(a.id));
    if (!labels.length) {
      this.snackBar.open('Seleccione al menos un bien para imprimir su código.', 'Cerrar', { duration: 3000 });
      return;
    }
    this.labelsToPrint = labels;
    this.abrirModalEtiquetas();
  }

  private abrirModalEtiquetas() {
    this.dialog.open(this.labelsDialogTpl, {
      panelClass: 'preview-dialog-panel',
      width: '860px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: false
    });
  }

  // ── Selección múltiple para impresión de códigos ──
  isSelectedForPrint(a: Activo): boolean {
    return a.id != null && this.selectedForPrint.has(a.id);
  }

  toggleSelectForPrint(a: Activo, checked: boolean) {
    if (a.id == null) return;
    if (checked) this.selectedForPrint.add(a.id);
    else this.selectedForPrint.delete(a.id);
  }

  get selectedPrintCount(): number {
    return this.selectedForPrint.size;
  }

  allVisibleSelected(): boolean {
    const vis = this.dataSource.filteredData;
    return vis.length > 0 && vis.every(a => a.id != null && this.selectedForPrint.has(a.id));
  }

  someVisibleSelected(): boolean {
    const vis = this.dataSource.filteredData;
    return vis.some(a => a.id != null && this.selectedForPrint.has(a.id)) && !this.allVisibleSelected();
  }

  toggleSelectAllVisible(checked: boolean) {
    const vis = this.dataSource.filteredData;
    if (checked) vis.forEach(a => { if (a.id != null) this.selectedForPrint.add(a.id); });
    else vis.forEach(a => { if (a.id != null) this.selectedForPrint.delete(a.id); });
  }

  clearPrintSelection() {
    this.selectedForPrint.clear();
  }

  /** Genera un único PDF con las etiquetas (códigos) de los activos en labelsToPrint. */
  descargarLabelsPDF() {
    const labels = this.labelsToPrint;
    if (!labels.length) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = 210, pageH = 297;
    const margin = 12;
    const cols = 2;
    const colGap = 8;
    const rowGap = 8;
    const cardW = (pageW - margin * 2 - colGap * (cols - 1)) / cols;
    const cardH = 60;

    let x = margin, y = margin, col = 0;

    labels.forEach((a, idx) => {
      this.dibujarEtiqueta(doc, a, x, y, cardW, cardH);
      col++;
      if (col >= cols) {
        col = 0;
        x = margin;
        y += cardH + rowGap;
        if (idx < labels.length - 1 && y + cardH > pageH - margin) {
          doc.addPage();
          y = margin;
        }
      } else {
        x += cardW + colGap;
      }
    });

    const filename = labels.length === 1
      ? `Codigo_${(labels[0].codigo || 'activo')}.pdf`
      : `Codigos_activos_${labels.length}.pdf`;
    doc.save(filename);
  }

  /** Dibuja una etiqueta (código) de un activo en el PDF, en la posición dada. */
  private dibujarEtiqueta(doc: jsPDF, a: Activo, x: number, y: number, w: number, h: number) {
    // Borde punteado
    doc.setDrawColor(0);
    doc.setLineWidth(0.4);
    doc.setLineDashPattern([1.2, 1.2], 0);
    doc.rect(x, y, w, h);
    doc.setLineDashPattern([], 0);

    const cx = x + w / 2;
    let cy = y + 8;

    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(0);
    const org = doc.splitTextToSize('MOVIMIENTO CRISTIANO MISIONERO MARANATHA', w - 10);
    doc.text(org, cx, cy, { align: 'center' });
    cy += org.length * 3.2 + 1.5;

    doc.setFontSize(7);
    doc.setTextColor(70);
    const igl = doc.splitTextToSize(a.iglesiaNombre || 'Iglesia Responsable', w - 10);
    doc.text(igl, cx, cy, { align: 'center' });
    cy += igl.length * 3 + 3;

    // Caja con el código
    doc.setFont('courier', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(0);
    const code = a.codigo || 'SIN CODIGO';
    const codeW = Math.min(doc.getTextWidth(code) + 10, w - 8);
    const boxX = cx - codeW / 2;
    doc.setFillColor(242, 242, 242);
    doc.setLineWidth(0.3);
    doc.rect(boxX, cy - 5.5, codeW, 9, 'FD');
    doc.text(code, cx, cy - 0.5, { align: 'center', baseline: 'middle' });
    cy += 9;

    // Nombre del bien
    doc.setFontSize(9.5);
    doc.setTextColor(0);
    const name = doc.splitTextToSize(a.nombre || '', w - 10);
    doc.text(name, cx, cy, { align: 'center' });
    cy += name.length * 3.6 + 1.5;

    // Meta
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(40);
    doc.text(`Cantidad: ${a.cantidad ?? 0} uds.  |  Estado: ${a.estadoConservacion || '-'}`, cx, cy, { align: 'center' });
  }

  // --- Panel 2: Lógica de Reportes ---
  private reportActivosCache: Activo[] = [];
  private reportCacheLoaded = false;

  /** Carga los activos del reporte una sola vez y luego aplica los filtros en cliente. */
  generarInforme() {
    if (this.reportCacheLoaded) {
      this.aplicarFiltrosReporte();
      return;
    }
    const obs = this.isAdmin
      ? this.activoService.getActivos()
      : this.activoService.getActivosByIglesia(this.authService.getCurrentIglesiaId() || 0);
    obs.subscribe(res => {
      this.reportActivosCache = Array.isArray(res.datos) ? res.datos : [];
      this.reportCacheLoaded = true;
      this.aplicarFiltrosReporte();
    });
  }

  /** Aplica iglesia + estado + búsqueda sobre la caché (instantáneo, sin re-consultar). */
  private aplicarFiltrosReporte() {
    // Admin sin iglesia elegida: no se muestra informe consolidado (debe elegir una sede).
    if (this.isAdmin && this.reportSelectedIglesiaId === 'all') {
      this.reportDataSource.data = [];
      this.computarResumenReporte([]);
      return;
    }

    let list = [...this.reportActivosCache];

    if (this.reportSelectedIglesiaId !== 'all') {
      list = list.filter(a => a.iglesiaId?.toString() === this.reportSelectedIglesiaId);
    }
    if (this.reportEstadoConservacion !== 'all') {
      list = list.filter(a => a.estadoConservacion === this.reportEstadoConservacion);
    }
    const q = this.reportSearchText.trim().toLowerCase();
    if (q) {
      list = list.filter(a =>
        (a.nombre || '').toLowerCase().includes(q) ||
        (a.descripcion || '').toLowerCase().includes(q) ||
        (a.codigo || '').toLowerCase().includes(q)
      );
    }

    this.reportDataSource.data = list;
    this.computarResumenReporte(list);
    if (this.reportPaginator) {
      this.reportDataSource.paginator = this.reportPaginator;
      this.reportPaginator.firstPage();
    }
    if (this.reportSort) {
      this.reportDataSource.sort = this.reportSort;
    }
  }

  /** Calcula los resúmenes del informe (conteo de BIENES, no suma de cantidades). */
  private computarResumenReporte(list: Activo[]) {
    this.reportTotalCount = list.length;
    this.reportTotalQty = list.length;
    this.reportBuenoQty = list.filter(item => item.estadoConservacion === 'BUENO').length;
    this.reportRegularQty = list.filter(item => item.estadoConservacion === 'REGULAR').length;
    this.reportMaloQty = list.filter(item => item.estadoConservacion === 'MALO').length;
    this.reportBajaQty = list.filter(item => item.estadoConservacion === 'BAJA').length;
  }

  /** Lote (admin): abre el diálogo para generar un PDF por cada iglesia seleccionada. */
  abrirLoteInventario() {
    if (!this.isAdmin) return;
    // Se cargan todos los activos una vez y cada iglesia solo re-filtra en cliente.
    this.activoService.getActivos().subscribe(res => {
      const todos = Array.isArray(res.datos) ? res.datos : [];
      const ref = this.dialog.open(InformeLoteDialogComponent, {
        width: '560px', maxWidth: '95vw', panelClass: 'dialog-fullscreen-mobile', disableClose: true,
        data: {
          titulo: 'Informe de Inventario',
          iglesias: this.iglesias.filter(i => i.id != null).map(i => ({ id: i.id!, nombre: i.nombre })),
          generarUno: (iglesiaId: number) => this.generarPdfLoteParaIglesia(iglesiaId, todos)
        }
      });
      ref.afterClosed().subscribe(() => this.limpiarFiltrosInforme());
    });
  }

  private generarPdfLoteParaIglesia(iglesiaId: number, todos: Activo[]): Promise<void> {
    return new Promise<void>((resolve) => {
      const list = todos.filter(a => a.iglesiaId === iglesiaId);
      // Fija el estado del reporte a esta iglesia (buildReportPDF y el nombre de archivo lo usan).
      this.reportSelectedIglesiaId = iglesiaId.toString();
      this.reportEstadoConservacion = 'all';
      this.reportSearchText = '';
      this.reportDataSource.data = list;
      this.computarResumenReporte(list);

      const doc = new jsPDF('l', 'mm', 'a4');
      this.loadImage('/logo.png')
        .then(logo => { this.buildReportPDF(doc, logo); resolve(); })
        .catch(() => { this.buildReportPDF(doc, null); resolve(); });
    });
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const placeholder = img.nextElementSibling as HTMLElement;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

  limpiarFiltrosInforme() {
    this.reportSelectedIglesiaId = 'all';
    this.reportEstadoConservacion = 'all';
    this.reportSearchText = '';
    this.generarInforme();
  }

  canPrintReport(): boolean {
    if (this.isAdmin && this.reportSelectedIglesiaId === 'all') {
      return false;
    }
    return true;
  }

  // El administrador no puede ver los bienes de todas las iglesias mezclados:
  // debe elegir una sede específica en el filtro de "Registro de Bienes".
  canVerListaPrincipal(): boolean {
    return !this.isAdmin || this.selectedIglesiaId !== 'all';
  }

  imprimirVistaPrevia() {
    if (!this.canPrintReport()) {
      this.snackBar.open('Debe seleccionar una iglesia específica para poder imprimir el reporte.', 'Cerrar', { duration: 3000 });
      return;
    }
    // Mostrar la vista previa en un modal (no abrir el diálogo de impresión del navegador).
    // Desde el modal se puede generar el PDF.
    this.dialog.open(this.previewDialogTpl, {
      panelClass: 'preview-dialog-panel',
      width: '960px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: false
    });
  }

  descargarExcel() {
    if (!this.canPrintReport()) {
      this.snackBar.open('Debe seleccionar una iglesia específica para exportar.', 'Cerrar', { duration: 3000 });
      return;
    }
    if (!this.reportDataSource.data.length) return;

    const data = this.reportDataSource.data.map(r => ({
      'Código': r.codigo || 'S/C',
      'Bien / Activo': r.nombre || '',
      'Descripción': r.descripcion || '',
      'Cantidad': r.cantidad || 0,
      'Estado Conservación': r.estadoConservacion || '',
      'Valor Estimado (Bs.)': r.valorEstimado || 0,
      'Fecha Adquisición': r.fechaAdquisicion ? new Date(r.fechaAdquisicion).toLocaleDateString('es-ES') : 'N/A',
      'Iglesia Sede': r.iglesiaNombre || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario de Activos');

    const safeChurchName = this.getNombreIglesiaReporte().replace(/\s+/g, '_');
    XLSX.writeFile(wb, `Inventario_${safeChurchName}.xlsx`);
  }

  descargarPDF() {
    if (!this.canPrintReport()) {
      this.snackBar.open('Debe seleccionar una iglesia específica para exportar.', 'Cerrar', { duration: 3000 });
      return;
    }
    if (!this.reportDataSource.data.length) return;

    const doc = new jsPDF('l', 'mm', 'a4'); // Horizontal
    
    this.loadImage('/logo.png').then(base64Logo => {
      this.buildReportPDF(doc, base64Logo);
    }).catch(err => {
      console.warn('No se pudo cargar el logo, generando PDF sin logo:', err);
      this.buildReportPDF(doc, null);
    });
  }

  loadImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('No se pudo obtener el contexto del canvas'));
        }
      };
      img.onerror = (e) => reject(e);
      img.src = url;
    });
  }

  private buildReportPDF(doc: jsPDF, base64Logo: string | null) {
    const primaryColor: [number, number, number] = [127, 11, 133]; // Magenta
    let y = 20;

    doc.setFont('courier', 'normal');

    if (base64Logo) {
      doc.addImage(base64Logo, 'PNG', 14, 12, 18, 18);
      doc.setFont('courier', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('ASOCIACION EVANGELICA DE LA IGLESIA MOVIMIENTO CRISTIANO MISIONERO MARANATHA', 36, 18);
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text('REPORTE GENERAL DE INVENTARIO Y BIENES DE LA IGLESIA', 36, 25);
      y = 35;
    } else {
      doc.setFont('courier', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('ASOCIACION EVANGELICA DE LA IGLESIA MOVIMIENTO CRISTIANO MISIONERO MARANATHA', 14, 18);
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text('REPORTE GENERAL DE INVENTARIO Y BIENES DE LA IGLESIA', 14, 25);
      y = 35;
    }

    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(14, y, 282, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.setFont('courier', 'bold');
    doc.text('Sede / Iglesia:', 14, y);
    doc.setFont('courier', 'normal');
    doc.text(this.getNombreIglesiaReporte(), 55, y);
    y += 6;

    doc.setFont('courier', 'bold');
    doc.text('Fecha Reporte:', 14, y);
    doc.setFont('courier', 'normal');
    doc.text(new Date().toLocaleDateString('es-ES'), 55, y);
    y += 6;

    doc.setFont('courier', 'bold');
    doc.text('Total Items:', 14, y);
    doc.setFont('courier', 'normal');
    doc.text(`${this.reportDataSource.data.length} registros`, 55, y);
    y += 10;

    // Resumen Formal en Texto para el PDF (Igual a la hoja A4)
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(14, y, 282, y);
    y += 5;

    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text('RESUMEN DE INVENTARIO Y BIENES:', 14, y);
    doc.setFont('courier', 'normal');
    doc.text(`Bienes: ${this.reportTotalCount} | Buenos: ${this.reportBuenoQty} | Regulares: ${this.reportRegularQty} | Malos: ${this.reportMaloQty} | De Baja: ${this.reportBajaQty}`, 85, y);
    y += 5;

    doc.line(14, y, 282, y);
    y += 8;

    const tableColumn = ['Código', 'Bien / Activo', 'Descripción', 'Cant.', 'Estado', 'Valor Est.', 'Fecha Adq.'];
    const tableRows = this.reportDataSource.data.map(r => [
      r.codigo || 'S/C',
      r.nombre || '',
      r.descripcion || 'Sin descripción',
      r.cantidad || 0,
      r.estadoConservacion || 'BUENO',
      r.valorEstimado ? `${r.valorEstimado} Bs.` : 'N/A',
      r.fechaAdquisicion ? new Date(r.fechaAdquisicion).toLocaleDateString('es-ES') : 'N/A'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: y,
      theme: 'plain',
      styles: {
        font: 'courier',
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fontStyle: 'bold',
        textColor: [0, 0, 0],
        lineWidth: 0.5,
        lineColor: [0, 0, 0]
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 60 },
        2: { cellWidth: 80 },
        3: { cellWidth: 15 },
        4: { cellWidth: 22 },
        5: { cellWidth: 27 },
        6: { cellWidth: 30 }
      },
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        
        const finalY = doc.internal.pageSize.height - 35;
        
        if (data.pageNumber === pageCount) {
          doc.setDrawColor(150, 150, 150);
          doc.line(30, finalY, 100, finalY);
          doc.line(180, finalY, 250, finalY);
          
          doc.text('Tesorero / Diácono Responsable', 40, finalY + 5);
          doc.text('Visto Bueno - Pastor Sede', 195, finalY + 5);
        }

        doc.text(`Página ${data.pageNumber} de ${pageCount}`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10);
      }
    });

    doc.save(`Inventario_${this.getNombreIglesiaReporte().replace(/\s+/g, '_')}.pdf`);
  }

  getNombreIglesiaReporte(): string {
    if (this.reportSelectedIglesiaId !== 'all') {
      const ig = this.iglesias.find(i => i.id?.toString() === this.reportSelectedIglesiaId);
      if (ig) return ig.nombre;
    }
    return this.isAdmin 
      ? 'Todas las Sedes (Nacional)' 
      : (this.authService.getCurrentIglesiaNombre() || 'Mi Iglesia');
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}
