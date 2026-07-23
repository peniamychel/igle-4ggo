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
import { CertificadoService } from '../../../../core/services/certificado.service';
import { EventoService } from '../../../../core/services/evento.service';
import { TipoEventoService } from '../../../../core/services/tipo-evento.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { AuthService } from '../../../../core/services/security/auth.service';
import { Certificado } from '../../../../core/models/certificado.model';
import { Evento } from '../../../../core/models/evento.model';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { InformeLoteDialogComponent } from '../informe-lote-dialog/informe-lote-dialog.component';
import { cargarLogo, iniciarInforme, tituloSeccion, agregarTabla, agregarGrafico, esperarRender } from '../../../../shared/utils/informe-pdf.util';

interface FilaCert {
  evento: string;
  tipoEvento: string;
  motivo: string;
  estado: string;
}

@Component({
  selector: 'app-informe-certificados',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, NgxChartsModule, LoadingSpinnerComponent
  ],
  templateUrl: './informe-certificados.component.html',
  styleUrls: ['../informe-shared.css']
})
export class InformeCertificadosComponent implements OnInit {
  isAdmin = false;
  iglesias: Iglesia[] = [];
  selectedIglesiaId: number | 'all' = 'all';

  isLoading = true;
  isGenerating = false;

  private certificados: Certificado[] = [];
  private eventosMap = new Map<number, Evento>();
  private tiposMap = new Map<number, string>();

  filas: FilaCert[] = [];
  totalCert = 0;
  activos = 0;
  inactivos = 0;
  tipoEventoData: any[] = [];

  view: [number, number] = [420, 300];
  schemeTipo: any = { domain: ['#7F0B85', '#0B857F', '#ff9800', '#2196f3', '#e91e63', '#3f51b5', '#00c853'] };

  @ViewChild('chartTipo') chartTipo!: ElementRef;

  constructor(
    private certificadoService: CertificadoService,
    private eventoService: EventoService,
    private tipoEventoService: TipoEventoService,
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
    forkJoin({
      certificados: this.certificadoService.getCertificados(),
      eventos: this.eventoService.getEventos(),
      tipos: this.tipoEventoService.getTipoEventos()
    }).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (res: any) => {
        this.certificados = Array.isArray(res.certificados.datos) ? res.certificados.datos : [];
        this.eventosMap.clear();
        (res.eventos.datos || []).forEach((e: Evento) => { if (e.id != null) this.eventosMap.set(e.id, e); });
        this.tiposMap.clear();
        (res.tipos.datos || []).forEach((t: any) => { if (t.id != null) this.tiposMap.set(t.id, t.nombre); });
        this.compute();
      },
      error: () => { this.certificados = []; this.compute(); }
    });
  }

  private tipoEventoDeCert(c: Certificado): string {
    const ev = c.eventoId != null ? this.eventosMap.get(c.eventoId) : undefined;
    return (ev?.tipoEventoId != null ? this.tiposMap.get(ev.tipoEventoId) : null) || 'Sin tipo';
  }

  private compute(): void {
    const filtrados = this.certificados.filter(c => {
      if (this.isAdmin && this.selectedIglesiaId !== 'all') {
        const ev = c.eventoId != null ? this.eventosMap.get(c.eventoId) : undefined;
        return ev?.iglesiaId === this.selectedIglesiaId;
      }
      return true;
    });

    this.totalCert = filtrados.length;
    this.activos = filtrados.filter(c => c.estado).length;
    this.inactivos = this.totalCert - this.activos;

    // Gráfico por tipo de evento
    const porTipo = new Map<string, number>();
    for (const c of filtrados) {
      const tipo = this.tipoEventoDeCert(c);
      porTipo.set(tipo, (porTipo.get(tipo) || 0) + 1);
    }
    this.tipoEventoData = Array.from(porTipo.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    this.filas = filtrados.map(c => {
      const ev = c.eventoId != null ? this.eventosMap.get(c.eventoId) : undefined;
      return {
        evento: ev?.nombre || 'N/A',
        tipoEvento: this.tipoEventoDeCert(c),
        motivo: c.motivoCertificado || '—',
        estado: c.estado ? 'Activo' : 'Inactivo'
      };
    });
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
        titulo: 'Informe de Certificaciones',
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
        titulo: 'Informe de Certificaciones',
        iglesia: this.getIglesiaNombreReporte(),
        logo
      });

      y = tituloSeccion(doc, y, 'Resumen');
      y = agregarTabla(doc, y, ['Indicador', 'Valor'], [
        ['Total de certificados', this.totalCert],
        ['Activos', this.activos],
        ['Inactivos', this.inactivos]
      ]);

      if (this.tipoEventoData.length && this.chartTipo?.nativeElement) {
        y = tituloSeccion(doc, y, 'Certificados por tipo de evento');
        y = await agregarGrafico(doc, y, this.chartTipo.nativeElement);
      }

      y = tituloSeccion(doc, y, 'Listado de certificados');
      agregarTabla(doc, y, ['Evento', 'Tipo de evento', 'Motivo', 'Estado'],
        this.filas.map(f => [f.evento, f.tipoEvento, f.motivo, f.estado]));

      doc.save(`Informe_Certificaciones_${this.getIglesiaNombreReporte()}.pdf`);
  }
}
