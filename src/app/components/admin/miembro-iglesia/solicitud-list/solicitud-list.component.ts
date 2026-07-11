import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MiembroIglesiaService } from '../../../../core/services/miembro-iglesia.service';
import { MiembroService } from '../../../../core/services/miembro.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { AuthService } from '../../../../core/services/security/auth.service';
import { EventoService } from '../../../../core/services/evento.service';
import { EventoAceptacionService } from '../../../../core/services/evento-aceptacion.service';
import { EventoParticipantesComponent } from '../../evento/evento-participantes/evento-participantes.component';
import { MiembroIglesia } from '../../../../core/models/miembro-iglesia.model';
import { Miembro } from '../../../../core/models/miembro.model';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { MiembroIglesiaFormTraspasoComponent } from '../modals/miembro-iglesia-form-traspaso/miembro-iglesia-form.component';
import { MatMenuModule } from '@angular/material/menu';
import { HasPrivilegioDirective } from '../../../../core/directives/has-privilegio.directive';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

interface SolicitudExtendida {
  id: number;
  tipo: 'TRASPASO' | 'EVENTO_INVITACION';
  titulo: string;
  mensaje: string;
  fecha: Date | undefined;
  
  // Traspaso
  miembroId?: number;
  miembroNombre?: string;
  miembroCI?: string;
  iglesiaOrigenId?: number;
  iglesiaOrigenNombre?: string;
  iglesiaDestinoId?: number;
  iglesiaDestinoNombre?: string;
  fechaTraspaso?: Date;
  motivoTraspaso?: string;
  uriCartaTraspaso?: string;
  original?: any;
  miembroObj?: any;
  iglesiaOrigenObj?: any;
  
  // Evento
  eventoObj?: any;
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
  displayedColumns: string[] = ['miembro', 'origen', 'fecha', 'motivo', 'documento', 'acciones'];
  dataSource = new MatTableDataSource<SolicitudExtendida>([]);
  loading = true;
  currentIglesiaId: number | null = null;
  currentIglesiaNombre: string | null = null;

