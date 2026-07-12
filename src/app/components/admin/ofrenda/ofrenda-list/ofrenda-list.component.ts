import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { Ofrenda, OfrendaResumen } from '../../../../core/models/ofrenda.model';
import { OfrendaService } from '../../../../core/services/ofrenda.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { OfrendaFormComponent } from '../ofrenda-form/ofrenda-form.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/security/auth.service';

@Component({
  selector: 'app-ofrenda-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSnackBarModule,
    MatCardModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatTabsModule,
    MatCheckboxModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './ofrenda-list.component.html',
  styleUrls: ['./ofrenda-list.component.css']
})
export class OfrendaListComponent implements OnInit {
  isLoading = true;
  displayedColumns: string[] = ['fechaRecaudacion', 'conceptoDetalle', 'iglesiaNombre', 'tipoMovimiento', 'monto', 'usuarioTesoreroUsername', 'acciones'];
  dataSource: MatTableDataSource<Ofrenda>;

  startDate!: Date;
  endDate!: Date;
  selectedIglesiaId: number | null = null;
  iglesias: Iglesia[] = [];
  isAdmin: boolean = false;
  canWrite: boolean = false;

  resumen: OfrendaResumen = { ingresos: 0, egresos: 0, neto: 0 };
  searchText: string = '';

  // --- PANEL 1 (Vista General) ---
  selectedYearGeneral: number = new Date().getFullYear();
  anosDisponibles: number[] = [];
  ingresosMensuales: any[] = [];
  selectedMonthDetail: any = null;

  // --- PANEL 2 (Detalle) ---
  filterDesdeMes: number = 0;
  filterHastaMes: number = new Date().getMonth();
  filterYear: number = new Date().getFullYear();
  showOnlyEgresos: boolean = false;
  mesesNombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // --- PANEL 3 (Informes) ---
  reportCriterio: 'fechas' | 'semana' | 'mes' | 'anio' = 'fechas';
  reportStartDate: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  reportEndDate: Date = new Date();
  reportYear: number = new Date().getFullYear();
  reportMonth: number = new Date().getMonth();
  reportWeek: string = '';
  reportData: Ofrenda[] = [];
  reportResumen: OfrendaResumen = { ingresos: 0, egresos: 0, neto: 0 };
  currentChurchName: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private ofrendaService: OfrendaService,
    private iglesiaService: IglesiaService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Ofrenda>([]);
    
