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
import { TipoEventoService } from '../../../../core/services/tipo-evento.service';
import { TipoEvento } from '../../../../core/models/tipo-evento.model';

@Component({
  selector: 'app-tipo-evento-edit',
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
  templateUrl: './tipo-evento-edit.component.html',
  styleUrls: ['./tipo-evento-edit.component.css']
})
export class TipoEventoEditComponent implements OnInit {
  tipoEventoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private tipoEventoService: TipoEventoService,
    private dialogRef: MatDialogRef<TipoEventoEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TipoEvento
  ) {
    this.tipoEventoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
    });
  }

  ngOnInit() {
    if (this.data) {
      this.tipoEventoForm.patchValue(this.data);
    }
  }

  onSubmit() {
    if (this.tipoEventoForm.valid) {
      const tipoEventoData: TipoEvento = { ...this.data, ...this.tipoEventoForm.value };
      this.tipoEventoService.updateTipoEvento(tipoEventoData).subscribe(() => {
        this.dialogRef.close(tipoEventoData);
      });
    }
  }

  getError(controlName: string): string {
    const control = this.tipoEventoForm.get(controlName);
    if (control?.hasError('required')) return 'Este campo es requerido';
    if (control?.hasError('maxlength')) return 'Longitud máxima excedida';
    return '';
  }
}
