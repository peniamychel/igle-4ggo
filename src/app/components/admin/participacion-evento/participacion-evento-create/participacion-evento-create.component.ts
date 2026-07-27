import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { MiembroCreateComponent } from '../../miembro/miembro-create/miembro-create.component';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ParticipacionEventoService } from '../../../../core/services/participacion-evento.service';
import { Evento } from '../../../../core/models/evento.model';
import { Miembro } from '../../../../core/models/miembro.model';
import { Certificado } from '../../../../core/models/certificado.model';

@Component({
  selector: 'app-participacion-evento-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule
  ],
  templateUrl: './participacion-evento-create.component.html',
  styleUrls: ['./participacion-evento-create.component.css']
})
export class ParticipacionEventoCreateComponent implements OnInit {
  @ViewChild('searchMiembro') searchMiembroInput!: ElementRef;
  @ViewChild('miembroSelect') miembroSelect!: MatSelect;
  participacionForm: FormGroup;
  eventos: Evento[] = [];
  miembros: Miembro[] = [];
  filteredMiembros: Miembro[] = [];
  certificados: Certificado[] = [];
  filteredCertificados: Certificado[] = [];

  constructor(
    private fb: FormBuilder,
    private participacionService: ParticipacionEventoService,
    private dialogRef: MatDialogRef<ParticipacionEventoCreateComponent>,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { eventos: Evento[], miembros: Miembro[], certificados: Certificado[] }
  ) {
    this.participacionForm = this.fb.group({
      miembroId: ['', Validators.required],
      eventoId: ['', Validators.required],
      certificadoId: [null],
      fecha: ['', Validators.required],
    });
  }

  ngOnInit() {
    if (this.data) {
      this.eventos = this.data.eventos.filter(e => e.estado);
      this.miembros = this.data.miembros;
      this.filteredMiembros = [...this.miembros];
      this.certificados = this.data.certificados.filter(c => c.estado);

      this.participacionForm.get('eventoId')?.valueChanges.subscribe(eventoId => {
        this.updateFilteredCertificados(eventoId);
      });
    }
  }

  updateFilteredCertificados(eventoId: number) {
    if (eventoId) {
      this.filteredCertificados = this.certificados.filter(c => c.eventoId === eventoId);
    } else {
      this.filteredCertificados = [];
    }

    const currentCertId = this.participacionForm.get('certificadoId')?.value;
    if (currentCertId && !this.filteredCertificados.some(c => c.id === currentCertId)) {
      this.participacionForm.get('certificadoId')?.setValue(null);
    }
  }

  filterMiembros(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredMiembros = this.miembros.filter(miembro => {
      const nombreCompleto = this.getMiembroNombreCompleto(miembro).toLowerCase();
      const ci = (miembro.ci?.toString() || '').toLowerCase();
      return nombreCompleto.includes(filterValue) || ci.includes(filterValue);
    });
  }

  onMiembroSelectOpen(isOpen: boolean) {
    if (isOpen) {
      setTimeout(() => {
        if (this.searchMiembroInput) {
          this.searchMiembroInput.nativeElement.focus();
        }
      }, 0);
    }
  }

  getMiembroNombreCompleto(miembro: Miembro): string {
    if (!miembro) return 'N/A';
    return `${miembro.nombre} ${miembro.apellido}`;
  }

  /**
   * Si el miembro no existe, se registra uno nuevo desde aquí (modal de creación).
   * Al cerrarse con éxito, el miembro creado se agrega a la lista y queda seleccionado.
   */
  crearNuevoMiembro(): void {
    this.miembroSelect?.close();

    const ref = this.dialog.open(MiembroCreateComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile'
    });

    ref.afterClosed().subscribe((creado: any) => {
      if (!creado) return;

      // El diálogo devuelve el miembro creado (con id). Si por algún motivo no
      // llegara el objeto, no se puede preseleccionar: se avisa al usuario.
      if (creado === true || creado.id == null) {
        this.snackBar.open('Miembro creado. Búsquelo en la lista para seleccionarlo.', 'Cerrar', { duration: 4000 });
        return;
      }

      const nuevo: Miembro = creado as Miembro;
      this.miembros = [nuevo, ...this.miembros];
      this.filteredMiembros = [...this.miembros];
      this.participacionForm.get('miembroId')?.setValue(nuevo.id);
      this.snackBar.open(
        `Miembro "${this.getMiembroNombreCompleto(nuevo)}" creado y seleccionado.`,
        'Cerrar',
        { duration: 3000 }
      );
    });
  }

  onSubmit() {
    if (this.participacionForm.valid) {
      const participacionData = this.participacionForm.value;
      this.participacionService.createParticipacion(participacionData).subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error al registrar participacion:', err);
          const errorMsg = err.error?.message || 'Error al guardar la participación. Si el problema persiste, por favor contacte con soporte técnico.';
          this.snackBar.open(errorMsg, 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  getError(controlName: string): string {
    const control = this.participacionForm.get(controlName);
    if (control?.hasError('required')) return 'Este campo es requerido';
    return '';
  }
}
