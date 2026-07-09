import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { ParticipacionEventoService } from '../../../../core/services/participacion-evento.service';
import { EventoService } from '../../../../core/services/evento.service';
import { MiembroService } from '../../../../core/services/miembro.service';
import { CertificadoService } from '../../../../core/services/certificado.service';
import { TipoEventoService } from '../../../../core/services/tipo-evento.service';
import { ParticipacionEvento } from '../../../../core/models/participacion-evento.model';
import { Evento } from '../../../../core/models/evento.model';
import { Miembro } from '../../../../core/models/miembro.model';
import { Certificado } from '../../../../core/models/certificado.model';
import { TipoEvento } from '../../../../core/models/tipo-evento.model';
import { ParticipacionEventoCreateComponent } from '../participacion-evento-create/participacion-evento-create.component';
import { ParticipacionEventoDetailComponent } from '../participacion-evento-detail/participacion-evento-detail.component';
import { ParticipacionEventoEditComponent } from '../participacion-evento-edit/participacion-evento-edit.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { forkJoin } from 'rxjs';
import { HasPrivilegioDirective } from '../../../../core/directives/has-privilegio.directive';
import { CertificadoRenderComponent } from '../../certificado/certificado-render/certificado-render.component';

@Component({
  selector: 'app-participacion-evento-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatCardModule,
    MatTooltipModule,
    MatChipsModule,
    MatMenuModule,
    HasPrivilegioDirective
  ],
  templateUrl: './participacion-evento-list.component.html',
  styleUrls: ['./participacion-evento-list.component.css']
})
export class ParticipacionEventoListComponent implements OnInit {
  displayedColumns: string[] = ['miembro', 'evento', 'fecha', 'certificado', 'estado', 'acciones'];
  dataSource: MatTableDataSource<ParticipacionEvento>;
  eventos: Evento[] = [];
  miembros: Miembro[] = [];
  certificados: Certificado[] = [];
  tiposEvento: TipoEvento[] = [];

