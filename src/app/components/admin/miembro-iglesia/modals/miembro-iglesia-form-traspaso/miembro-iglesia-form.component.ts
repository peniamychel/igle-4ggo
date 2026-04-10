import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MiembroIglesiaService } from '../../../../../core/services/miembro-iglesia.service';
import { IglesiaService } from '../../../../../core/services/iglesia.service';
import { Iglesia } from '../../../../../core/models/iglesia.model';
import { Miembro } from '../../../../../core/models/miembro.model';

@Component({
  selector: 'app-miembro-iglesia-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatSelectModule,
    MatDialogModule,
    MatNativeDateModule
  ],
  templateUrl: './miembro-iglesia-form.component.html',
  styleUrls: ['./miembro-iglesia-form.component.css']
})
export class MiembroIglesiaFormTraspasoComponent {
  form: FormGroup;
  iglesias: Iglesia[] = [];

  constructor(
    private fb: FormBuilder,
    private miembroIglesiaService: MiembroIglesiaService,
    private iglesiaService: IglesiaService,
    private dialogRef: MatDialogRef<MiembroIglesiaFormTraspasoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { miembro: Miembro; iglesia: Iglesia }
  ) {
    this.form = this.fb.group({
      iglesiaId: ['', Validators.required],
      motivoTraspaso: ['', Validators.required],
      fechaTraspaso: ['', Validators.required],
      uriCartaTraspaso: ['', Validators.required]
    });
    this.loadIglesias();
  }

  loadIglesias() {
    this.iglesiaService.getIglesias().subscribe(response => {
      this.iglesias = response.datos.filter(i => i.estado && i.id !== this.data.iglesia.id);
    });
  }

  onSubmit() {
    if (this.form.valid) {
      // Update current membership
      const currentMembership = {
        id: 42,
        miembroId: this.data.miembro.id,
        iglesiaId: this.data.iglesia.id,
        motivoTraspaso: this.form.value.motivoTraspaso,
        fechaTraspaso: this.form.value.fechaTraspaso,
        uriCartaTraspaso: this.form.value.uriCartaTraspaso,
        estado: false
      };

      this.miembroIglesiaService.updateMiembroIglesia(currentMembership).subscribe(() => {
        // Create new membership
        const newMembership = {
          miembroId: this.data.miembro.id,
          iglesiaId: this.form.value.iglesiaId,
          fecha: new Date(),
          estado: true
        };

        this.miembroIglesiaService.createMiembroIglesia(newMembership).subscribe(() => {
          this.dialogRef.close(true);
        });
      });
    }
  }
}
