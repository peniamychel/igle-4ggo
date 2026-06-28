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
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { EventoService } from '../../../../core/services/evento.service';
import { TipoEventoService } from '../../../../core/services/tipo-evento.service';
import { Evento } from '../../../../core/models/evento.model';
import { TipoEvento } from '../../../../core/models/tipo-evento.model';
import { EventoCreateComponent } from '../evento-create/evento-create.component';
import { EventoDetailComponent } from '../evento-detail/evento-detail.component';
import { EventoEditComponent } from '../evento-edit/evento-edit.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { forkJoin } from 'rxjs';
import { HasPrivilegioDirective } from '../../../../core/directives/has-privilegio.directive';
import { TipoEventoListComponent } from '../../tipo-evento/tipo-evento-list/tipo-evento-list.component';
import { ResponsableEventoListComponent } from '../../responsable-evento/responsable-evento-list/responsable-evento-list.component';
import { ParticipacionEventoListComponent } from '../../participacion-evento/participacion-evento-list/participacion-evento-list.component';
import { EventoCalendarioComponent } from '../evento-calendario/evento-calendario.component';

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
    MatTabsModule,
    MatSelectModule,
    MatMenuModule,
    HasPrivilegioDirective,
    TipoEventoListComponent,
    ResponsableEventoListComponent,
    ParticipacionEventoListComponent,
    EventoCalendarioComponent
  ],
  templateUrl: './evento-list.component.html',
  styleUrls: ['./evento-list.component.css']
})
export class EventoListComponent implements OnInit {
  displayedColumns: string[] = ['nombre', 'tipoEvento', 'ubicacion', 'fechaInicio', 'fechaFin', 'estado', 'acciones'];
  dataSource: MatTableDataSource<Evento>;
  tiposEvento: TipoEvento[] = [];

  selectedTipoId: string = 'all';
  selectedEstado: string = 'all';
  searchText: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private eventoService: EventoService,
    private tipoEventoService: TipoEventoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Evento>([]);
  }

  ngOnInit() {
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
        
      return matchesText && matchesTipo && matchesEstado;
    };
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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
    this.eventoService.getEventos().subscribe(response => {
      let eventos = Array.isArray(response.datos) ? response.datos : [];
      eventos.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
      eventos.forEach(evento => {
        evento.tipoEventoDto = this.tiposEvento.find(t => t.id === evento.tipoEventoId);
      });
      this.dataSource.data = eventos;
      this.applyFilters();
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
              this.messageSnackBar(errMsg, 'error');
            }
          });
        }
      });
    }
  }

  messageSnackBar(message: string, type: 'success' | 'warning' | 'error' = 'success') {
    const panelClass = type === 'success' ? 'success-snackbar' : type === 'warning' ? 'warning-snackbar' : 'error-snackbar';
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: [panelClass]
    });
  }
}
