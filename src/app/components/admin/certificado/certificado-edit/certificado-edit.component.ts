import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CertificadoService } from '../../../../core/services/certificado.service';
import { Certificado } from '../../../../core/models/certificado.model';
import { Evento } from '../../../../core/models/evento.model';
import { TipoCertificado } from '../../../../core/models/tipo-certificado.model';

@Component({
  selector: 'app-certificado-edit',
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
  ],
  templateUrl: './certificado-edit.component.html',
  styleUrls: ['./certificado-edit.component.css']
})
export class CertificadoEditComponent implements OnInit {
  certificadoForm: FormGroup;
  certificado: Certificado;
  eventos: Evento[] = [];
  tiposCertificado: TipoCertificado[] = [];

  constructor(
    private fb: FormBuilder,
    private certificadoService: CertificadoService,
    private dialogRef: MatDialogRef<CertificadoEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { certificado: Certificado, eventos: Evento[], tiposCertificado: TipoCertificado[] }
  ) {
    this.certificadoForm = this.fb.group({
      eventoId: ['', Validators.required],
      tipoCertificadoId: ['', Validators.required],
      motivoCertificado: ['', [Validators.required, Validators.maxLength(500)]],
    });
    this.certificado = data.certificado;
  }

  ngOnInit() {
    if (this.data) {
      this.eventos = this.data.eventos;
      this.tiposCertificado = this.data.tiposCertificado;
      this.certificadoForm.patchValue({
        eventoId: this.certificado.eventoId,
        tipoCertificadoId: this.certificado.tipoCertificadoId,
        motivoCertificado: this.certificado.motivoCertificado,
      });
    }
  }

  onSubmit() {
    if (this.certificadoForm.valid) {
      const certificadoData: Certificado = { ...this.certificado, ...this.certificadoForm.value };
      this.certificadoService.updateCertificado(certificadoData).subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }

  getError(controlName: string): string {
    const control = this.certificadoForm.get(controlName);
    if (control?.hasError('required')) return 'Este campo es requerido';
    if (control?.hasError('maxlength')) return 'Longitud máxima excedida';
    return '';
  }
}
