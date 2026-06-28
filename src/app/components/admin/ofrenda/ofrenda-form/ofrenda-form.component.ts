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

import { Ofrenda } from '../../../../core/models/ofrenda.model';
import { OfrendaService } from '../../../../core/services/ofrenda.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { AuthService } from '../../../../core/services/security/auth.service';

@Component({
  selector: 'app-ofrenda-form',
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
  templateUrl: './ofrenda-form.component.html',
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
  `]
})
export class OfrendaFormComponent implements OnInit {
  ofrendaForm!: FormGroup;
  isEditMode: boolean = false;
  iglesias: Iglesia[] = [];
  isAdmin: boolean = false;

  constructor(
    private fb: FormBuilder,
    private ofrendaService: OfrendaService,
    private iglesiaService: IglesiaService,
    private authService: AuthService,
    private dialogRef: MatDialogRef<OfrendaFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'create' | 'edit'; ofrenda?: Ofrenda }
  ) {
    this.isEditMode = data.mode === 'edit';
  }

  ngOnInit() {
    this.checkUserRole();
    this.initForm();
    this.loadIglesias();
  }

  checkUserRole() {
    this.isAdmin = this.authService.isLoggedRolAdmin();
  }

  initForm() {
    const ofrenda = this.data.ofrenda;
    
    let fecha = '';
    if (ofrenda?.fechaRecaudacion) {
      const d = new Date(ofrenda.fechaRecaudacion);
      fecha = d.toISOString().substring(0, 10);
    } else {
      fecha = new Date().toISOString().substring(0, 10);
    }

    this.ofrendaForm = this.fb.group({
      id: [ofrenda?.id || null],
      iglesiaId: [ofrenda?.iglesiaId || null, this.isAdmin ? [Validators.required] : []],
      tipoMovimiento: [ofrenda?.tipoMovimiento || 'INGRESO', [Validators.required]],
      monto: [ofrenda?.monto || '', [Validators.required, Validators.min(0.01)]],
      fechaRecaudacion: [fecha, [Validators.required]],
      conceptoDetalle: [ofrenda?.conceptoDetalle || '', [Validators.maxLength(500)]]
    });
  }

  loadIglesias() {
    if (this.isAdmin) {
      this.iglesiaService.getIglesias().subscribe(res => {
        this.iglesias = Array.isArray(res.datos) ? res.datos : [];
      });
    }
  }

  onSubmit() {
    if (this.ofrendaForm.invalid) return;

    const formVal = this.ofrendaForm.value;
    
    const ofrendaPayload: Ofrenda = {
      ...formVal,
      fechaRecaudacion: new Date(formVal.fechaRecaudacion + 'T00:00:00').toISOString()
    };

    if (this.isEditMode) {
      this.ofrendaService.updateOfrenda(ofrendaPayload).subscribe(res => {
        this.dialogRef.close(true);
      });
    } else {
      this.ofrendaService.createOfrenda(ofrendaPayload).subscribe(res => {
        this.dialogRef.close(true);
      });
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
