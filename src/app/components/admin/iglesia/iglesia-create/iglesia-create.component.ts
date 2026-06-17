import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { catchError, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-iglesia-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './iglesia-create.component.html',
  styleUrls: ['./iglesia-create.component.css']
})
export class IglesiaCreateComponent implements OnInit {
  iglesiaForm: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private iglesiaService: IglesiaService,
    private dialogRef: MatDialogRef<IglesiaCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Iglesia
  ) {
    this.iglesiaForm = this.fb.group({
      nombre: ['', { validators: [Validators.required], asyncValidators: [this.nombreValidator], updateOn: 'blur' }],
      direccion: ['', [Validators.required]],
      telefono: ['', [Validators.pattern('^[0-9]*$')]],
      fechaFundacion: [null],
    });
  }

  ngOnInit() {
    if (this.data) {
      this.iglesiaForm.patchValue(this.data);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  clearFile() {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  onSubmit() {
    if (this.iglesiaForm.valid) {
      this.saving = true;
      const iglesiaData = this.iglesiaForm.value;

      this.iglesiaService.createIglesia(iglesiaData).subscribe({
        next: (res) => {
          const createdId = res?.datos?.id;
          if (this.selectedFile && createdId) {
            this.iglesiaService.uploadFoto(createdId, this.selectedFile).subscribe({
              next: (fotoRes) => {
                iglesiaData.uriFoto = fotoRes.datos;
                this.saving = false;
                this.dialogRef.close(iglesiaData);
              },
              error: () => {
                this.saving = false;
                this.dialogRef.close(iglesiaData);
              }
            });
          } else {
            this.saving = false;
            this.dialogRef.close(iglesiaData);
          }
        },
        error: () => { this.saving = false; }
      });
    }
  }

  nombreValidator = (control: AbstractControl): Observable<ValidationErrors | null> => {
    return this.iglesiaService.buscarNombreIglesia(control.value).pipe(
      map(iglesia => iglesia ? { nameExists: true } : null),
      catchError(() => of(null))
    );
  }

  getErrorMessageNombre(controlName: string): string {
    const control = this.iglesiaForm.get(controlName);
    if (control?.hasError('required')) return 'El nombre de la iglesia es requerido';
    if (control?.hasError('nameExists')) return 'El nombre de la iglesia ya se encuentra registrado';
    return '';
  }

  getErrorMessageDireccion(controlName: string): string {
    const control = this.iglesiaForm.get(controlName);
    if (control?.hasError('required')) return 'La direccion es requerida';
    return '';
  }

  getErrorMessageTelefono(controlName: string): string {
    const control = this.iglesiaForm.get(controlName);
    if (control?.hasError('pattern')) return 'Solo se permiten números';
    return '';
  }
}
