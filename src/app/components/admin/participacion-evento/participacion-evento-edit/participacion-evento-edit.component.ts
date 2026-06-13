import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ParticipacionEventoService } from '../../../../core/services/participacion-evento.service';
import { ParticipacionEvento } from '../../../../core/models/participacion-evento.model';
import { Evento } from '../../../../core/models/evento.model';
import { Miembro } from '../../../../core/models/miembro.model';
import { Certificado } from '../../../../core/models/certificado.model';

@Component({
  selector: 'app-participacion-evento-edit',
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
    MatNativeDateModule
  ],
  templateUrl: './participacion-evento-edit.component.html',
  styleUrls: ['./participacion-evento-edit.component.css']
})
export class ParticipacionEventoEditComponent implements OnInit {
  @ViewChild('searchMiembro') searchMiembroInput!: ElementRef;
  participacionForm: FormGroup;
  participacion: ParticipacionEvento;
  eventos: Evento[] = [];
  miembros: Miembro[] = [];
  filteredMiembros: Miembro[] = [];
  certificados: Certificado[] = [];

  constructor(
    private fb: FormBuilder,
    private participacionService: ParticipacionEventoService,
    private dialogRef: MatDialogRef<ParticipacionEventoEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      participacion: ParticipacionEvento,
      eventos: Evento[],
      miembros: Miembro[],
      certificados: Certificado[]
    }
  ) {
    this.participacionForm = this.fb.group({
      miembroId: ['', Validators.required],
      eventoId: ['', Validators.required],
      certificadoId: [null],
      fecha: ['', Validators.required],
    });
    this.participacion = data.participacion;
  }

  ngOnInit() {
    if (this.data) {
      this.eventos = this.data.eventos;
      this.miembros = this.data.miembros;
      this.filteredMiembros = [...this.miembros];
      this.certificados = this.data.certificados;
      this.participacionForm.patchValue({
        miembroId: this.participacion.miembroId,
        eventoId: this.participacion.eventoId,
        certificadoId: this.participacion.certificadoId,
        fecha: this.participacion.fecha,
      });
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

  onSubmit() {
    if (this.participacionForm.valid) {
      const participacionData: ParticipacionEvento = { ...this.participacion, ...this.participacionForm.value };
      this.participacionService.updateParticipacion(participacionData).subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }

  getError(controlName: string): string {
    const control = this.participacionForm.get(controlName);
    if (control?.hasError('required')) return 'Este campo es requerido';
    return '';
  }
}
