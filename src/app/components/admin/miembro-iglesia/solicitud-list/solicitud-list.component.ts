import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MiembroIglesiaService } from '../../../../core/services/miembro-iglesia.service';
import { MiembroService } from '../../../../core/services/miembro.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { AuthService } from '../../../../core/services/security/auth.service';
import { MiembroIglesia } from '../../../../core/models/miembro-iglesia.model';
import { Miembro } from '../../../../core/models/miembro.model';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { MiembroIglesiaFormTraspasoComponent } from '../modals/miembro-iglesia-form-traspaso/miembro-iglesia-form.component';
import { MatMenuModule } from '@angular/material/menu';
import { HasPrivilegioDirective } from '../../../../core/directives/has-privilegio.directive';

interface SolicitudExtendida {
  id: number;
  miembroId: number;
  miembroNombre: string;
  miembroCI: string;
  iglesiaOrigenId: number;
  iglesiaOrigenNombre: string;
  iglesiaDestinoId: number;
  iglesiaDestinoNombre: string;
  fechaTraspaso?: Date;
  motivoTraspaso?: string;
  uriCartaTraspaso?: string;
  original: any;
  miembroObj: any;
  iglesiaOrigenObj: any;
}

@Component({
  selector: 'app-solicitud-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatMenuModule,
    HasPrivilegioDirective
  ],
  templateUrl: './solicitud-list.component.html',
  styleUrls: ['./solicitud-list.component.css']
})
export class SolicitudListComponent implements OnInit {
  displayedColumns: string[] = ['miembro', 'ci', 'origen', 'destino', 'fecha', 'motivo', 'documento', 'acciones'];
  dataSource = new MatTableDataSource<SolicitudExtendida>([]);
  loading = true;
  currentIglesiaId: number | null = null;
  currentIglesiaNombre: string | null = null;

  private miembroIglesiaService = inject(MiembroIglesiaService);
  private miembroService = inject(MiembroService);
  private iglesiaService = inject(IglesiaService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  public dialogRef = inject(MatDialogRef<SolicitudListComponent>, { optional: true });

  ngOnInit() {
    this.currentIglesiaId = this.authService.getCurrentIglesiaId();
    this.currentIglesiaNombre = this.authService.getCurrentIglesiaNombre() || 'Todas las Iglesias';
    this.loadSolicitudes();
  }

  loadSolicitudes() {
    const iglesiaId = this.currentIglesiaId || 0;
    this.loading = true;

    this.miembroIglesiaService.getSolicitudesPendientes(iglesiaId).subscribe({
      next: (solicitudResp) => {
        const pendientes = solicitudResp.datos;
        if (pendientes.length === 0) {
          this.dataSource.data = [];
          this.loading = false;
          return;
        }

        this.miembroService.getMiembros().subscribe({
          next: (miembrosResp) => {
            this.iglesiaService.getIglesias().subscribe({
              next: (iglesiasResp) => {
                const extendidas: SolicitudExtendida[] = pendientes.map(p => {
                  const miembro = miembrosResp.datos.find(m => m.id === p.miembroId);
                  const iglesiaOrigen = iglesiasResp.datos.find(i => i.id === p.iglesiaId);
                  const iglesiaDestino = iglesiasResp.datos.find(i => i.id === p.iglesiaDestinoId);
                  return {
                    id: p.id!,
                    miembroId: p.miembroId,
                    miembroNombre: miembro ? `${miembro.nombre} ${miembro.apellido}` : 'Desconocido',
                    miembroCI: miembro ? String(miembro.ci || 'Sin CI') : 'Sin CI',
                    iglesiaOrigenId: p.iglesiaId,
                    iglesiaOrigenNombre: iglesiaOrigen ? iglesiaOrigen.nombre : 'Desconocida',
                    iglesiaDestinoId: p.iglesiaDestinoId!,
                    iglesiaDestinoNombre: iglesiaDestino ? iglesiaDestino.nombre : 'Desconocida',
                    fechaTraspaso: p.fechaTraspaso,
                    motivoTraspaso: p.motivoTraspaso,
                    uriCartaTraspaso: p.uriCartaTraspaso,
                    original: p,
                    miembroObj: miembro,
                    iglesiaOrigenObj: iglesiaOrigen
                  };
                });
                this.dataSource.data = extendidas;
                this.loading = false;
              },
              error: () => this.loading = false
            });
          },
          error: () => this.loading = false
        });
      },
      error: () => this.loading = false
    });
  }

  modificar(solicitud: SolicitudExtendida) {
    const dialogRef = this.dialog.open(MiembroIglesiaFormTraspasoComponent, {
      width: '500px',
      data: {
        miembro: solicitud.miembroObj,
        iglesia: solicitud.iglesiaOrigenObj,
        isEdit: true,
        miembroIglesia: solicitud.original
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Solicitud modificada exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadSolicitudes();
      }
    });
  }

  cancelar(solicitud: SolicitudExtendida) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Cancelar Solicitud',
        message: `¿Está seguro de cancelar la solicitud de traspaso para <strong>${solicitud.miembroNombre}</strong>?`,
        confirmText: 'Cancelar Solicitud',
        cancelText: 'Volver',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.miembroIglesiaService.rechazarTraspaso(solicitud.id).subscribe({
          next: () => {
            this.snackBar.open('Solicitud cancelada exitosamente', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadSolicitudes();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al cancelar la solicitud', 'Cerrar', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  aceptar(solicitud: SolicitudExtendida) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar Aceptación',
        message: `¿Está seguro de aceptar el traspaso de <strong>${solicitud.miembroNombre}</strong> a su iglesia?`,
        confirmText: 'Aceptar Traspaso',
        cancelText: 'Cancelar',
        type: 'info'
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.miembroIglesiaService.aceptarTraspaso(solicitud.id).subscribe({
          next: () => {
            this.snackBar.open('Traspaso aceptado exitosamente', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadSolicitudes();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al aceptar el traspaso', 'Cerrar', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  rechazar(solicitud: SolicitudExtendida) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar Rechazo',
        message: `¿Está seguro de rechazar la solicitud de traspaso para <strong>${solicitud.miembroNombre}</strong>?`,
        confirmText: 'Rechazar',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.miembroIglesiaService.rechazarTraspaso(solicitud.id).subscribe({
          next: () => {
            this.snackBar.open('Solicitud de traspaso rechazada', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadSolicitudes();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al rechazar el traspaso', 'Cerrar', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'No definido';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
