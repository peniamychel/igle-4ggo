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
import { Evento } from '../../../../core/models/evento.model';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { Iglesia } from '../../../../core/models/iglesia.model';

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
    MatNativeDateModule,
    MatCheckboxModule
  ],
  templateUrl: './evento-edit.component.html',
  styleUrls: ['./evento-edit.component.css']
})
export class EventoEditComponent implements OnInit {
  eventoForm: FormGroup;
  evento: Evento;
  tiposEvento: TipoEvento[] = [];
  iglesias: Iglesia[] = [];

  constructor(
    private fb: FormBuilder,
    private eventoService: EventoService,
    private iglesiaService: IglesiaService,
    private dialogRef: MatDialogRef<EventoEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { evento: Evento, tiposEvento: TipoEvento[] }
  ) {
    this.eventoForm = this.fb.group({
      tipoEventoId: ['', Validators.required],
      nombre: ['', [Validators.required, Validators.maxLength(200)]],
      motivo: ['', [Validators.required, Validators.maxLength(500)]],
      ubicacion: ['', [Validators.required, Validators.maxLength(200)]],
      localidad: ['', [Validators.required, Validators.maxLength(254)]],
      provincia: ['', [Validators.required, Validators.maxLength(254)]],
      departamento: ['', [Validators.required, Validators.maxLength(254)]],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      generaCertificado: [false],
      habilitarInscripciones: [false],
      invitarATodas: [false],
      iglesiasInvitadasIds: [[]]
    });
    this.evento = data.evento;
  }

  // Si el evento ya tiene certificado, la casilla queda marcada y bloqueada (no se puede quitar).
  yaTieneCertificado = false;

  ngOnInit() {
    if (this.data) {
      this.tiposEvento = this.data.tiposEvento;

      this.yaTieneCertificado = !!this.evento.tieneCertificado;

      this.eventoForm.patchValue({
        tipoEventoId: this.evento.tipoEventoId,
        nombre: this.evento.nombre,
        motivo: this.evento.motivo,
        ubicacion: this.evento.ubicacion,
        localidad: this.evento.localidad,
        provincia: this.evento.provincia,
        departamento: this.evento.departamento,
        fechaInicio: this.evento.fechaInicio,
        fechaFin: this.evento.fechaFin,
        generaCertificado: this.yaTieneCertificado,
        habilitarInscripciones: this.evento.habilitarInscripciones || false
      });

      if (this.yaTieneCertificado) {
        this.eventoForm.get('generaCertificado')?.disable();
      }
    }
    this.loadIglesias();
  }

  loadIglesias() {
    this.iglesiaService.getIglesias().subscribe({
      next: (res) => {
        this.iglesias = res.datos.filter(i => i.estado);
        
        // Detectar si todos los IDs están en la lista de invitados
        const inviteIds = this.evento.iglesiasInvitadas
          ? this.evento.iglesiasInvitadas.split(',').filter(x => x.trim() !== '').map(Number)
          : [];
        
        const activeIds = this.iglesias
          .map(i => i.id)
          .filter((id): id is number => id !== undefined);
        const isAllInvited = activeIds.length > 0 && activeIds.every(id => inviteIds.includes(id));

        this.eventoForm.patchValue({
          invitarATodas: isAllInvited,
          iglesiasInvitadasIds: isAllInvited ? [] : inviteIds
        });
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

      const eventoData: Evento = {
        ...this.evento,
        ...formValue,
        iglesiasInvitadas: iglesiasCsv
      };
      
      delete (eventoData as any).iglesiasInvitadasIds;
      delete (eventoData as any).invitarATodas;

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
