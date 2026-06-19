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
import { MatMenuModule } from '@angular/material/menu';
import { ParticipacionEventoService } from '../../../../core/services/participacion-evento.service';
import { EventoService } from '../../../../core/services/evento.service';
import { MiembroService } from '../../../../core/services/miembro.service';
import { CertificadoService } from '../../../../core/services/certificado.service';
import { ParticipacionEvento } from '../../../../core/models/participacion-evento.model';
import { Evento } from '../../../../core/models/evento.model';
import { Miembro } from '../../../../core/models/miembro.model';
import { Certificado } from '../../../../core/models/certificado.model';
import { ParticipacionEventoCreateComponent } from '../participacion-evento-create/participacion-evento-create.component';
import { ParticipacionEventoDetailComponent } from '../participacion-evento-detail/participacion-evento-detail.component';
import { ParticipacionEventoEditComponent } from '../participacion-evento-edit/participacion-evento-edit.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { forkJoin } from 'rxjs';
import { CertificadoRenderComponent } from '../../certificado/certificado-render/certificado-render.component';

@Component({
  selector: 'app-participacion-evento-list',
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
    MatMenuModule
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

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private participacionService: ParticipacionEventoService,
    private eventoService: EventoService,
    private miembroService: MiembroService,
    private certificadoService: CertificadoService,
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
      certificados: this.certificadoService.getCertificados()
    }).subscribe(results => {
      this.eventos = results.eventos.datos || [];
      this.miembros = results.miembros.datos || [];
      this.certificados = results.certificados.datos || [];
      this.loadParticipaciones();
    });
  }

  loadParticipaciones() {
    this.participacionService.getParticipaciones().subscribe(response => {
      let participaciones = Array.isArray(response.datos) ? response.datos : [];
      participaciones.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
      participaciones.forEach(p => {
        p.eventoDto = this.eventos.find(e => e.id === p.eventoId);
        p.miembroDto = this.miembros.find(m => m.id === p.miembroId);
        if (p.certificadoId) {
          p.certificadoDto = this.certificados.find(c => c.id === p.certificadoId);
        }
      });
      this.dataSource.data = participaciones;
    });
  }

  getMiembroNombreCompleto(miembro?: Miembro): string {
    if (!miembro) return 'N/A';
    return `${miembro.nombre} ${miembro.apellido}`;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filterPredicate = (data: ParticipacionEvento, filter: string) => {
      const searchTerms = [
        this.getMiembroNombreCompleto(data.miembroDto),
        data.eventoDto?.nombre,
        data.certificadoDto?.codigoCertificado
      ].map(v => (v || '').toLowerCase()).join(' ');
      return searchTerms.includes(filter);
    };
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
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
      const action = participacion.estado ? 'desactivar' : 'activar';
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: `¿Está seguro que desea ${action}?`,
          message: `Está a punto de ${action} esta participación.`,
          confirmText: participacion.estado ? 'Desactivar' : 'Activar',
          type: 'warning'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && participacion.id) {
          this.participacionService.toggleEstado(participacion.id).subscribe(newEstado => {
            participacion.estado = newEstado;
            this.messageSnackBar(`Participación ${newEstado ? 'activada' : 'desactivada'}`);
          });
        }
      });
    }
  }

  deleteParticipacion(participacion: ParticipacionEvento) {
    if (participacion.id) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: '¿Está seguro que desea eliminar?',
          message: `Está a punto de eliminar permanentemente esta participación de evento. Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          type: 'danger'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && participacion.id) {
          this.participacionService.deleteParticipacion(participacion.id).subscribe({
            next: () => {
              this.loadParticipaciones(); // Let's check if loadParticipaciones exists in this class!
              this.messageSnackBar('Participación de evento eliminada exitosamente.');
            },
            error: (err) => {
              const errMsg = err.error?.message || 'No se pudo eliminar la participación de evento. Verifique si tiene dependencias asociadas.';
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
