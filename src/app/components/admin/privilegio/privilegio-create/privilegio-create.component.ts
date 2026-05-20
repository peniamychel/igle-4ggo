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
import { PrivilegioService } from '../../../../core/services/privilegio.service';

@Component({
  selector: 'app-privilegio-create',
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
  templateUrl: './privilegio-create.component.html',
  styleUrls: ['./privilegio-create.component.css']
})
export class PrivilegioCreateComponent {
  privilegioForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private privilegioService: PrivilegioService,
    private dialogRef: MatDialogRef<PrivilegioCreateComponent>
  ) {
    this.privilegioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      acto: ['', [Validators.required, Validators.maxLength(200)]],
    });
  }

  onSubmit() {
    if (this.privilegioForm.valid) {
      const data = this.privilegioForm.value;
      this.privilegioService.create(data).subscribe(() => {
        this.dialogRef.close(data);
      });
    }
  }

  getError(controlName: string): string {
    const control = this.privilegioForm.get(controlName);
    if (control?.hasError('required')) return 'Este campo es requerido';
    if (control?.hasError('maxlength')) return 'Longitud máxima excedida';
    return '';
  }
}
