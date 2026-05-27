import { Component, Inject, OnInit } from '@angular/core';
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
import { EventoService } from '../../../../core/services/evento.service';
import { TipoEvento } from '../../../../core/models/tipo-evento.model';
import { Evento } from '../../../../core/models/evento.model';

@Component({
  selector: 'app-evento-edit',
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
  templateUrl: './evento-edit.component.html',
  styleUrls: ['./evento-edit.component.css']
})
export class EventoEditComponent implements OnInit {
  eventoForm: FormGroup;
  evento: Evento;
  tiposEvento: TipoEvento[] = [];

  constructor(
    private fb: FormBuilder,
    private eventoService: EventoService,
    private dialogRef: MatDialogRef<EventoEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { evento: Evento, tiposEvento: TipoEvento[] }
  ) {
    this.eventoForm = this.fb.group({
      tipoEventoId: ['', Validators.required],
      nombre: ['', [Validators.required, Validators.maxLength(200)]],
      motivo: ['', [Validators.required, Validators.maxLength(500)]],
      uriFoto: [null],
      ubicacion: ['', [Validators.required, Validators.maxLength(200)]],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
    });
    this.evento = data.evento;
  }

  ngOnInit() {
    if (this.data) {
      this.tiposEvento = this.data.tiposEvento;
      this.eventoForm.patchValue({
        tipoEventoId: this.evento.tipoEventoId,
        nombre: this.evento.nombre,
        motivo: this.evento.motivo,
        uriFoto: this.evento.uriFoto,
        ubicacion: this.evento.ubicacion,
        fechaInicio: this.evento.fechaInicio,
        fechaFin: this.evento.fechaFin,
      });
    }
  }

  onSubmit() {
    if (this.eventoForm.valid) {
      const eventoData: Evento = { ...this.evento, ...this.eventoForm.value };
      this.eventoService.updateEvento(eventoData).subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }

  getError(controlName: string): string {
    const control = this.eventoForm.get(controlName);
    if (control?.hasError('required')) return 'Este campo es requerido';
    if (control?.hasError('maxlength')) return 'Longitud máxima excedida';
    return '';
  }
}
