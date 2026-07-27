import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Cargo } from '../../../../core/models/cargo.model';

@Component({
  selector: 'app-cargo-baja-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './cargo-baja-dialog.component.html',
  styleUrls: ['./cargo-baja-dialog.component.css']
})
export class CargoBajaDialogComponent {
  bajaForm: FormGroup;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CargoBajaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cargo: Cargo }
  ) {
    this.bajaForm = this.fb.group({
      fechaFin: [new Date(), Validators.required]
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
    }
  }

  removeFile() {
    this.selectedFile = null;
  }

  onSubmit() {
    if (this.bajaForm.valid) {
      this.dialogRef.close({
        fechaFin: this.bajaForm.value.fechaFin,
        file: this.selectedFile
      });
    }
  }
}
