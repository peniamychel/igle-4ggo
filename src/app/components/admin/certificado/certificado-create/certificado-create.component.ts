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
import { Evento } from '../../../../core/models/evento.model';
import { TipoCertificado } from '../../../../core/models/tipo-certificado.model';

@Component({
  selector: 'app-certificado-create',
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
  templateUrl: './certificado-create.component.html',
  styleUrls: ['./certificado-create.component.css']
})
export class CertificadoCreateComponent implements OnInit {
  certificadoForm: FormGroup;
  eventos: Evento[] = [];
  tiposCertificado: TipoCertificado[] = [];

  constructor(
    private fb: FormBuilder,
    private certificadoService: CertificadoService,
    private dialogRef: MatDialogRef<CertificadoCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { eventos: Evento[], tiposCertificado: TipoCertificado[] }
  ) {
    this.certificadoForm = this.fb.group({
      eventoId: ['', Validators.required],
      tipoCertificadoId: ['', Validators.required],
      motivoCertificado: ['', [Validators.required, Validators.maxLength(500)]],
      codigoCertificado: ['', [Validators.required, Validators.maxLength(50)]],
    });
  }

  ngOnInit() {
    if (this.data) {
      this.eventos = this.data.eventos.filter(e => e.estado);
      this.tiposCertificado = this.data.tiposCertificado.filter(tc => tc.estado);
    }
  }

  onSubmit() {
    if (this.certificadoForm.valid) {
      const certificadoData = this.certificadoForm.value;
      this.certificadoService.createCertificado(certificadoData).subscribe(() => {
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
