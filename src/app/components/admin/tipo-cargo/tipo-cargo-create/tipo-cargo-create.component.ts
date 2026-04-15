import { Component } from '@angular/core';
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
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TipoCargoService } from '../../../../core/services/tipo-cargo.service';

@Component({
  selector: 'app-tipo-cargo-create',
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
  templateUrl: './tipo-cargo-create.component.html',
  styleUrls: ['./tipo-cargo-create.component.css']
})
export class TipoCargoCreateComponent {
  tipoCargoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private tipoCargoService: TipoCargoService,
    private dialogRef: MatDialogRef<TipoCargoCreateComponent>
  ) {
    this.tipoCargoForm = this.fb.group({
      tipo: ['', [Validators.required, Validators.maxLength(50)]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
    });
  }

  onSubmit() {
    if (this.tipoCargoForm.valid) {
      const tipoCargoData = this.tipoCargoForm.value;
      this.tipoCargoService.createTipoCargo(tipoCargoData).subscribe(() => {
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
