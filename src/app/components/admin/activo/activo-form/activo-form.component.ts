import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { Activo } from '../../../../core/models/activo.model';
import { ActivoService } from '../../../../core/services/activo.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { AuthService } from '../../../../core/services/security/auth.service';

@Component({
  selector: 'app-activo-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './activo-form.component.html',
  styles: [`
    mat-form-field {
      width: 100%;
      margin-bottom: 12px;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
    .form-row {
      display: flex;
      gap: 12px;
    }
    .form-row mat-form-field {
      flex: 1;
    }
  `]
})
export class ActivoFormComponent implements OnInit {
  activoForm!: FormGroup;
  isEditMode: boolean = false;
  iglesias: Iglesia[] = [];
  isAdmin: boolean = false;

  constructor(
    private fb: FormBuilder,
    private activoService: ActivoService,
    private iglesiaService: IglesiaService,
    private authService: AuthService,
    private dialogRef: MatDialogRef<ActivoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'create' | 'edit'; activo?: Activo }
  ) {
    this.isEditMode = data.mode === 'edit';
  }

  ngOnInit() {
    this.isAdmin = this.authService.isLoggedRolAdmin();
    this.initForm();
    this.loadIglesias();
  }

  initForm() {
    const activo = this.data.activo;
    
    let fecha = '';
    if (activo?.fechaAdquisicion) {
      const d = new Date(activo.fechaAdquisicion);
      fecha = d.toISOString().substring(0, 10);
    } else {
      fecha = new Date().toISOString().substring(0, 10);
    }

    this.activoForm = this.fb.group({
      id: [activo?.id || null],
      nombre: [activo?.nombre || '', [Validators.required, Validators.maxLength(254)]],
      descripcion: [activo?.descripcion || '', [Validators.maxLength(500)]],
      cantidad: [activo?.cantidad || 1, [Validators.required, Validators.min(1)]],
      estadoConservacion: [activo?.estadoConservacion || 'BUENO', [Validators.required]],
      valorEstimado: [activo?.valorEstimado || 0, [Validators.min(0)]],
      fechaAdquisicion: [fecha],
      iglesiaId: [activo?.iglesiaId || null, this.isAdmin ? [Validators.required] : []]
    });
  }

  loadIglesias() {
    if (this.isAdmin) {
      this.iglesiaService.getIglesias().subscribe(res => {
        this.iglesias = Array.isArray(res.datos) ? res.datos.filter(ig => ig.estado) : [];
      });
    }
  }

  onSubmit() {
    if (this.activoForm.invalid) return;

    const formVal = this.activoForm.value;
    const payload: Partial<Activo> = {
      ...formVal,
      fechaAdquisicion: formVal.fechaAdquisicion ? new Date(formVal.fechaAdquisicion + 'T00:00:00') : undefined
    };

    if (!this.isAdmin) {
      // Injected automatically in the session details for pastor/encargado
      payload.iglesiaId = this.authService.getCurrentIglesiaId() || undefined;
    }

    if (this.isEditMode) {
      this.activoService.updateActivo(payload).subscribe(() => {
        this.dialogRef.close(true);
      });
    } else {
      this.activoService.createActivo(payload).subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
