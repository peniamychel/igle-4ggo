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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { EventoService } from '../../../../core/services/evento.service';
import { TipoEvento } from '../../../../core/models/tipo-evento.model';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { Iglesia } from '../../../../core/models/iglesia.model';

@Component({
  selector: 'app-evento-create',
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
    MatCheckboxModule
  ],
  templateUrl: './evento-create.component.html',
  styleUrls: ['./evento-create.component.css']
})
export class EventoCreateComponent implements OnInit {
  eventoForm: FormGroup;
  tiposEvento: TipoEvento[] = [];
  iglesias: Iglesia[] = [];

  constructor(
    private fb: FormBuilder,
    private eventoService: EventoService,
    private iglesiaService: IglesiaService,
    private dialogRef: MatDialogRef<EventoCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tiposEvento: TipoEvento[] }
  ) {
    this.eventoForm = this.fb.group({
      tipoEventoId: ['', Validators.required],
      nombre: ['', [Validators.required, Validators.maxLength(200)]],
      motivo: ['', [Validators.required, Validators.maxLength(500)]],
      uriFoto: [null],
      ubicacion: ['', [Validators.required, Validators.maxLength(200)]],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      habilitarInscripciones: [false],
      invitarATodas: [false],
      iglesiasInvitadasIds: [[]]
    });
  }

  ngOnInit() {
    if (this.data) {
      this.tiposEvento = this.data.tiposEvento.filter(t => t.estado);
    }
    this.loadIglesias();
  }

  loadIglesias() {
    this.iglesiaService.getIglesias().subscribe({
      next: (res) => {
        this.iglesias = res.datos.filter(i => i.estado);
      },
      error: (err) => console.error('Error al cargar iglesias:', err)
    });
  }

  onSubmit() {
    if (this.eventoForm.valid) {
      const formValue = this.eventoForm.value;
      let iglesiasCsv = '';
      
      if (formValue.habilitarInscripciones) {
        if (formValue.invitarATodas) {
          iglesiasCsv = this.iglesias
            .map(i => i.id)
            .filter((id): id is number => id !== undefined)
            .join(',');
        } else {
          const ids: number[] = formValue.iglesiasInvitadasIds || [];
          iglesiasCsv = ids.join(',');
        }
      }

      const eventoData = {
        ...formValue,
        iglesiasInvitadas: iglesiasCsv
      };
      
      delete eventoData.iglesiasInvitadasIds;
      delete eventoData.invitarATodas;

      this.eventoService.createEvento(eventoData).subscribe(() => {
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
