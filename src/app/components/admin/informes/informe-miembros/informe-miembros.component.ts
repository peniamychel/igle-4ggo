import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MiembroService } from '../../../../core/services/miembro.service';
import { MiembroIglesiaService } from '../../../../core/services/miembro-iglesia.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { AuthService } from '../../../../core/services/security/auth.service';
import { Miembro } from '../../../../core/models/miembro.model';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { InformeLoteDialogComponent } from '../informe-lote-dialog/informe-lote-dialog.component';
import { calcularEdad, grupoEtario, GRUPOS_ETARIOS } from '../../../../shared/utils/edad.util';
import { cargarLogo, iniciarInforme, tituloSeccion, agregarTabla, agregarGrafico, esperarRender } from '../../../../shared/utils/informe-pdf.util';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-informe-miembros',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, NgxChartsModule, LoadingSpinnerComponent
  ],
  templateUrl: './informe-miembros.component.html',
  styleUrls: ['../informe-shared.css']
})
export class InformeMiembrosComponent implements OnInit {
  isAdmin = false;
  iglesias: Iglesia[] = [];
  selectedIglesiaId: number | 'all' = 'all';

  miembros: Miembro[] = [];
  isLoading = true;
  isGenerating = false;

  totalMiembros = 0;
  generoData: any[] = [];
  edadesData: any[] = [];
  crecimientoData: any[] = [];

  view: [number, number] = [360, 260];
  viewWide: [number, number] = [760, 280];
  schemeGenero: any = { domain: ['#2196f3', '#e91e63'] };
  schemeEdades: any = { domain: ['#7F0B85', '#0B857F', '#ff9800', '#3f51b5'] };
  schemeCrecimiento: any = { domain: ['#7F0B85'] };

  @ViewChild('chartGenero') chartGenero!: ElementRef;
  @ViewChild('chartEdades') chartEdades!: ElementRef;
  @ViewChild('chartCrecimiento') chartCrecimiento!: ElementRef;

  constructor(
    private miembroService: MiembroService,
    private miembroIglesiaService: MiembroIglesiaService,
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
    this.cargarMiembros();
  }

  loadDatos(): void {
    this.cargarMiembros();
  }

  private cargarMiembros(): Promise<void> {
    this.isLoading = true;
    let source$;
    if (!this.isAdmin) {
      source$ = this.miembroIglesiaService.getMisMiembros();
    } else if (this.selectedIglesiaId !== 'all') {
      source$ = this.miembroIglesiaService.getMiembrosPorIglesia(this.selectedIglesiaId as number);
    } else {
      source$ = this.miembroService.getMiembros();
    }

    return new Promise<void>((resolve) => {
      source$.pipe(finalize(() => this.isLoading = false)).subscribe({
        next: (res: any) => { this.miembros = Array.isArray(res.datos) ? res.datos : []; this.computeCharts(); resolve(); },
        error: () => { this.miembros = []; this.computeCharts(); resolve(); }
      });
    });
  }

  private computeCharts(): void {
    this.totalMiembros = this.miembros.length;

    // Género
    let hombres = 0, mujeres = 0;
    // Grupos etarios
    const etarios: Record<string, number> = { 'Niños': 0, 'Adolescentes': 0, 'Jóvenes': 0, 'Adultos': 0 };
    // Crecimiento por mes (acumulado) usando createdAt
    const porMes = new Map<string, number>();

    for (const m of this.miembros) {
      const sexo = (m.sexo || '').toLowerCase();
      if (sexo === 'hombre' || sexo === 'm') hombres++;
      else if (sexo === 'mujer' || sexo === 'f') mujeres++;

      const g = grupoEtario(calcularEdad(m.fechaNac));
      if (g) etarios[g]++;

      if (m.createdAt) {
        const d = new Date(m.createdAt);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          porMes.set(key, (porMes.get(key) || 0) + 1);
        }
      }
    }

    this.generoData = [
      { name: 'Hombres', value: hombres },
      { name: 'Mujeres', value: mujeres }
    ];

    this.edadesData = GRUPOS_ETARIOS.map(g => ({ name: g, value: etarios[g] }));

