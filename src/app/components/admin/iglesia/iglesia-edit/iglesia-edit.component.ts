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
import { MatTooltipModule } from '@angular/material/tooltip';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { catchError, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-iglesia-edit',
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
    MatTooltipModule,
  ],
  templateUrl: './iglesia-edit.component.html',
  styleUrls: ['./iglesia-edit.component.css']
})
export class IglesiaEditComponent implements OnInit {
  iglesiaForm: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploadingFoto = false;
  deletingFoto = false;

  constructor(
    private fb: FormBuilder,
    private iglesiaService: IglesiaService,
    private dialogRef: MatDialogRef<IglesiaEditComponent>,
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
      if (this.data.uriFoto) {
        this.previewUrl = this.data.uriFoto;
      }
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
    this.previewUrl = this.data.uriFoto || null;
  }

  deleteFoto() {
    if (!this.data.id) return;
    this.deletingFoto = true;
    this.iglesiaService.deleteFoto(this.data.id).subscribe({
      next: () => {
        this.data.uriFoto = undefined;
        this.previewUrl = null;
        this.selectedFile = null;
        this.deletingFoto = false;
      },
      error: () => { this.deletingFoto = false; }
    });
  }

  onSubmit() {
    if (this.iglesiaForm.valid) {
      const iglesiaData: Iglesia = { ...this.data, ...this.iglesiaForm.value };

      this.iglesiaService.updateIglesia(iglesiaData).subscribe(() => {
        if (this.selectedFile && this.data.id) {
          this.uploadingFoto = true;
          this.iglesiaService.uploadFoto(this.data.id, this.selectedFile).subscribe({
            next: (res) => {
              iglesiaData.uriFoto = res.datos;
              this.uploadingFoto = false;
              this.dialogRef.close(iglesiaData);
            },
            error: () => {
              this.uploadingFoto = false;
              this.dialogRef.close(iglesiaData);
            }
          });
        } else {
          this.dialogRef.close(iglesiaData);
        }
      });
    }
  }

  /*valida nombre de iglesia si ya existe*/
  nombreValidator = (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (this.data && this.data.nombre === control.value) {
      return of(null);
    }
    const id = this.data?.id;
    if (id) {
      return this.iglesiaService.buscarNombreIglesiaExeptoId(control.value, id).pipe(
        map(iglesia => iglesia ? { nameExists: true } : null),
        catchError(() => of(null))
      );
    }
    return of(null);
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
