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
import { CargoService } from '../../../../core/services/cargo.service';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { TipoCargo } from '../../../../core/models/tipo-cargo.model';
import { Miembro } from '../../../../core/models/miembro.model';
import { Cargo } from '../../../../core/models/cargo.model';

@Component({
  selector: 'app-cargo-create',
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
  templateUrl: './cargo-create.component.html',
  styleUrls: ['./cargo-create.component.css']
})
export class CargoCreateComponent implements OnInit {
  cargoForm: FormGroup;
  iglesias: Iglesia[] = [];
  tiposCargo: TipoCargo[] = [];
  miembros: Miembro[] = [];

  constructor(
    private fb: FormBuilder,
    private cargoService: CargoService,
    private dialogRef: MatDialogRef<CargoCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { iglesias: Iglesia[], tiposCargo: TipoCargo[], miembros: Miembro[] }
  ) {
    this.cargoForm = this.fb.group({
      tipoCargoId: ['', Validators.required],
      iglesiaId: ['', Validators.required],
      idMiembro: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: [''],
      detalle: ['', Validators.maxLength(500)]
    });
  }

  ngOnInit() {
    if (this.data) {
      this.iglesias = this.data.iglesias;
      this.tiposCargo = this.data.tiposCargo.filter(tc => tc.estado); // solo activos? o todos, supongamos todos los disponibles
      this.miembros = this.data.miembros; 
    }
  }

  onSubmit() {
    if (this.cargoForm.valid) {
      const cargoData: Partial<Cargo> = this.cargoForm.value;
      this.cargoService.createCargo(cargoData).subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }

  getError(controlName: string): string {
    const control = this.cargoForm.get(controlName);
    if (control?.hasError('required')) return 'Este campo es requerido';
    if (control?.hasError('maxlength')) return 'Longitud máxima excedida';
    return '';
  }

  getMiembroNombreCompleto(miembro: Miembro): string {
    if (!miembro || !miembro.personaDto) return 'N/A';
    return `${miembro.personaDto.nombre} ${miembro.personaDto.apellido}`;
  }
}
