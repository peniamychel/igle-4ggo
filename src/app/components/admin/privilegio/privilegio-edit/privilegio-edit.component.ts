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
import { PrivilegioService } from '../../../../core/services/privilegio.service';
import { PrivilegioDto } from '../../../../core/models/interfaces/privilegio.interface';

@Component({
  selector: 'app-privilegio-edit',
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
  templateUrl: './privilegio-edit.component.html',
  styleUrls: ['./privilegio-edit.component.css']
})
export class PrivilegioEditComponent implements OnInit {
  privilegioForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private privilegioService: PrivilegioService,
    private dialogRef: MatDialogRef<PrivilegioEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PrivilegioDto
  ) {
    this.privilegioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      acto: ['', [Validators.required, Validators.maxLength(200)]],
    });
  }

  ngOnInit() {
    if (this.data) {
      this.privilegioForm.patchValue(this.data);
    }
  }

  onSubmit() {
    if (this.privilegioForm.valid && this.data.id) {
      const privilegioData: PrivilegioDto = { ...this.data, ...this.privilegioForm.value };
      this.privilegioService.update(this.data.id, privilegioData).subscribe(() => {
        this.dialogRef.close(privilegioData);
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
