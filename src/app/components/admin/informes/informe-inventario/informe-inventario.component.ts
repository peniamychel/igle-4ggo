import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { finalize } from 'rxjs/operators';
import { ActivoService } from '../../../../core/services/activo.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { AuthService } from '../../../../core/services/security/auth.service';
import { Activo } from '../../../../core/models/activo.model';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { InformeLoteDialogComponent } from '../informe-lote-dialog/informe-lote-dialog.component';
import { cargarLogo, iniciarInforme, tituloSeccion, agregarTabla, agregarGrafico, esperarRender } from '../../../../shared/utils/informe-pdf.util';

@Component({
  selector: 'app-informe-inventario',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, NgxChartsModule, LoadingSpinnerComponent
  ],
  templateUrl: './informe-inventario.component.html',
  styleUrls: ['../informe-shared.css']
})
export class InformeInventarioComponent implements OnInit {
  isAdmin = false;
  iglesias: Iglesia[] = [];
  selectedIglesiaId: number | 'all' = 'all';

  activos: Activo[] = [];
  isLoading = true;
  isGenerating = false;

  totalBienes = 0;
  valorTotal = 0;
  conservacionData: any[] = [];

  view: [number, number] = [420, 300];
  scheme: any = { domain: ['#0B857F', '#ff9800', '#dc3545', '#718096'] };

  @ViewChild('chartConservacion') chartConservacion!: ElementRef;

  constructor(
    private activoService: ActivoService,
    private iglesiaService: IglesiaService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isLoggedRolAdmin();
    if (this.isAdmin) {
      this.iglesiaService.getIglesias().subscribe(res => {
        this.iglesias = (res.datos || []).filter(i => i.estado);
      });
    }
    this.loadDatos();
  }

  onFiltroChange(): void {
    this.compute();
  }

  loadDatos(): void {
    this.isLoading = true;
    // El admin carga todas las iglesias (luego filtra por sede); el pastor/encargado
    // solo debe ver los bienes de SU iglesia.
    const obs = this.isAdmin
      ? this.activoService.getActivos()
      : this.activoService.getActivosByIglesia(this.authService.getCurrentIglesiaId() || 0);
    obs.pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (res) => {
        this.activosAll = Array.isArray(res.datos) ? res.datos : [];
        this.compute();
      },
      error: () => { this.activosAll = []; this.compute(); }
    });
  }

  private activosAll: Activo[] = [];

  private compute(): void {
    this.activos = this.activosAll.filter(a =>
      !(this.isAdmin && this.selectedIglesiaId !== 'all' && a.iglesiaId !== this.selectedIglesiaId));
    this.totalBienes = this.activos.length;
    this.valorTotal = this.activos.reduce((s, a) => s + (Number(a.valorEstimado) || 0), 0);

    // Gráfico por estado de conservación (conteo de bienes, sin sumar cantidades)
    const porEstado = new Map<string, number>();
    for (const a of this.activos) {
      const estado = (a.estadoConservacion || 'Sin definir').toString();
      const key = estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
      porEstado.set(key, (porEstado.get(key) || 0) + 1);
    }
    this.conservacionData = Array.from(porEstado.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((x, z) => z.value - x.value);
  }

  getIglesiaNombreReporte(): string {
    if (!this.isAdmin) return this.authService.getCurrentIglesiaNombre() || 'Mi Iglesia';
    if (this.selectedIglesiaId === 'all') return 'Todas las sedes (consolidado)';
    const ig = this.iglesias.find(i => i.id === this.selectedIglesiaId);
    return ig ? ig.nombre : 'Sede';
  }

  fecha(a: Activo): string {
    return a.fechaAdquisicion ? new Date(a.fechaAdquisicion).toLocaleDateString('es-ES') : '—';
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
        titulo: 'Informe de Inventario',
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
        titulo: 'Informe de Inventario',
        iglesia: this.getIglesiaNombreReporte(),
        logo
      });

      y = tituloSeccion(doc, y, 'Resumen');
      y = agregarTabla(doc, y, ['Indicador', 'Valor'], [
        ['Bienes registrados', this.totalBienes],
        ['Valor estimado total (Bs.)', this.valorTotal.toFixed(2)]
      ]);

      if (this.conservacionData.length && this.chartConservacion?.nativeElement) {
        y = tituloSeccion(doc, y, 'Bienes por estado de conservación');
        y = await agregarGrafico(doc, y, this.chartConservacion.nativeElement);
      }

      y = tituloSeccion(doc, y, 'Listado de bienes');
      agregarTabla(doc, y, ['Código', 'Nombre', 'Cant.', 'Estado', 'Valor (Bs.)', 'Adquisición'],
        this.activos.map(a => [
          a.codigo || '—',
          a.nombre || '—',
          a.cantidad ?? 0,
          a.estadoConservacion || '—',
          (Number(a.valorEstimado) || 0).toFixed(2),
          this.fecha(a)
        ]));

      doc.save(`Informe_Inventario_${this.getIglesiaNombreReporte()}.pdf`);
  }
}
