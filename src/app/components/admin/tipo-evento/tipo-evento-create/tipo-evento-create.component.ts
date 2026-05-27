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
import { TipoEventoService } from '../../../../core/services/tipo-evento.service';

@Component({
  selector: 'app-tipo-evento-create',
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
  templateUrl: './tipo-evento-create.component.html',
  styleUrls: ['./tipo-evento-create.component.css']
})
export class TipoEventoCreateComponent {
  tipoEventoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private tipoEventoService: TipoEventoService,
    private dialogRef: MatDialogRef<TipoEventoCreateComponent>
  ) {
    this.tipoEventoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
    });
  }

  onSubmit() {
    if (this.tipoEventoForm.valid) {
      const tipoEventoData = this.tipoEventoForm.value;
      this.tipoEventoService.createTipoEvento(tipoEventoData).subscribe(() => {
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
