import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { EventoService } from '../../../../core/services/evento.service';
import { TipoEventoService } from '../../../../core/services/tipo-evento.service';
import { EventoAceptacionService } from '../../../../core/services/evento-aceptacion.service';
import { MiembroIglesiaService } from '../../../../core/services/miembro-iglesia.service';
import { Evento } from '../../../../core/models/evento.model';
import { TipoEvento } from '../../../../core/models/tipo-evento.model';
import { EventoAceptacion } from '../../../../core/models/evento-aceptacion.model';
import { EventoCreateComponent } from '../evento-create/evento-create.component';
import { EventoDetailComponent } from '../evento-detail/evento-detail.component';
import { EventoEditComponent } from '../evento-edit/evento-edit.component';
import { EventoParticipantesComponent } from '../evento-participantes/evento-participantes.component';
import { EventoArchivadosDialogComponent } from '../evento-archivados-dialog/evento-archivados-dialog.component';
import { EventoHerramientaDialogComponent } from '../evento-herramienta-dialog/evento-herramienta-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { forkJoin, of } from 'rxjs';
import { HasPrivilegioDirective } from '../../../../core/directives/has-privilegio.directive';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { finalize } from 'rxjs/operators';
import { TipoEventoListComponent } from '../../tipo-evento/tipo-evento-list/tipo-evento-list.component';
import { ResponsableEventoListComponent } from '../../responsable-evento/responsable-evento-list/responsable-evento-list.component';
import { ParticipacionEventoListComponent } from '../../participacion-evento/participacion-evento-list/participacion-evento-list.component';
import { EventoCalendarioComponent } from '../evento-calendario/evento-calendario.component';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { AuthService } from '../../../../core/services/security/auth.service';
import { Iglesia } from '../../../../core/models/iglesia.model';

@Component({
  selector: 'app-evento-list',
  standalone: true,
  imports: [
    CommonModule,
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
    MatTooltipModule,
    MatChipsModule,
    MatSelectModule,
    MatMenuModule,
    MatDividerModule,
    HasPrivilegioDirective,
    LoadingSpinnerComponent
  ],
  templateUrl: './evento-list.component.html',
  styleUrls: ['./evento-list.component.css']
})
export class EventoListComponent implements OnInit {
  isLoading = true;
  displayedColumns: string[] = ['nombre', 'tipoEvento', 'ubicacion', 'fechaInicio', 'fechaFin', 'estado', 'acciones'];
  dataSource: MatTableDataSource<Evento>;
  tiposEvento: TipoEvento[] = [];
  iglesias: Iglesia[] = [];

  selectedTipoId: string = 'all';
  selectedEstado: string = 'all';
  selectedIglesiaId: any = 'all';
  searchText: string = '';

  isAdmin = false;
  currentChurchId: number | null = null;
  decisiones: EventoAceptacion[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private eventoService: EventoService,
    private tipoEventoService: TipoEventoService,
    private iglesiaService: IglesiaService,
    private authService: AuthService,
    private eventoAceptacionService: EventoAceptacionService,
    private miembroIglesiaService: MiembroIglesiaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Evento>([]);
  }

  ngOnInit() {
    this.isAdmin = this.authService.isLoggedRolAdmin();
    if (this.isAdmin) {
      // Agregar la columna 'iglesia' después de 'tipoEvento'
      this.displayedColumns = ['nombre', 'tipoEvento', 'iglesia', 'ubicacion', 'fechaInicio', 'fechaFin', 'estado', 'acciones'];
      this.loadIglesias();
    } else {
      this.currentChurchId = this.authService.getCurrentIglesiaId();
    }
    this.setupTableModifiers();
    this.loadInitialData();
  }