    // Configurar años disponibles (actual y anteriores)
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= currentYear - 5; y--) {
      this.anosDisponibles.push(y);
    }
  }

  ngOnInit() {
    this.checkUserRole();
    this.currentChurchName = this.authService.getCurrentIglesiaNombre() || 'Templo Central';
    this.loadIglesias();
    
    // Inicializar fechas para el panel 2
    const start = new Date(this.filterYear, this.filterDesdeMes, 1);
    const end = new Date(this.filterYear, this.filterHastaMes + 1, 0);
    this.startDate = start;
    this.endDate = end;

    this.loadOfrendas();
    this.loadGeneralMonthData();
    this.generarInforme();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  checkUserRole() {
    this.isAdmin = this.authService.isLoggedRolAdmin();
    this.canWrite = !this.isAdmin;
    if (!this.canWrite) {
      this.displayedColumns = this.displayedColumns.filter(c => c !== 'acciones');
    }
  }

  loadIglesias() {
    if (this.isAdmin) {
      this.iglesiaService.getIglesias().subscribe(res => {
        this.iglesias = Array.isArray(res.datos) ? res.datos : [];
      });
    }
  }

  // --- LOGICA PANEL 1: VISTA GENERAL POR MES ---
  loadGeneralMonthData() {
    const startStr = `${this.selectedYearGeneral}-01-01`;
    const endStr = `${this.selectedYearGeneral}-12-31`;
    this.ofrendaService.getOfrendasByPeriod(startStr, endStr).subscribe(res => {
      let data = Array.isArray(res.datos) ? res.datos : [];
      if (this.isAdmin && this.selectedIglesiaId !== null) {
        data = data.filter(o => o.iglesiaId === this.selectedIglesiaId);
      }
      
      const ingresos = data.filter(o => o.tipoMovimiento === 'INGRESO');
      
      this.ingresosMensuales = this.mesesNombres.map((name, index) => {
        const items = ingresos.filter(o => {
          if (!o.fechaRecaudacion) return false;
          // Forzar la lectura de la fecha como UTC para evitar desfases
          const dateMonth = new Date(o.fechaRecaudacion).getUTCMonth();
          return dateMonth === index;
        });
        
        const total = items.reduce((acc, curr) => acc + (curr.monto || 0), 0);
        
        return {
          month: index,
          name,
          total,
          count: items.length,
          items: items.sort((a, b) => new Date(b.fechaRecaudacion!).getTime() - new Date(a.fechaRecaudacion!).getTime())
        };
      });

      if (this.selectedMonthDetail) {
        const found = this.ingresosMensuales.find(m => m.month === this.selectedMonthDetail.month);
        this.selectedMonthDetail = found || null;
      }
    });
  }

  onYearGeneralChange() {
    this.selectedMonthDetail = null;
    this.loadGeneralMonthData();
  }

  verDetalleMes(mesObj: any) {
    if (this.selectedMonthDetail && this.selectedMonthDetail.month === mesObj.month) {
      this.selectedMonthDetail = null; // colapsar si ya estaba abierto
    } else {
      this.selectedMonthDetail = mesObj;
    }
  }

  // --- LOGICA PANEL 2: DETALLE CON FILTROS ---
  loadOfrendas() {
    const startStr = this.formatDate(this.startDate);
    const endStr = this.formatDate(this.endDate);
    this.isLoading = true;
    this.ofrendaService.getOfrendasByPeriod(startStr, endStr).pipe(finalize(() => this.isLoading = false)).subscribe(res => {
      let data = Array.isArray(res.datos) ? res.datos : [];
      
      if (this.isAdmin && this.selectedIglesiaId !== null) {
        data = data.filter(o => o.iglesiaId === this.selectedIglesiaId);
      }

      if (this.showOnlyEgresos) {
        data = data.filter(o => o.tipoMovimiento === 'EGRESO');
      }

      this.dataSource.data = data;
      this.calculateResumen();
    });
  }

  calculateResumen() {
    const startStr = this.formatDate(this.startDate);
    const endStr = this.formatDate(this.endDate);
    const iglesiaParam = (this.isAdmin && this.selectedIglesiaId) ? this.selectedIglesiaId : undefined;
    this.ofrendaService.getResumenPeriodo(startStr, endStr, iglesiaParam).subscribe(res => {
      if (res.datos) {
        this.resumen = res.datos;
      }
    });
  }

  applyFilters() {
    this.loadOfrendas();
  }

  applyMonthRangeFilter() {
    const start = new Date(this.filterYear, this.filterDesdeMes, 1);
    const end = new Date(this.filterYear, this.filterHastaMes + 1, 0);
    this.startDate = start;
    this.endDate = end;
    this.loadOfrendas();
  }

  onSearchChange(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.dataSource.filter = query.trim().toLowerCase();
  }

  // --- LOGICA PANEL 3: INFORMES E IMPRESION ---
  getNombreIglesiaReporte(): string {
    if (this.isAdmin) {
      if (this.selectedIglesiaId) {
        const ig = this.iglesias.find(i => i.id === this.selectedIglesiaId);
        return ig ? ig.nombre : 'Todas las Sedes (Consolidado Global)';
      }
      return 'Todas las Sedes (Consolidado Global)';
    }
    return this.currentChurchName || 'Templo Central';
  }

  private getDatesFromWeek(weekStr: string): { start: Date, end: Date } {
    const parts = weekStr.split('-W');
    const year = parseInt(parts[0], 10);
    const week = parseInt(parts[1], 10);
    const simple = new Date(year, 0, 4);
    const dayOfWeek = simple.getDay();
    const ISOweekStart = new Date(simple.valueOf() - ((dayOfWeek || 7) - 1) * 24 * 60 * 60 * 1000);
    const start = new Date(ISOweekStart.valueOf() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(start.valueOf() + 6 * 24 * 60 * 60 * 1000);
    return { start, end };
  }

  generarInforme() {
    let start: Date;
    let end: Date;

    if (this.reportCriterio === 'fechas') {
      start = this.reportStartDate;
      end = this.reportEndDate;
    } else if (this.reportCriterio === 'mes') {
      start = new Date(this.reportYear, this.reportMonth, 1);
      end = new Date(this.reportYear, this.reportMonth + 1, 0);
    } else if (this.reportCriterio === 'anio') {
      start = new Date(this.reportYear, 0, 1);
      end = new Date(this.reportYear, 11, 31);
    } else { // 'semana'
      if (!this.reportWeek) {
        this.snackBar.open('Seleccione una semana válida.', 'Cerrar', { duration: 3000 });
        return;
      }
      try {
        const range = this.getDatesFromWeek(this.reportWeek);
        start = range.start;
        end = range.end;
      } catch (e) {
        this.snackBar.open('Error al procesar la semana seleccionada.', 'Cerrar', { duration: 3000 });
        return;
      }
    }

    const startStr = this.formatDate(start);
    const endStr = this.formatDate(end);
    const iglesiaParam = (this.isAdmin && this.selectedIglesiaId) ? this.selectedIglesiaId : undefined;

    this.ofrendaService.getOfrendasByPeriod(startStr, endStr).subscribe(res => {
      let data = Array.isArray(res.datos) ? res.datos : [];
      if (this.isAdmin && this.selectedIglesiaId !== null) {
        data = data.filter(o => o.iglesiaId === this.selectedIglesiaId);
      }
      this.reportData = data.sort((a, b) => new Date(a.fechaRecaudacion!).getTime() - new Date(b.fechaRecaudacion!).getTime());
      
      this.ofrendaService.getResumenPeriodo(startStr, endStr, iglesiaParam).subscribe(resResumen => {
        if (resResumen.datos) {
          this.reportResumen = resResumen.datos;
        }
      });
    });
  }

  imprimirInforme() {
    window.print();
  }

  // --- OPERACIONES ---
  openCreateDialog() {
    const dialogRef = this.dialog.open(OfrendaFormComponent, {
      width: '450px',
      data: { mode: 'create', forcedType: 'INGRESO' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.refreshAllData();
        this.snackBar.open('Ofrenda registrada con éxito.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openEditDialog(ofrenda: Ofrenda) {
    const dialogRef = this.dialog.open(OfrendaFormComponent, {
      width: '450px',
      data: { mode: 'edit', ofrenda }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.refreshAllData();
        this.snackBar.open('Registro de ofrenda actualizado.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  deleteOfrenda(ofrenda: Ofrenda) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Confirmar eliminación',
        message: `¿Está seguro de eliminar el registro de ${ofrenda.tipoMovimiento} por el monto de Bs. ${ofrenda.monto}?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.ofrendaService.deleteOfrenda(ofrenda.id!).subscribe(() => {
          this.refreshAllData();
          this.snackBar.open('Registro eliminado exitosamente.', 'Cerrar', { duration: 3000 });
        });
      }
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
      img.onerror = () => {
        reject(new Error('Error al cargar la imagen: ' + url));
      };
      img.src = url;
    });
  }

  descargarPDF() {
    if (!this.reportData.length) return;

    const doc = new jsPDF();

    this.loadImage('/logo.png').then(base64Logo => {
      this.buildReportPDF(doc, base64Logo);
    }).catch(err => {
      console.warn('No se pudo cargar el logo, generando PDF sin logo:', err);
      this.buildReportPDF(doc, null);
    });
  }

  private buildReportPDF(doc: jsPDF, base64Logo: string | null) {
    const primaryColor: [number, number, number] = [124, 77, 255];
    let y = 20;

    // Usar fuente Courier para el reporte formal
    doc.setFont('courier', 'normal');

    if (base64Logo) {
      doc.addImage(base64Logo, 'PNG', 14, 12, 18, 18);
      doc.setFont('courier', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Movimiento Cristiano Misionero Maranatha', 36, 20);
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text('Informe Económico de Ingresos y Egresos', 36, 26);
      y = 35;
    } else {
      doc.setFont('courier', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Movimiento Cristiano Misionero Maranatha', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text('Informe Económico de Ingresos y Egresos', 14, 26);
      y = 35;
    }

    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.setFont('courier', 'bold');
    doc.text('Sede:', 14, y);
    doc.setFont('courier', 'normal');
    doc.text(this.getNombreIglesiaReporte(), 30, y);
    y += 6;

    doc.setFont('courier', 'bold');
    doc.text('Periodo:', 14, y);
    doc.setFont('courier', 'normal');
    
    let periodoStr = '';
    if (this.reportCriterio === 'fechas') {
      periodoStr = `Del ${this.reportStartDate.toLocaleDateString('es-ES')} al ${this.reportEndDate.toLocaleDateString('es-ES')}`;
    } else if (this.reportCriterio === 'semana') {
      periodoStr = `Semana: ${this.reportWeek}`;
    } else if (this.reportCriterio === 'mes') {
      periodoStr = `Mes de ${this.mesesNombres[this.reportMonth]} del ${this.reportYear}`;
    } else if (this.reportCriterio === 'anio') {
      periodoStr = `Gestión Anual: ${this.reportYear}`;
    }
    doc.text(periodoStr, 30, y);
    y += 12;

    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('RESUMEN FINANCIERO', 14, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont('courier', 'normal');
    doc.text('Total Ingresos Recaudados:', 14, y);
    doc.setFont('courier', 'bold');
    doc.setTextColor(46, 125, 50);
    doc.text(`Bs. ${this.reportResumen.ingresos.toFixed(2)}`, 85, y);
    y += 6;

    doc.setFont('courier', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Total Egresos Desembolsados:', 14, y);
    doc.setFont('courier', 'bold');
    doc.setTextColor(198, 40, 40);
    doc.text(`Bs. ${this.reportResumen.egresos.toFixed(2)}`, 85, y);
    y += 6;

    doc.setFont('courier', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Saldo Neto / Caja Chica:', 14, y);
    doc.setFont('courier', 'bold');
    if (this.reportResumen.neto >= 0) {
      doc.setTextColor(46, 125, 50);
    } else {
      doc.setTextColor(198, 40, 40);
    }
    doc.text(`Bs. ${this.reportResumen.neto.toFixed(2)}`, 85, y);
    y += 12;

    doc.setTextColor(0, 0, 0);
    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.text('DETALLE DE TRANSACCIONES', 14, y);
    
    const tableColumn = ['Fecha', 'Detalle / Concepto', 'Sede', 'Tipo', 'Monto'];
    const tableRows = this.reportData.map(r => [
      r.fechaRecaudacion ? new Date(r.fechaRecaudacion).toLocaleDateString('es-ES') : '',
      r.conceptoDetalle || '',
      r.iglesiaNombre || '',
      r.tipoMovimiento || '',
      `Bs. ${(r.monto || 0).toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: y + 4,
      theme: 'plain',
      styles: {
        font: 'courier',
        fontSize: 9,
        cellPadding: 4
      },
      headStyles: {
        fontStyle: 'bold',
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: { bottom: 1 }
      },
      columnStyles: {
        4: { halign: 'right' }
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const rowData = data.row.raw as string[];
          const tipo = rowData[3];
          if (data.column.index === 4 || data.column.index === 3) {
            if (tipo === 'INGRESO') {
              data.cell.styles.textColor = [46, 125, 50]; // Green
            } else {
              data.cell.styles.textColor = [198, 40, 40]; // Red
            }
          }
        }
      },
      didDrawPage: (data) => {
        const finalY = data.cursor ? data.cursor.y : y;
        const pageCount = doc.getNumberOfPages();
        doc.setPage(pageCount);

        let signatureY = finalY + 30;
        if (signatureY > 260) {
          doc.addPage();
          signatureY = 40;
        }

        doc.setFont('courier', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        
        doc.line(30, signatureY, 90, signatureY);
        doc.text('Firma Tesorero / Cajero', 38, signatureY + 5);

        doc.line(120, signatureY, 180, signatureY);
        doc.text('Firma Pastor Responsable', 128, signatureY + 5);
      }
    });

    const safeChurchName = this.getNombreIglesiaReporte().replace(/\s+/g, '_');
    doc.save(`Informe_Economico_${safeChurchName}.pdf`);
  }

  descargarExcel() {
    if (!this.reportData.length) return;

    // Mapear los datos de transacciones para las columnas de Excel
    const data = this.reportData.map(r => ({
      'Fecha': r.fechaRecaudacion ? new Date(r.fechaRecaudacion).toLocaleDateString('es-ES') : '',
      'Detalle / Concepto': r.conceptoDetalle || '',
      'Iglesia Sede': r.iglesiaNombre || '',
      'Tipo de Movimiento': r.tipoMovimiento || '',
      'Monto (Bs.)': r.monto || 0
    }));

    // Crear libro de trabajo
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos Financieros');

    // Descargar archivo Excel (.xlsx)
    const safeChurchName = this.getNombreIglesiaReporte().replace(/\s+/g, '_');
    XLSX.writeFile(wb, `Informe_Economico_${safeChurchName}.xlsx`);
  }

  refreshAllData() {
    this.loadOfrendas();
    this.loadGeneralMonthData();
    this.generarInforme();
  }
}