    // Serie acumulada ordenada por fecha
    const keys = Array.from(porMes.keys()).sort();
    let acumulado = 0;
    const serie = keys.map(k => {
      acumulado += porMes.get(k)!;
      return { name: k, value: acumulado };
    });
    this.crecimientoData = serie.length ? [{ name: 'Miembros', series: serie }] : [];
  }

  getIglesiaNombreReporte(): string {
    if (!this.isAdmin) return this.authService.getCurrentIglesiaNombre() || 'Mi Iglesia';
    if (this.selectedIglesiaId === 'all') return 'Todas las sedes (consolidado)';
    const ig = this.iglesias.find(i => i.id === this.selectedIglesiaId);
    return ig ? ig.nombre : 'Sede';
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

  /** Abre el diálogo de lote (admin): genera un PDF por cada iglesia marcada. */
  abrirLote(): void {
    const ref = this.dialog.open(InformeLoteDialogComponent, {
      width: '560px', maxWidth: '95vw', panelClass: 'dialog-fullscreen-mobile', disableClose: true,
      data: {
        titulo: 'Informe de Miembros',
        iglesias: this.iglesias.filter(i => i.id != null).map(i => ({ id: i.id!, nombre: i.nombre })),
        generarUno: (iglesiaId: number) => this.generarPdfParaIglesia(iglesiaId)
      }
    });
    ref.afterClosed().subscribe(() => { this.selectedIglesiaId = 'all'; this.cargarMiembros(); });
  }

  private async generarPdfParaIglesia(iglesiaId: number): Promise<void> {
    this.selectedIglesiaId = iglesiaId;
    await this.cargarMiembros();
    await esperarRender();
    await this.construirYGuardarPdf();
  }

  private async construirYGuardarPdf(): Promise<void> {
      const logo = await cargarLogo();
      let { doc, y } = iniciarInforme({
        titulo: 'Informe de Miembros',
        iglesia: this.getIglesiaNombreReporte(),
        logo
      });

      // Resumen
      y = tituloSeccion(doc, y, 'Resumen');
      const hombres = this.generoData.find(g => g.name === 'Hombres')?.value || 0;
      const mujeres = this.generoData.find(g => g.name === 'Mujeres')?.value || 0;
      y = agregarTabla(doc, y, ['Indicador', 'Valor'], [
        ['Total de miembros', this.totalMiembros],
        ['Hombres', hombres],
        ['Mujeres', mujeres],
        ...this.edadesData.map(e => [e.name, e.value] as [string, number])
      ]);

      // Gráficos
      if (this.chartGenero?.nativeElement) {
        y = tituloSeccion(doc, y, 'Distribución por género');
        y = await agregarGrafico(doc, y, this.chartGenero.nativeElement);
      }
      if (this.chartEdades?.nativeElement) {
        y = tituloSeccion(doc, y, 'Distribución por grupo etario');
        y = await agregarGrafico(doc, y, this.chartEdades.nativeElement);
      }
      if (this.crecimientoData.length && this.chartCrecimiento?.nativeElement) {
        y = tituloSeccion(doc, y, 'Crecimiento de miembros');
        y = await agregarGrafico(doc, y, this.chartCrecimiento.nativeElement);
      }

      // Tabla de miembros
      y = tituloSeccion(doc, y, 'Listado de miembros');
      const cols = this.isAdmin
        ? ['Nombre', 'CI', 'Sexo', 'Edad', 'Iglesia']
        : ['Nombre', 'CI', 'Sexo', 'Edad'];
      const rows = this.miembros.map(m => {
        const base = [
          `${m.nombre || ''} ${m.apellido || ''}`.trim(),
          m.ci != null ? String(m.ci) : '—',
          m.sexo || '—',
          (calcularEdad(m.fechaNac) ?? '—').toString()
        ];
        return this.isAdmin ? [...base, m.iglesiaNombre || 'Sin iglesia'] : base;
      });
      agregarTabla(doc, y, cols, rows);

      doc.save(`Informe_Miembros_${this.getIglesiaNombreReporte()}.pdf`);
  }
}