  private setupTableModifiers() {
    this.dataSource.filterPredicate = (data: Evento, filter: string) => {
      const textQuery = this.searchText.trim().toLowerCase();
      
      const matchesText = !textQuery || (
        (data.nombre || '') + ' ' +
        (data.ubicacion || '') + ' ' +
        (data.motivo || '')
      ).toLowerCase().includes(textQuery);
      
      const matchesTipo = this.selectedTipoId === 'all' || 
        (data.tipoEventoId !== undefined && data.tipoEventoId.toString() === this.selectedTipoId);
      
      const matchesEstado = this.selectedEstado === 'all' || 
        (this.selectedEstado === 'active' && data.estado) ||
        (this.selectedEstado === 'inactive' && !data.estado);

      let matchesIglesia = true;
      if (this.isAdmin) {
        matchesIglesia = this.selectedIglesiaId === 'all' || 
          (data.iglesiaId !== undefined && data.iglesiaId === this.selectedIglesiaId);
      } else if (this.currentChurchId) {
        const esPropio = data.iglesiaId !== undefined && data.iglesiaId === this.currentChurchId;
        const esInvitadoAceptado = this.decisiones.some(d => d.eventoId === data.id && d.estado === 'ACEPTADO');
        matchesIglesia = esPropio || esInvitadoAceptado;
      }
        
      return matchesText && matchesTipo && matchesEstado && matchesIglesia;
    };
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadIglesias() {
    this.iglesiaService.getIglesias().subscribe(res => {
      this.iglesias = (res.datos || []).filter(i => i.estado);
    });
  }

  getIglesiaNombre(id?: number): string {
    if (!id) return 'General';
    const ig = this.iglesias.find(i => i.id === id);
    return ig ? ig.nombre : `Iglesia #${id}`;
  }

  loadInitialData() {
    forkJoin({
      tiposEvento: this.tipoEventoService.getTipoEventos()
    }).subscribe(results => {
      this.tiposEvento = (results.tiposEvento.datos || []).filter(t => t.estado);
      this.loadEventos();
    });
  }

  loadEventos() {
    this.isLoading = true;
    forkJoin({
      eventos: this.eventoService.getEventos(),
      decisiones: this.currentChurchId ? this.eventoAceptacionService.getDecisionesPorIglesia(this.currentChurchId) : of({ datos: [] })
    }).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (res) => {
        this.decisiones = res.decisiones.datos || [];
        let eventos = Array.isArray(res.eventos.datos) ? res.eventos.datos : [];
        eventos.sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA;
        });
        const tiposMap = new Map<number, TipoEvento>();
        this.tiposEvento.forEach(t => { if (t.id !== undefined) tiposMap.set(t.id, t); });

        eventos.forEach(evento => {
          evento.tipoEventoDto = evento.tipoEventoId !== undefined ? tiposMap.get(evento.tipoEventoId) : undefined;
        });
        this.dataSource.data = eventos;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error al cargar eventos con decisiones:', err);
      }
    });
  }

  applyFilters() {
    this.dataSource.filter = '' + Math.random();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onSearchChange(event: Event) {
    this.searchText = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(EventoCreateComponent, {
      width: '700px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: { tiposEvento: this.tiposEvento }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEventos();
        this.messageSnackBar('Evento creado exitosamente');
      }
    });
  }

  openEditDialog(evento: Evento) {
    const dialogRef = this.dialog.open(EventoEditComponent, {
      width: '700px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: { evento, tiposEvento: this.tiposEvento }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEventos();
        this.messageSnackBar('Evento modificado exitosamente');
      }
    });
  }

  openDetailDialog(evento: Evento) {
    this.dialog.open(EventoDetailComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: evento
    });
  }

  openParticipantesDialog(evento: Evento) {
    this.dialog.open(EventoParticipantesComponent, {
      width: '700px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: evento
    });
  }

  toggleEstado(evento: Evento) {
    if (evento.id) {
      const action = evento.estado ? 'desactivar' : 'activar';
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: `¿Está seguro que desea ${action}?`,
          message: `Está a punto de ${action} el evento <strong>${evento.nombre}</strong>.`,
          confirmText: evento.estado ? 'Desactivar' : 'Activar',
          type: 'warning'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && evento.id) {
          this.eventoService.toggleEstado(evento.id).subscribe(newEstado => {
            evento.estado = newEstado;
            this.messageSnackBar(`Evento '${evento.nombre}' ${newEstado ? 'activado' : 'desactivado'}`);
          });
        }
      });
    }
  }

  deleteEvento(evento: Evento) {
    if (evento.id) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: '¿Está seguro que desea eliminar?',
          message: `Está a punto de eliminar permanentemente el evento <strong>${evento.nombre}</strong>. Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          type: 'danger'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && evento.id) {
          this.eventoService.deleteEvento(evento.id).subscribe({
            next: () => {
              this.loadEventos();
              this.messageSnackBar(`Evento '${evento.nombre}' eliminado exitosamente.`);
            },
            error: (err) => {
              const errMsg = err.error?.message || 'No se pudo eliminar el evento. Verifique si tiene dependencias asociadas.';
              // El evento tiene certificados o participantes: se avisa en un modal informativo.
              this.dialog.open(ConfirmDialogComponent, {
                width: '440px',
                data: {
                  title: 'No se puede eliminar',
                  message: errMsg,
                  confirmText: 'Entendido',
                  cancelText: 'Cerrar',
                  type: 'warning'
                }
              });
            }
          });
        }
      });
    }
  }

  archivarEvento(evento: Evento) {
    if (!evento.id) return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: '¿Archivar evento?',
        message: `El evento <strong>${evento.nombre}</strong> saldrá de la lista principal y podrá verse en "Herramientas → Eventos archivados", desde donde puede recuperarse.`,
        confirmText: 'Archivar',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && evento.id) {
        this.eventoService.archivar(evento.id).subscribe({
          next: () => {
            this.loadEventos();
            this.messageSnackBar(`Evento '${evento.nombre}' archivado.`);
          },
          error: (err) => {
            this.messageSnackBar(err.error?.message || 'Error al archivar el evento.', 'error');
          }
        });
      }
    });
  }

  openArchivadosDialog() {
    const dialogRef = this.dialog.open(EventoArchivadosDialogComponent, {
      width: '820px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: { tiposEvento: this.tiposEvento, iglesias: this.iglesias, isAdmin: this.isAdmin }
    });
    // Al cerrar, recargar por si se desarchivaron eventos.
    dialogRef.afterClosed().subscribe(() => this.loadEventos());
  }

  // Herramientas: abren en modal los antiguos paneles/pestañas.
  openCalendario() {
    this.openHerramienta('Calendario Anual', 'calendar_month', EventoCalendarioComponent);
  }
  openTiposEvento() {
    this.openHerramienta('Tipos de Evento', 'category', TipoEventoListComponent);
  }
  openResponsables() {
    this.openHerramienta('Responsables de Evento', 'assignment_ind', ResponsableEventoListComponent);
  }
  openParticipaciones() {
    this.openHerramienta('Participaciones', 'group', ParticipacionEventoListComponent);
  }

  private openHerramienta(title: string, icon: string, component: any) {
    const dialogRef = this.dialog.open(EventoHerramientaDialogComponent, {
      width: '92vw',
      maxWidth: '1150px',
      height: '86vh',
      panelClass: 'dialog-fullscreen-mobile',
      data: { title, icon, component }
    });
    dialogRef.afterClosed().subscribe(() => this.loadEventos());
  }

  messageSnackBar(message: string, type: 'success' | 'warning' | 'error' = 'success') {
    const panelClass = type === 'success' ? 'success-snackbar' : type === 'warning' ? 'warning-snackbar' : 'error-snackbar';
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: [panelClass]
    });
  }

  archivarInvitacion(evento: Evento) {
    if (!this.currentChurchId || !evento.id) return;
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '¿Está seguro que desea archivar?',
        message: `Está a punto de archivar la invitación al evento <strong>${evento.nombre}</strong>. Dejará de mostrarse en su lista de gestión de eventos, pero podrá recuperarlo en el Historial de Notificaciones.`,
        confirmText: 'Archivar',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && evento.id && this.currentChurchId) {
        this.eventoAceptacionService.decidir({
          eventoId: evento.id,
          iglesiaId: this.currentChurchId,
          estado: 'ARCHIVADO'
        }).subscribe({
          next: () => {
            this.loadEventos();
            this.messageSnackBar(`Invitación al evento '${evento.nombre}' archivada exitosamente.`);
            // Notificar a la campana
            this.miembroIglesiaService.notifySolicitudesChanged();
          },
          error: (err) => {
            const errMsg = err.error?.message || 'Error al archivar la invitación.';
            this.messageSnackBar(errMsg, 'error');
          }
        });
      }
    });
  }
}
