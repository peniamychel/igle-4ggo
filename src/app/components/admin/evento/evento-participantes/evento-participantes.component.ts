import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { Evento } from '../../../../core/models/evento.model';
import { ParticipacionEvento } from '../../../../core/models/participacion-evento.model';
import { Miembro } from '../../../../core/models/miembro.model';
import { ParticipacionEventoService } from '../../../../core/services/participacion-evento.service';
import { MiembroIglesiaService } from '../../../../core/services/miembro-iglesia.service';
import { MiembroService } from '../../../../core/services/miembro.service';
import { AuthService } from '../../../../core/services/security/auth.service';
import { ResponsableEventoService } from '../../../../core/services/responsable-evento.service';
import { CargoService } from '../../../../core/services/cargo.service';
import { TipoCargoService } from '../../../../core/services/tipo-cargo.service';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { MiembroCreateComponent } from '../../miembro/miembro-create/miembro-create.component';

@Component({
  selector: 'app-evento-participantes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatSnackBarModule,
    MatTooltipModule,
    ImageUrlPipe,
    ConfirmDialogComponent
  ],
  templateUrl: './evento-participantes.component.html',
  styleUrls: ['./evento-participantes.component.css']
})
export class EventoParticipantesComponent implements OnInit {
  @ViewChild('miembroSelect') miembroSelect!: MatSelect;
  evento: Evento;
  participantes: ParticipacionEvento[] = [];
  miembros: Miembro[] = [];
  availableMiembros: Miembro[] = [];
  filteredMiembros: Miembro[] = [];
  searchQuery: string = '';
  selectedMiembroId: number | null = null;
  responsablesText = '';
  
  dataSource = new MatTableDataSource<ParticipacionEvento>([]);
  displayedColumns: string[] = ['miembro', 'contacto', 'acciones'];
  
  loading = false;
  isAdmin = false;

  constructor(
    private dialogRef: MatDialogRef<EventoParticipantesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Evento,
    private dialog: MatDialog,
    private participacionService: ParticipacionEventoService,
    private miembroIglesiaService: MiembroIglesiaService,
    private miembroService: MiembroService,
    private authService: AuthService,
    private responsableService: ResponsableEventoService,
    private cargoService: CargoService,
    private tipoCargoService: TipoCargoService,
    private snackBar: MatSnackBar
  ) {
    this.evento = data;
  }

  ngOnInit() {
    this.isAdmin = this.authService.isLoggedRolAdmin();
    this.loadParticipantes();
    this.loadMiembros();
    this.loadResponsablesInfo();
  }

  loadParticipantes() {
    this.loading = true;
    this.participacionService.getParticipaciones().subscribe({
      next: (res) => {
        if (res && res.datos) {
          this.participantes = res.datos.filter(p => p.eventoId === this.evento.id);
          this.mapMiembrosToParticipantes();
          this.filterAvailableMiembros();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar participantes:', err);
        this.messageSnackBar('Error al cargar la lista de participantes', 'error');
        this.loading = false;
      }
    });
  }

  loadMiembros() {
    if (this.isAdmin && this.evento.iglesiaId) {
      this.miembroIglesiaService.getMiembrosPorIglesia(this.evento.iglesiaId).subscribe({
        next: (res) => {
          this.miembros = res.datos || [];
          this.mapMiembrosToParticipantes();
          this.filterAvailableMiembros();
        }
      });
    } else if (!this.isAdmin) {
      this.miembroIglesiaService.getMisMiembros().subscribe({
        next: (res) => {
          this.miembros = res.datos || [];
          this.mapMiembrosToParticipantes();
          this.filterAvailableMiembros();
        }
      });
    } else {
      this.miembroService.getMiembros().subscribe({
        next: (res) => {
          this.miembros = res.datos || [];
          this.mapMiembrosToParticipantes();
          this.filterAvailableMiembros();
        }
      });
    }
  }

  mapMiembrosToParticipantes() {
    if (this.participantes.length && this.miembros.length) {
      this.participantes.forEach(p => {
        const found = this.miembros.find(m => m.id === p.miembroId);
        if (found) {
          p.miembroDto = found;
        }
      });
    }

    // Asegurar que las fotos de TODOS los participantes tengan el prefijo correcto de miembros si es necesario
    this.participantes.forEach(p => {
      if (p.miembroDto && p.miembroDto.uriFoto) {
        const foto = p.miembroDto.uriFoto;
        if (!foto.startsWith('http') && !foto.startsWith('/') && !foto.startsWith('miembros/')) {
          p.miembroDto.uriFoto = 'miembros/' + foto;
        }
      }
    });

    this.dataSource.data = [...this.participantes];
  }

  /**
   * Si el miembro no existe, se registra uno nuevo sin salir de esta ventana.
   * Al crearse queda agregado a la lista y seleccionado, listo para "Agregar".
   */
  crearNuevoMiembro() {
    this.miembroSelect?.close();

    const ref = this.dialog.open(MiembroCreateComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile'
    });

    ref.afterClosed().subscribe((creado: any) => {
      if (!creado) return;

      // El diálogo devuelve el miembro creado (con id). Si no llegara el objeto,
      // se recarga la lista para que al menos aparezca disponible.
      if (creado === true || creado.id == null) {
        this.loadMiembros();
        this.messageSnackBar('Miembro creado. Selecciónelo en la lista.', 'success');
        return;
      }

      const nuevo = creado as Miembro;
      this.miembros = [nuevo, ...this.miembros];
      this.searchQuery = '';
      this.filterAvailableMiembros();
      this.selectedMiembroId = nuevo.id ?? null;
      this.messageSnackBar(`Miembro "${nuevo.nombre} ${nuevo.apellido}" creado y seleccionado.`, 'success');
    });
  }

