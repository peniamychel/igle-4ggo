import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TipoCargoService } from '../../../../core/services/tipo-cargo.service';
import { TipoCargo } from '../../../../core/models/tipo-cargo.model';

@Component({
  selector: 'app-tipo-cargo-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
  ],
  templateUrl: './tipo-cargo-edit.component.html',
  styleUrls: ['./tipo-cargo-edit.component.css']
})
export class TipoCargoEditComponent implements OnInit {
  tipoCargoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private tipoCargoService: TipoCargoService,
    private dialogRef: MatDialogRef<TipoCargoEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TipoCargo
  ) {
    this.tipoCargoForm = this.fb.group({
      tipo: ['', [Validators.required, Validators.maxLength(50)]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
    });
  }

  ngOnInit() {
    if (this.data) {
      this.tipoCargoForm.patchValue(this.data);
    }
  }

  onSubmit() {
    if (this.tipoCargoForm.valid) {
      const tipoCargoData: TipoCargo = { ...this.data, ...this.tipoCargoForm.value };
      this.tipoCargoService.updateTipoCargo(tipoCargoData).subscribe(() => {
        this.dialogRef.close(tipoCargoData);
      });
    }
  }

  getError(controlName: string): string {
    const control = this.tipoCargoForm.get(controlName);
    if (control?.hasError('required')) return 'Este campo es requerido';
    if (control?.hasError('maxlength')) return 'Longitud máxima excedida';
    return '';
  }
}