  // Filtros reactivos
  selectedTipoEventoId: string = 'all';
  filterEventoNombre: string = '';
  selectedCertificadoStatus: string = 'all';
  searchText: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private participacionService: ParticipacionEventoService,
    private eventoService: EventoService,
    private miembroService: MiembroService,
    private certificadoService: CertificadoService,
    private tipoEventoService: TipoEventoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<ParticipacionEvento>([]);
  }

  ngOnInit() {
    this.loadInitialData();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadInitialData() {
    forkJoin({
      eventos: this.eventoService.getEventos(),
      miembros: this.miembroService.getMiembros(),
      certificados: this.certificadoService.getCertificados(),
      tiposEvento: this.tipoEventoService.getTipoEventos()
    }).subscribe(results => {
      this.eventos = results.eventos.datos || [];
      this.miembros = results.miembros.datos || [];
      this.certificados = results.certificados.datos || [];
      this.tiposEvento = (results.tiposEvento.datos || []).filter(te => te.estado);
      this.setupFilterPredicate();
      this.loadParticipaciones();
    });
  }

  setupFilterPredicate() {
    this.dataSource.filterPredicate = (data: ParticipacionEvento, filter: string) => {
      // 1. Tipo de evento filter
      if (this.selectedTipoEventoId !== 'all') {
        const eventType = data.eventoDto?.tipoEventoId;
        if (eventType === undefined || eventType.toString() !== this.selectedTipoEventoId) {
          return false;
        }
      }

      // 2. Nombre del evento filter
      if (this.filterEventoNombre.trim()) {
        const eventName = data.eventoDto?.nombre || '';
        if (!eventName.toLowerCase().includes(this.filterEventoNombre.toLowerCase().trim())) {
          return false;
        }
      }

      // 3. Certificado status filter
      if (this.selectedCertificadoStatus !== 'all') {
        const hasCert = !!data.certificadoId || !!data.certificadoDto;
        if (this.selectedCertificadoStatus === 'con' && !hasCert) {
          return false;
        }
        if (this.selectedCertificadoStatus === 'sin' && hasCert) {
          return false;
        }
      }

      // 4. General search text filter
      if (this.searchText.trim()) {
        const textQuery = this.searchText.toLowerCase().trim();
        const searchTerms = [
          this.getMiembroNombreCompleto(data.miembroDto),
          data.eventoDto?.nombre,
          data.certificadoDto?.tipoCertificadoDto?.nombre,
          data.certificadoDto?.motivoCertificado
        ].map(v => (v || '').toLowerCase()).join(' ');
        if (!searchTerms.includes(textQuery)) {
          return false;
        }
      }

      return true;
    };
  }

  onFilterChange() {
    this.dataSource.filter = '' + Math.random();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  loadParticipaciones() {
    this.participacionService.getParticipaciones().subscribe(response => {
      let participaciones = Array.isArray(response.datos) ? response.datos : [];
      participaciones.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
      const eventosMap = new Map<number, Evento>();
      this.eventos.forEach(e => { if (e.id !== undefined) eventosMap.set(e.id, e); });

      const miembrosMap = new Map<number, Miembro>();
      this.miembros.forEach(m => { if (m.id !== undefined) miembrosMap.set(m.id, m); });

      const certificadosMap = new Map<number, Certificado>();
      this.certificados.forEach(c => { if (c.id !== undefined) certificadosMap.set(c.id, c); });

      participaciones.forEach(p => {
        p.eventoDto = p.eventoId !== undefined ? eventosMap.get(p.eventoId) : undefined;
        p.miembroDto = p.miembroId !== undefined ? miembrosMap.get(p.miembroId) : undefined;
        if (p.certificadoId) {
          p.certificadoDto = certificadosMap.get(p.certificadoId);
        }
      });
      this.dataSource.data = participaciones;
      this.onFilterChange();
    });
  }

  getMiembroNombreCompleto(miembro?: Miembro): string {
    if (!miembro) return 'N/A';
    return `${miembro.nombre} ${miembro.apellido}`;
  }

  applyFilter(event: Event) {
    this.searchText = (event.target as HTMLInputElement).value;
    this.onFilterChange();
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(ParticipacionEventoCreateComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: {
        eventos: this.eventos,
        miembros: this.miembros,
        certificados: this.certificados
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadParticipaciones();
        this.messageSnackBar('Participación registrada exitosamente');
      }
    });
  }

  openEditDialog(participacion: ParticipacionEvento) {
    const dialogRef = this.dialog.open(ParticipacionEventoEditComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: {
        participacion,
        eventos: this.eventos,
        miembros: this.miembros,
        certificados: this.certificados
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadParticipaciones();
        this.messageSnackBar('Participación modificada exitosamente');
      }
    });
  }

  openDetailDialog(participacion: ParticipacionEvento) {
    this.dialog.open(ParticipacionEventoDetailComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: participacion
    });
  }

  downloadPdf(participacion: ParticipacionEvento) {
    if (!participacion.certificadoDto) {
      this.messageSnackBar('Esta participación no tiene un certificado asignado', 'error');
      return;
    }
    this.dialog.open(CertificadoRenderComponent, {
      width: '1200px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: { participacion }
    });
  }

  toggleEstado(participacion: ParticipacionEvento) {
    if (participacion.id) {
      this.participacionService.toggleEstado(participacion.id).subscribe({
        next: () => {
          this.loadParticipaciones();
          this.messageSnackBar('Estado actualizado exitosamente');
        },
        error: (err) => {
          console.error('Error al cambiar estado:', err);
          this.messageSnackBar('Error al cambiar el estado de la participación', 'error');
        }
      });
    }
  }

  deleteParticipacion(participacion: ParticipacionEvento) {
    if (!participacion.id) return;
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar Eliminación',
        message: `¿Está seguro de que desea eliminar la participación de ${this.getMiembroNombreCompleto(participacion.miembroDto)}?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.participacionService.deleteParticipacion(participacion.id!).subscribe({
          next: () => {
            this.loadParticipaciones();
            this.messageSnackBar('Participación eliminada exitosamente');
          },
          error: (err) => {
            console.error('Error al eliminar participación:', err);
            this.messageSnackBar('Error al eliminar participación.', 'error');
          }
        });
      }
    });
  }

  messageSnackBar(message: string, type: 'success' | 'warning' | 'error' = 'success') {
    const panelClass = type === 'success' ? 'success-snackbar' : type === 'warning' ? 'warning-snackbar' : 'error-snackbar';
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: [panelClass]
    });
  }
}