  filterAvailableMiembros() {
    if (!this.miembros.length) {
      this.availableMiembros = [];
      this.filteredMiembros = [];
      return;
    }
    this.availableMiembros = this.miembros.filter(
      m => !this.participantes.some(p => p.miembroId === m.id)
    );
    this.applySearchFilter();
  }

  onSearchInput(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.applySearchFilter();
  }

  applySearchFilter() {
    if (!this.searchQuery.trim()) {
      this.filteredMiembros = [...this.availableMiembros];
      return;
    }
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredMiembros = this.availableMiembros.filter(m => 
      (m.nombre + ' ' + m.apellido).toLowerCase().includes(query) ||
      String(m.ci || '').toLowerCase().includes(query)
    );
  }

  onSelectOpened(opened: boolean) {
    if (opened) {
      setTimeout(() => {
        const input = document.querySelector('.select-search-input') as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }, 100);
    } else {
      this.searchQuery = '';
      const input = document.querySelector('.select-search-input') as HTMLInputElement;
      if (input) {
        input.value = '';
      }
      this.applySearchFilter();
    }
  }

  addParticipant() {
    if (!this.selectedMiembroId) return;

    const newPart: ParticipacionEvento = {
      eventoId: this.evento.id!,
      miembroId: this.selectedMiembroId,
      certificadoId: null,
      fecha: new Date().toISOString()
    };

    this.participacionService.createParticipacion(newPart).subscribe({
      next: () => {
        this.messageSnackBar('Participante agregado exitosamente.');
        this.selectedMiembroId = null;
        this.loadParticipantes();
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Error al agregar participante.';
        this.messageSnackBar(errorMsg, 'error');
      }
    });
  }

  deleteParticipant(participacion: ParticipacionEvento) {
    if (!participacion.id) return;

    const nombreCompleto = participacion.miembroDto
      ? `${participacion.miembroDto.nombre} ${participacion.miembroDto.apellido}`
      : 'este participante';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '¿Quitar participante?',
        message: `¿Está seguro que desea quitar a <strong>${nombreCompleto}</strong> de este evento?`,
        confirmText: 'Quitar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && participacion.id) {
        this.participacionService.deleteParticipacion(participacion.id).subscribe({
          next: () => {
            this.messageSnackBar('Participante eliminado del evento.');
            this.loadParticipantes();
          },
          error: (err) => {
            console.error('Error al eliminar participante:', err);
            this.messageSnackBar('Error al eliminar participante.', 'error');
          }
        });
      }
    });
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const placeholder = img.nextElementSibling as HTMLElement;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

  loadResponsablesInfo() {
    if (!this.evento.id) {
      this.responsablesText = 'No designados';
      return;
    }
    this.responsableService.getResponsablesPorEvento(this.evento.id).subscribe({
      next: (res) => {
        const list = (res.datos || [])
          .map(r => {
            if (r.nombreCompleto) {
              const cargoTitle = r.nombreCargo ? ` (${r.nombreCargo})` : '';
              return `${r.nombreCompleto}${cargoTitle}`;
            }
            return '';
          })
          .filter(name => name !== '');

        if (list.length > 0) {
          this.responsablesText = list.join(', ');
        } else {
          this.responsablesText = 'No designados';
        }
      },
      error: (err) => {
        console.error('Error al cargar responsables de evento:', err);
        this.responsablesText = 'No designados';
      }
    });
  }

  messageSnackBar(message: string, type: 'success' | 'warning' | 'error' = 'success') {
    const panelClass = type === 'success' ? 'success-snackbar' : type === 'warning' ? 'warning-snackbar' : 'error-snackbar';
    this.snackBar.open(
      message, 'Cerrar', { duration: 3000, panelClass: [panelClass] }
    );
  }
}