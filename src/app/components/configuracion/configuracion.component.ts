import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuditTrailComponent } from './audit-trail/audit-trail.component';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/security/auth.service';
import { IglesiaService } from '../../core/services/iglesia.service';
import { EventoService } from '../../core/services/evento.service';
import { EventoAceptacionService } from '../../core/services/evento-aceptacion.service';
import { MiembroIglesiaService } from '../../core/services/miembro-iglesia.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IglesiaEditComponent } from '../admin/iglesia/iglesia-edit/iglesia-edit.component';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    AuditTrailComponent,
    ImageUrlPipe
  ],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.css']
})
export class ConfiguracionComponent implements OnInit {
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private iglesiaService = inject(IglesiaService);
  private eventoService = inject(EventoService);
  private eventoAceptacionService = inject(EventoAceptacionService);
  private miembroIglesiaService = inject(MiembroIglesiaService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  isDarkMode = this.themeService.isDarkMode;
  selectedTabIndex = 2; // Pestaña de Bitácora activa por defecto

  isPastor = false;
  canViewBitacora = false;
  iglesiaPastor: any = null;
  loadingIglesia = false;

  historialNotificaciones: any[] = [];
  loadingHistorial = false;

  ngOnInit() {
    const role = localStorage.getItem('role');
    this.isPastor = role === 'ROLE_PASTOR' || role === 'ROLE_ENCARGADO_IGLESIA';
    this.canViewBitacora = role === 'ROLE_ADMIN' || role === 'ROLE_PASTOR';
    
    if (this.isPastor) {
      this.selectedTabIndex = 0; // Default to 'Mi Iglesia'
      this.loadPastorChurch();
    } else if (this.canViewBitacora) {
      this.selectedTabIndex = 2; // Default to 'Bitácora' for Admin (since Mi Iglesia is hidden)
    } else {
      this.selectedTabIndex = 0; // Default to 'General' for Tesorero/other roles
    }
    
    this.loadNotificationHistory();
  }

  loadPastorChurch() {
    const iglesiaId = this.authService.getCurrentIglesiaId();
    if (iglesiaId) {
      this.loadingIglesia = true;
      this.iglesiaService.getIglesiaById(iglesiaId).subscribe({
        next: (res) => {
          this.iglesiaPastor = res.datos;
          this.loadingIglesia = false;
        },
        error: (err) => {
          console.error('Error loading pastor church details', err);
          this.loadingIglesia = false;
        }
      });
    }
  }

  openEditPastorChurch() {
    if (!this.iglesiaPastor) return;

    const dialogRef = this.dialog.open(IglesiaEditComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: this.iglesiaPastor
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPastorChurch();
        this.snackBar.open(`Datos de iglesia actualizados exitosamente`, 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  setTheme(dark: boolean): void {
    this.themeService.setTheme(dark);
  }

  loadNotificationHistory() {
    const iglesiaId = this.authService.getCurrentIglesiaId();
    if (!iglesiaId) return;

    this.loadingHistorial = true;
    forkJoin({
      decisiones: this.eventoAceptacionService.getDecisionesPorIglesia(iglesiaId),
      eventos: this.eventoService.getEventos()
    }).subscribe({
      next: (res) => {
        const listaDecisiones = res.decisiones.datos || [];
        const listaEventos = res.eventos.datos || [];

        this.historialNotificaciones = listaDecisiones.map(dec => {
          const evento = listaEventos.find(e => e.id === dec.eventoId);
          return {
            id: dec.id,
            eventoId: dec.eventoId,
            nombreEvento: evento ? evento.nombre : `Evento #${dec.eventoId}`,
            ubicacion: evento ? evento.ubicacion : '',
            fechaInicio: evento ? evento.fechaInicio : null,
            estado: dec.estado, // ACEPTADO, ARCHIVADO
            fechaDecision: dec.updatedAt,
            eventoObj: evento
          };
        });

        // Ordenar de más reciente a más antiguo
        this.historialNotificaciones.sort((a, b) => {
          const dateA = a.fechaDecision ? new Date(a.fechaDecision).getTime() : 0;
          const dateB = b.fechaDecision ? new Date(b.fechaDecision).getTime() : 0;
          return dateB - dateA;
        });

        this.loadingHistorial = false;
      },
      error: (err) => {
        console.error('Error al cargar historial de notificaciones:', err);
        this.loadingHistorial = false;
      }
    });
  }

  cambiarEstadoDecision(row: any, nuevoEstado: 'ACEPTADO' | 'ARCHIVADO') {
    const iglesiaId = this.authService.getCurrentIglesiaId();
    if (!iglesiaId) return;

    this.eventoAceptacionService.decidir({
      eventoId: row.eventoId,
      iglesiaId: iglesiaId,
      estado: nuevoEstado
    }).subscribe({
      next: () => {
        const estadoTexto = nuevoEstado === 'ACEPTADO' ? 'Aceptada (agregada a Gestión de Eventos)' : 'Archivada';
        this.snackBar.open(`Invitación marcada como ${estadoTexto}.`, 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadNotificationHistory();
        // Notificar cambios para recargar el conteo de la campana
        this.miembroIglesiaService.notifySolicitudesChanged();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Error al actualizar decisión', 'Cerrar', { duration: 3000 });
      }
    });
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return 'No definido';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
