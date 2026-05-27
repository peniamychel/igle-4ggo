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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TipoCertificadoService } from '../../../../core/services/tipo-certificado.service';

@Component({
  selector: 'app-tipo-certificado-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './tipo-certificado-create.component.html',
  styleUrls: ['./tipo-certificado-create.component.css']
})
export class TipoCertificadoCreateComponent {
  tipoCertificadoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private tipoCertificadoService: TipoCertificadoService,
    private dialogRef: MatDialogRef<TipoCertificadoCreateComponent>
  ) {
    this.tipoCertificadoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      fecha: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.tipoCertificadoForm.valid) {
      const tipoCertificadoData = this.tipoCertificadoForm.value;
      this.tipoCertificadoService.createTipoCertificado(tipoCertificadoData).subscribe(() => {
        this.dialogRef.close(tipoCertificadoData);
      });
    }
  }

  getError(controlName: string): string {
    const control = this.tipoCertificadoForm.get(controlName);
    if (control?.hasError('required')) return 'Este campo es requerido';
    if (control?.hasError('maxlength')) return 'Longitud máxima excedida';
    return '';
  }
}
