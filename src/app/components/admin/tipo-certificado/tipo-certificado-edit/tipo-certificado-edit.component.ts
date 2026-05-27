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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TipoCertificadoService } from '../../../../core/services/tipo-certificado.service';
import { TipoCertificado } from '../../../../core/models/tipo-certificado.model';

@Component({
  selector: 'app-tipo-certificado-edit',
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
  templateUrl: './tipo-certificado-edit.component.html',
  styleUrls: ['./tipo-certificado-edit.component.css']
})
export class TipoCertificadoEditComponent implements OnInit {
  tipoCertificadoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private tipoCertificadoService: TipoCertificadoService,
    private dialogRef: MatDialogRef<TipoCertificadoEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TipoCertificado
  ) {
    this.tipoCertificadoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      fecha: ['', Validators.required],
    });
  }

  ngOnInit() {
    if (this.data) {
      this.tipoCertificadoForm.patchValue(this.data);
    }
  }

  onSubmit() {
    if (this.tipoCertificadoForm.valid) {
      const tipoCertificadoData: TipoCertificado = { ...this.data, ...this.tipoCertificadoForm.value };
      this.tipoCertificadoService.updateTipoCertificado(tipoCertificadoData).subscribe(() => {
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
