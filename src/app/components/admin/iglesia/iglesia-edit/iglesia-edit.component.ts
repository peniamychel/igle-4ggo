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
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { catchError, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-iglesia-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatNativeDateModule
  ],
  templateUrl: './iglesia-edit.component.html',
  styleUrls: ['./iglesia-edit.component.css']
})
export class IglesiaEditComponent implements OnInit {
  iglesiaForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private iglesiaService: IglesiaService,
    private dialogRef: MatDialogRef<IglesiaEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Iglesia
  ) {
    this.iglesiaForm = this.fb.group({
      nombre: ['', { validators: [Validators.required], asyncValidators: [this.nombreValidator], updateOn: 'blur' }],
      direccion: ['', [Validators.required]],
      // telefono: ['', [Validators.required, Validators.pattern('^[0-9]*$')]]
    });
  }

  ngOnInit() {
    if (this.data) {
      this.iglesiaForm.patchValue(this.data);
    }
  }

  onSubmit() {
    if (this.iglesiaForm.valid) {
      let iglesiaData = { ...this.data, ...this.iglesiaForm.value };

      this.iglesiaService.updateIglesia(iglesiaData).subscribe(() => {
        this.dialogRef.close(iglesiaData);
      });
    }
  }

  /*valida nombre de iglesia si ya existe*/
  nombreValidator = (control: AbstractControl): Observable<ValidationErrors | null> => {
    // Si el nombre no ha cambiado respecto al original, es válido
    if (this.data && this.data.nombre === control.value) {
      return of(null);
    }
    const id = this.data?.id;
    if (id) {
      return this.iglesiaService.buscarNombreIglesiaExeptoId(control.value, id).pipe(
        map(iglesia => {
          return iglesia ? { nameExists: true } : null;
        }),
        catchError(() => of(null)) // Si hay un error en la solicitud, no marcará error
      );
    }
    return of(null);
  }

  getErrorMessageNombre(controlName: string): string {
    const control = this.iglesiaForm.get(controlName);

    if (control?.hasError('required')) {
      return 'El nombre de la iglesia es requerido';
    }
    if (control?.hasError('nameExists')) {
      return 'El nombre de la iglesia ya se encuentra registrado';
    }
    return '';
  }

  getErrorMessageDireccion(controlName: string): string {
    const control = this.iglesiaForm.get(controlName);
    if (control?.hasError('required')) {
      return 'La direccion es requerida';
    }
    return '';
  }
  getErrorMessageTelefono(controlName: string): string {
    const control = this.iglesiaForm.get(controlName);
    if (control?.hasError('required')) {
      return 'El telefono es requerido';
    }
    if (control?.hasError('pattern')) {
      return 'Solo se permiten números';
    }
    return '';
  }
}