  private miembroIglesiaService = inject(MiembroIglesiaService);
  private miembroService = inject(MiembroService);
  private iglesiaService = inject(IglesiaService);
  private authService = inject(AuthService);
  private eventoService = inject(EventoService);
  private eventoAceptacionService = inject(EventoAceptacionService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  public dialogRef = inject(MatDialogRef<SolicitudListComponent>, { optional: true });
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  ngOnInit() {
    this.currentIglesiaId = this.authService.getCurrentIglesiaId();
    this.currentIglesiaNombre = this.authService.getCurrentIglesiaNombre() || 'Todas las Iglesias';
    this.loadSolicitudes();

    // Si se abre como modal/popover, asignamos columnas unificadas
    if (this.dialogRef) {
      this.displayedColumns = ['miembro', 'origen', 'fecha'];
    }

    // Recargar datos en tiempo real al gatillarse el evento
    this.miembroIglesiaService.solicitudesChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadSolicitudes();
      });
  }

  goToSolicitudes() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
    this.router.navigate(['/cambios-iglesia']);
  }

  onRowClick(row: SolicitudExtendida) {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
    
    if (row.tipo === 'EVENTO_INVITACION') {
      // Abrir modal de participantes del evento
      this.dialog.open(EventoParticipantesComponent, {
        width: '800px',
        maxWidth: '95vw',
        panelClass: 'dialog-fullscreen-mobile',
        data: row.eventoObj
      });
    } else {
      // Redirigir a cambios iglesia con el ID seleccionado
      this.router.navigate(['/cambios-iglesia'], { queryParams: { selectId: row.id } });
    }
  }

  loadSolicitudes() {
    const iglesiaId = this.currentIglesiaId || 0;
    this.loading = true;

    // Ejecutar consultas de traspasos, eventos, miembros e iglesias en paralelo, junto con decisiones de eventos
    forkJoin({
      traspasos: this.miembroIglesiaService.getSolicitudesPendientes(iglesiaId),
      eventos: this.eventoService.getEventos(),
      miembros: this.miembroService.getMiembros(),
      iglesias: this.iglesiaService.getIglesias(),
      decisiones: this.eventoAceptacionService.getDecisionesPorIglesia(iglesiaId)
    }).subscribe({
      next: (res) => {
        const pendientes = res.traspasos.datos || [];
        const todosEventos = res.eventos.datos || [];
        const listaMiembros = res.miembros.datos || [];
        const listaIglesias = res.iglesias.datos || [];
        const listaDecisiones = res.decisiones.datos || [];

        // 1. Mapear Solicitudes de Traspaso
        const traspasosExtendidos: SolicitudExtendida[] = pendientes.map(p => {
          const miembro = listaMiembros.find(m => m.id === p.miembroId);
          const iglesiaOrigen = listaIglesias.find(i => i.id === p.iglesiaId);
          const iglesiaDestino = listaIglesias.find(i => i.id === p.iglesiaDestinoId);
          
          let rawFecha = p.fechaTraspaso || p.createdAt;
          let parsedFecha = rawFecha ? new Date(rawFecha) : undefined;

          return {
            id: p.id!,
            tipo: 'TRASPASO',
            titulo: miembro ? `${miembro.nombre} ${miembro.apellido}` : 'Desconocido',
            mensaje: iglesiaDestino ? iglesiaDestino.nombre : 'Desconocida',
            fecha: parsedFecha,
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

        // 2. Mapear Invitaciones a Eventos para la Iglesia Activa (filtrando las ya aceptadas o archivadas)
        const eventosInvitados: SolicitudExtendida[] = [];
        
        if (this.currentIglesiaId) {
          todosEventos.forEach(evt => {
            const isHabilitado = evt.habilitarInscripciones === true;
            const iglesiasInvitadasCsv = evt.iglesiasInvitadas || '';
            const idsInvitados = iglesiasInvitadasCsv.split(',').filter(x => x.trim() !== '').map(Number);
            
            // Buscar si ya tiene una decisión de aceptación o archivo
            const yaDecidido = listaDecisiones.some(d => d.eventoId === evt.id);

            // Si el evento está habilitado, la iglesia está invitada y aún no se ha decidido
            if (isHabilitado && idsInvitados.includes(this.currentIglesiaId!) && !yaDecidido) {
              eventosInvitados.push({
                id: evt.id!,
                tipo: 'EVENTO_INVITACION',
                titulo: evt.nombre,
                mensaje: evt.ubicacion,
                fecha: evt.fechaInicio ? new Date(evt.fechaInicio) : undefined,
                eventoObj: evt
              });
            }
          });
        }

        // 3. Combinar y Ordenar por fecha descendente
        const combinadas = [...traspasosExtendidos, ...eventosInvitados];
        combinadas.sort((a, b) => {
          const timeA = a.fecha ? a.fecha.getTime() : 0;
          const timeB = b.fecha ? b.fecha.getTime() : 0;
          return timeB - timeA;
        });

        this.dataSource.data = combinadas;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar notificaciones unificadas:', err);
        this.loading = false;
      }
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

  aceptarInvitacion(row: SolicitudExtendida) {
    if (!this.currentIglesiaId || !row.id) return;
    this.eventoAceptacionService.decidir({
      eventoId: row.id,
      iglesiaId: this.currentIglesiaId,
      estado: 'ACEPTADO'
    }).subscribe({
      next: () => {
        this.snackBar.open('Invitación aceptada. El evento se ha añadido a su Gestión de Eventos.', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        // Notificar cambios para actualizar campana y badge superior
        this.miembroIglesiaService.notifySolicitudesChanged();

        // Cerrar el popover actual
        if (this.dialogRef) {
          this.dialogRef.close();
        }

        // Abrir inmediatamente el diálogo de participantes/asistencia al evento
        this.dialog.open(EventoParticipantesComponent, {
          width: '800px',
          maxWidth: '95vw',
          panelClass: 'dialog-fullscreen-mobile',
          data: row.eventoObj
        });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Error al aceptar invitación', 'Cerrar', { duration: 3000 });
      }
    });
  }

  archivarInvitacion(row: SolicitudExtendida) {
    if (!this.currentIglesiaId || !row.id) return;
    this.eventoAceptacionService.decidir({
      eventoId: row.id,
      iglesiaId: this.currentIglesiaId,
      estado: 'ARCHIVADO'
    }).subscribe({
      next: () => {
        this.snackBar.open('Invitación archivada. Puede verla en Configuración -> Historial.', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        // Notificar cambios para actualizar campana y badge superior
        this.miembroIglesiaService.notifySolicitudesChanged();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Error al archivar invitación', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
