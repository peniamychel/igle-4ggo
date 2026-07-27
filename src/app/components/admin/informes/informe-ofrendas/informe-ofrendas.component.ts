import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { OfrendaService } from '../../../../core/services/ofrenda.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { AuthService } from '../../../../core/services/security/auth.service';
import { Ofrenda } from '../../../../core/models/ofrenda.model';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { InformeLoteDialogComponent } from '../informe-lote-dialog/informe-lote-dialog.component';
import { cargarLogo, iniciarInforme, tituloSeccion, agregarTabla, agregarGrafico, esperarRender } from '../../../../shared/utils/informe-pdf.util';
import { finalize } from 'rxjs/operators';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Component({
  selector: 'app-informe-ofrendas',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, NgxChartsModule, LoadingSpinnerComponent
  ],
  templateUrl: './informe-ofrendas.component.html',
  styleUrls: ['../informe-shared.css']
})
export class InformeOfrendasComponent implements OnInit {
  isAdmin = false;
  iglesias: Iglesia[] = [];
  selectedIglesiaId: number | 'all' = 'all';
  selectedYear: number = new Date().getFullYear();
  anosDisponibles: number[] = [];

  ofrendas: Ofrenda[] = [];
  isLoading = true;
  isGenerating = false;

  totalIngresos = 0;
  totalEgresos = 0;
  neto = 0;
  ingresosMesData: any[] = [];
  private mesResumen: { mes: string; ingresos: number; egresos: number }[] = [];

  view: [number, number] = [820, 300];
  schemeBar: any = { domain: ['#0B857F'] };

  @ViewChild('chartMeses') chartMeses!: ElementRef;

  constructor(
    private ofrendaService: OfrendaService,
    private iglesiaService: IglesiaService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isLoggedRolAdmin();
    const y = new Date().getFullYear();
    this.anosDisponibles = [y, y - 1, y - 2, y - 3];
    if (this.isAdmin) {
      this.iglesiaService.getIglesias().subscribe(res => {
        this.iglesias = (res.datos || []).filter(i => i.estado);
      });
    }
    this.loadDatos();
  }

  onFiltroChange(): void {
    this.loadDatos();
  }

  loadDatos(): void {
    this.isLoading = true;
    this.ofrendaService.getOfrendas().pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (res) => {
        this.ofrendas = Array.isArray(res.datos) ? res.datos : [];
        this.compute();
      },
      error: () => { this.ofrendas = []; this.compute(); }
    });
  }

  private compute(): void {
    const ingresosMes = new Array(12).fill(0);
    const egresosMes = new Array(12).fill(0);
    this.totalIngresos = 0;
    this.totalEgresos = 0;

    for (const o of this.ofrendas) {
      if (o.estado === false) continue;
      if (this.isAdmin && this.selectedIglesiaId !== 'all' && o.iglesiaId !== this.selectedIglesiaId) continue;
      if (!o.fechaRecaudacion) continue;
      const d = new Date(o.fechaRecaudacion);
      if (isNaN(d.getTime()) || d.getFullYear() !== this.selectedYear) continue;
      const mes = d.getMonth();
      const monto = Number(o.monto) || 0;
      if (o.tipoMovimiento === 'EGRESO') {
        egresosMes[mes] += monto;
        this.totalEgresos += monto;
      } else {
        ingresosMes[mes] += monto;
        this.totalIngresos += monto;
      }
    }

    this.neto = this.totalIngresos - this.totalEgresos;
    this.ingresosMesData = MESES.map((m, i) => ({ name: m, value: ingresosMes[i] }));
    this.mesResumen = MESES.map((m, i) => ({ mes: m, ingresos: ingresosMes[i], egresos: egresosMes[i] }));
  }

  getIglesiaNombreReporte(): string {
    if (!this.isAdmin) return this.authService.getCurrentIglesiaNombre() || 'Mi Iglesia';
    if (this.selectedIglesiaId === 'all') return 'Todas las sedes (consolidado)';
    const ig = this.iglesias.find(i => i.id === this.selectedIglesiaId);
    return ig ? ig.nombre : 'Sede';
  }

  get hayDatos(): boolean {
    return this.totalIngresos > 0 || this.totalEgresos > 0;
  }

  async descargarPDF(): Promise<void> {
    if (this.isGenerating) return;
    this.isGenerating = true;
    try {
      await this.construirYGuardarPdf();
    } finally {
      this.isGenerating = false;
    }
  }

  abrirLote(): void {
    const ref = this.dialog.open(InformeLoteDialogComponent, {
      width: '560px', maxWidth: '95vw', panelClass: 'dialog-fullscreen-mobile', disableClose: true,
      data: {
        titulo: `Informe de Ofrendas — ${this.selectedYear}`,
        iglesias: this.iglesias.filter(i => i.id != null).map(i => ({ id: i.id!, nombre: i.nombre })),
        generarUno: (iglesiaId: number) => this.generarPdfParaIglesia(iglesiaId)
      }
    });
    ref.afterClosed().subscribe(() => { this.selectedIglesiaId = 'all'; this.compute(); });
  }

  private async generarPdfParaIglesia(iglesiaId: number): Promise<void> {
    this.selectedIglesiaId = iglesiaId;
    this.compute();
    await esperarRender();
    await this.construirYGuardarPdf();
  }

  private async construirYGuardarPdf(): Promise<void> {
      const logo = await cargarLogo();
      let { doc, y } = iniciarInforme({
        titulo: 'Informe de Ofrendas',
        iglesia: this.getIglesiaNombreReporte(),
        periodo: `Gestión ${this.selectedYear}`,
        logo
      });

      y = tituloSeccion(doc, y, 'Resumen financiero');
      y = agregarTabla(doc, y, ['Indicador', 'Monto (Bs.)'], [
        ['Total ingresos', this.totalIngresos.toFixed(2)],
        ['Total egresos', this.totalEgresos.toFixed(2)],
        ['Neto', this.neto.toFixed(2)]
      ]);

      if (this.chartMeses?.nativeElement) {
        y = tituloSeccion(doc, y, 'Ingresos por mes');
        y = await agregarGrafico(doc, y, this.chartMeses.nativeElement);
      }

      y = tituloSeccion(doc, y, 'Detalle mensual');
      agregarTabla(doc, y, ['Mes', 'Ingresos (Bs.)', 'Egresos (Bs.)', 'Neto (Bs.)'],
        this.mesResumen.map(r => [r.mes, r.ingresos.toFixed(2), r.egresos.toFixed(2), (r.ingresos - r.egresos).toFixed(2)]));

      doc.save(`Informe_Ofrendas_${this.selectedYear}_${this.getIglesiaNombreReporte()}.pdf`);
  }
}
