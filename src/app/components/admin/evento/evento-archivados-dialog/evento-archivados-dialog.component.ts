import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EventoService } from '../../../../core/services/evento.service';
import { Evento } from '../../../../core/models/evento.model';
import { TipoEvento } from '../../../../core/models/tipo-evento.model';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { HasPrivilegioDirective } from '../../../../core/directives/has-privilegio.directive';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-evento-archivados-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    HasPrivilegioDirective,
    LoadingSpinnerComponent
  ],
  templateUrl: './evento-archivados-dialog.component.html',
  styleUrls: ['./evento-archivados-dialog.component.css']
})
export class EventoArchivadosDialogComponent implements OnInit {
  eventos: Evento[] = [];
  isLoading = true;
  private tiposMap = new Map<number, TipoEvento>();
  private iglesiasMap = new Map<number, Iglesia>();

  constructor(
    private eventoService: EventoService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { tiposEvento: TipoEvento[]; iglesias: Iglesia[]; isAdmin: boolean }
  ) {
    (data?.tiposEvento || []).forEach(t => { if (t.id !== undefined) this.tiposMap.set(t.id, t); });
    (data?.iglesias || []).forEach(i => { if (i.id !== undefined) this.iglesiasMap.set(i.id, i); });
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.isLoading = true;
    this.eventoService.getEventosArchivados().pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (res) => {
        const eventos = Array.isArray(res.datos) ? res.datos : [];
        eventos.sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA;
        });
        this.eventos = eventos;
      },
      error: () => {
        this.snackBar.open('Error al cargar los eventos archivados.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  getTipoNombre(id?: number): string {
    if (id === undefined) return 'N/A';
    return this.tiposMap.get(id)?.nombre || 'N/A';
  }

  getIglesiaNombre(id?: number): string {
    if (!id) return 'General';
    return this.iglesiasMap.get(id)?.nombre || `Iglesia #${id}`;
  }

  desarchivar(evento: Evento) {
    if (!evento.id) return;
    this.eventoService.desarchivar(evento.id).subscribe({
      next: () => {
        this.eventos = this.eventos.filter(e => e.id !== evento.id);
        this.snackBar.open(`Evento '${evento.nombre}' desarchivado.`, 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (err) => {
        const msg = err.error?.message || 'Error al desarchivar el evento.';
        this.snackBar.open(msg, 'Cerrar', { duration: 3000, panelClass: ['error-snackbar'] });
      }
    });
  }
}
