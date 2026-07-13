import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
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
  displayedColumns: string[] = ['foto', 'nombre', 'cantidad', 'estadoConservacion', 'acciones'];
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
        (data.nombre || '') + ' ' + (data.descripcion || '') + ' ' + (data.codigo || '')
      ).toLowerCase().includes(textQuery);

      const matchesIglesia = this.selectedIglesiaId === 'all' || 
        data.iglesiaId?.toString() === this.selectedIglesiaId;

      return matchesText && matchesIglesia;
    };
  }

  loadActivos() {
    this.isLoading = true;
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
    this.mainTotalCount = list.length;
    this.mainTotalQty = list.reduce((sum, item) => sum + (item.cantidad || 0), 0);
    this.mainBuenoQty = list.filter(item => item.estadoConservacion === 'BUENO').reduce((sum, item) => sum + (item.cantidad || 0), 0);
    this.mainRegularQty = list.filter(item => item.estadoConservacion === 'REGULAR').reduce((sum, item) => sum + (item.cantidad || 0), 0);
    this.mainMaloQty = list.filter(item => item.estadoConservacion === 'MALO').reduce((sum, item) => sum + (item.cantidad || 0), 0);
    this.mainBajaQty = list.filter(item => item.estadoConservacion === 'BAJA').reduce((sum, item) => sum + (item.cantidad || 0), 0);
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

  printLabel(activo: Activo) {
    const printWindow = window.open('', '_blank', 'width=600,height=450');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Etiqueta de Activo - ${activo.codigo || 'S/C'}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              padding: 20px;
              text-align: center;
              color: #000;
            }
            .label-card {
              border: 2px dashed #000;
              padding: 20px;
              display: inline-block;
              max-width: 420px;
              width: 100%;
              box-sizing: border-box;
              margin: auto;
              background-color: #fff;
            }
            .title {
              font-size: 13px;
              font-weight: bold;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .subtitle {
              font-size: 11px;
              color: #444;
              margin-bottom: 12px;
              font-weight: bold;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 10px 0;
            }
            .code-box {
              font-size: 22px;
              font-weight: bold;
              letter-spacing: 2px;
              background-color: #f2f2f2;
              padding: 8px 12px;
              margin: 8px 0;
              display: inline-block;
              border: 1px solid #000;
            }
            .asset-name {
              font-size: 15px;
              font-weight: bold;
              margin-top: 8px;
            }
            .asset-meta {
              font-size: 12px;
              margin-top: 4px;
            }
            .meta-details {
              font-size: 10px;
              margin-top: 12px;
              text-align: left;
              line-height: 1.4;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="label-card">
            <div class="title">MOVIMIENTO CRISTIANO MISIONERO MARANATHA</div>
            <div class="subtitle">${activo.iglesiaNombre || 'Iglesia Responsable'}</div>
            <div class="divider"></div>
            <div class="code-box">${activo.codigo || 'SIN CODIGO'}</div>
            <div class="asset-name">${activo.nombre}</div>
            <div class="asset-meta">Cantidad: ${activo.cantidad} uds. | Estado: ${activo.estadoConservacion}</div>
            <div class="divider"></div>
            <div class="meta-details">
              <strong>Fecha de Reg:</strong> ${this.formatDate(activo.fechaAdquisicion)}<br/>
              <strong>Descripción:</strong> ${activo.descripcion || 'Sin descripción'}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  // --- Panel 2: Lógica de Reportes ---
  generarInforme() {
    const obs = this.isAdmin 
      ? this.activoService.getActivos()
      : this.activoService.getActivosByIglesia(this.authService.getCurrentIglesiaId() || 0);

    obs.subscribe(res => {
      let list = Array.isArray(res.datos) ? res.datos : [];
      
      // Filtrar por Iglesia
      if (this.reportSelectedIglesiaId !== 'all') {
        list = list.filter(a => a.iglesiaId?.toString() === this.reportSelectedIglesiaId);
      }
      // Filtrar por Estado Conservación
      if (this.reportEstadoConservacion !== 'all') {
        list = list.filter(a => a.estadoConservacion === this.reportEstadoConservacion);
      }
      // Filtrar por texto
      if (this.reportSearchText.trim()) {
        const q = this.reportSearchText.toLowerCase().trim();
        list = list.filter(a => 
          (a.nombre || '').toLowerCase().includes(q) ||
          (a.descripcion || '').toLowerCase().includes(q) ||
          (a.codigo || '').toLowerCase().includes(q)
        );
      }

      this.reportDataSource.data = list;
      
      // Calcular resúmenes del informe
      this.reportTotalCount = list.length;
      this.reportTotalQty = list.reduce((sum, item) => sum + (item.cantidad || 0), 0);
      this.reportBuenoQty = list.filter(item => item.estadoConservacion === 'BUENO').reduce((sum, item) => sum + (item.cantidad || 0), 0);
      this.reportRegularQty = list.filter(item => item.estadoConservacion === 'REGULAR').reduce((sum, item) => sum + (item.cantidad || 0), 0);
      this.reportMaloQty = list.filter(item => item.estadoConservacion === 'MALO').reduce((sum, item) => sum + (item.cantidad || 0), 0);
      this.reportBajaQty = list.filter(item => item.estadoConservacion === 'BAJA').reduce((sum, item) => sum + (item.cantidad || 0), 0);

      if (this.reportPaginator) {
        this.reportDataSource.paginator = this.reportPaginator;
      }
      if (this.reportSort) {
        this.reportDataSource.sort = this.reportSort;
      }
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

  imprimirVistaPrevia() {
    if (!this.canPrintReport()) {
      this.snackBar.open('Debe seleccionar una iglesia específica para poder imprimir el reporte.', 'Cerrar', { duration: 3000 });
      return;
    }
    window.print();
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
    doc.text(`Total Tipos: ${this.reportTotalCount} reg. | Total Unidades: ${this.reportTotalQty} uds. | Buenos: ${this.reportBuenoQty} uds. | Regulares: ${this.reportRegularQty} uds. | Malos: ${this.reportMaloQty} uds. | De Baja: ${this.reportBajaQty} uds.`, 85, y);
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
