import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { EventoService } from '../../../../core/services/evento.service';
import { ParticipacionEventoService } from '../../../../core/services/participacion-evento.service';
import { TipoEventoService } from '../../../../core/services/tipo-evento.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { AuthService } from '../../../../core/services/security/auth.service';
import { Evento } from '../../../../core/models/evento.model';
import { ParticipacionEvento } from '../../../../core/models/participacion-evento.model';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { InformeLoteDialogComponent } from '../informe-lote-dialog/informe-lote-dialog.component';
import { cargarLogo, iniciarInforme, tituloSeccion, agregarTabla, agregarGrafico, esperarRender } from '../../../../shared/utils/informe-pdf.util';

@Component({
  selector: 'app-informe-eventos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, NgxChartsModule, LoadingSpinnerComponent
  ],
  templateUrl: './informe-eventos.component.html',
  styleUrls: ['../informe-shared.css']
})
export class InformeEventosComponent implements OnInit {
  isAdmin = false;
  iglesias: Iglesia[] = [];
  selectedIglesiaId: number | 'all' = 'all';
  selectedYear: number = new Date().getFullYear();
  anosDisponibles: number[] = [];

  isLoading = true;
  isGenerating = false;

  private eventos: Evento[] = [];
  private participaciones: ParticipacionEvento[] = [];
  private tiposMap = new Map<number, string>();

  totalEventos = 0;
  totalParticipaciones = 0;
  participacionTipoData: any[] = [];
  eventosTabla: { nombre: string; tipo: string; fecha: string; participantes: number }[] = [];

  view: [number, number] = [420, 300];
  scheme: any = { domain: ['#7F0B85', '#0B857F', '#ff9800', '#2196f3', '#e91e63', '#3f51b5', '#00c853'] };

  @ViewChild('chartTipo') chartTipo!: ElementRef;

  constructor(
    private eventoService: EventoService,
    private participacionService: ParticipacionEventoService,
    private tipoEventoService: TipoEventoService,
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
    this.compute();
  }

  loadDatos(): void {
    this.isLoading = true;
    forkJoin({
      eventos: this.eventoService.getEventos(),
      participaciones: this.participacionService.getParticipaciones(),
      tipos: this.tipoEventoService.getTipoEventos()
    }).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (res: any) => {
        this.eventos = Array.isArray(res.eventos.datos) ? res.eventos.datos : [];
        this.participaciones = Array.isArray(res.participaciones.datos) ? res.participaciones.datos : [];
        this.tiposMap.clear();
        (res.tipos.datos || []).forEach((t: any) => { if (t.id != null) this.tiposMap.set(t.id, t.nombre); });
        this.compute();
      },
      error: () => { this.eventos = []; this.participaciones = []; this.compute(); }
    });
  }

  private compute(): void {
    // Eventos del año/iglesia seleccionados
    const eventosMap = new Map<number, Evento>();
    const eventosFiltrados = this.eventos.filter(e => {
      if (this.isAdmin && this.selectedIglesiaId !== 'all' && e.iglesiaId !== this.selectedIglesiaId) return false;
      if (!e.fechaInicio) return false;
      const d = new Date(e.fechaInicio);
      return !isNaN(d.getTime()) && d.getFullYear() === this.selectedYear;
    });
    eventosFiltrados.forEach(e => { if (e.id != null) eventosMap.set(e.id, e); });

    // Participaciones de esos eventos
    const partsPorEvento = new Map<number, number>();
    const partsPorTipo = new Map<string, number>();
    let totalParts = 0;
    for (const p of this.participaciones) {
      if (p.estado === false) continue;
      if (p.eventoId == null || !eventosMap.has(p.eventoId)) continue;
      totalParts++;
      partsPorEvento.set(p.eventoId, (partsPorEvento.get(p.eventoId) || 0) + 1);
      const ev = eventosMap.get(p.eventoId)!;
      const tipo = (ev.tipoEventoId != null ? this.tiposMap.get(ev.tipoEventoId) : null) || 'Sin tipo';
      partsPorTipo.set(tipo, (partsPorTipo.get(tipo) || 0) + 1);
    }

    this.totalEventos = eventosFiltrados.length;
    this.totalParticipaciones = totalParts;
    this.participacionTipoData = Array.from(partsPorTipo.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    this.eventosTabla = eventosFiltrados
      .sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime())
      .map(e => ({
        nombre: e.nombre,
        tipo: (e.tipoEventoId != null ? this.tiposMap.get(e.tipoEventoId) : null) || 'Sin tipo',
        fecha: e.fechaInicio ? new Date(e.fechaInicio).toLocaleDateString('es-ES') : '—',
        participantes: (e.id != null ? partsPorEvento.get(e.id) : 0) || 0
      }));
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

  abrirLote(): void {
    const ref = this.dialog.open(InformeLoteDialogComponent, {
      width: '560px', maxWidth: '95vw', panelClass: 'dialog-fullscreen-mobile', disableClose: true,
      data: {
        titulo: `Informe de Eventos — ${this.selectedYear}`,
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
        titulo: 'Informe de Eventos',
        iglesia: this.getIglesiaNombreReporte(),
        periodo: `Gestión ${this.selectedYear}`,
        logo
      });

      y = tituloSeccion(doc, y, 'Resumen');
      y = agregarTabla(doc, y, ['Indicador', 'Valor'], [
        ['Total de eventos', this.totalEventos],
        ['Total de participaciones', this.totalParticipaciones]
      ]);

      if (this.participacionTipoData.length && this.chartTipo?.nativeElement) {
        y = tituloSeccion(doc, y, 'Participación por tipo de evento');
        y = await agregarGrafico(doc, y, this.chartTipo.nativeElement);
      }

      y = tituloSeccion(doc, y, 'Listado de eventos');
      agregarTabla(doc, y, ['Evento', 'Tipo', 'Fecha', 'Participantes'],
        this.eventosTabla.map(e => [e.nombre, e.tipo, e.fecha, e.participantes]));

      doc.save(`Informe_Eventos_${this.selectedYear}_${this.getIglesiaNombreReporte()}.pdf`);
  }
}
