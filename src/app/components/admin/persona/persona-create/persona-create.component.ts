import {Component, inject, Inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatSelectModule} from '@angular/material/select';
import {MatDialogRef, MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {PersonaService} from '../../../../core/services/persona.service';
import {Persona} from '../../../../core/models/persona.model';
import {MatRadioButton, MatRadioGroup} from '@angular/material/radio';
import {catchError, Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';
import {MatIconModule} from '@angular/material/icon';
import {ImagePreviewDialogComponent} from '../../usuario-sistema/imagen-preview-dialog/image-preview-dialog.component';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {MatTooltipModule} from '@angular/material/tooltip';

@Component({
  selector: 'app-persona-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatSelectModule,
    MatDialogModule,
    MatRadioButton,
    MatRadioGroup,
    MatIconModule,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatTooltipModule,

  ],
  templateUrl: './persona-create.component.html',
  styleUrls: ['./persona-create.component.css']
})
export class PersonaCreateComponent implements OnInit {
  personaForm: FormGroup;

  private personaService = inject(PersonaService);
  private fb = inject(FormBuilder);
  private matDialogRef = inject(MatDialogRef<PersonaCreateComponent>);
  private snackBar: MatSnackBar = inject(MatSnackBar);

  selectedFile: File | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Persona
  ) {
    this.personaForm = this.fb.group({

      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-Z]+( [a-zA-Z]+)*$'), Validators.minLength(3)]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-Z]+( [a-zA-Z]+)*$'), Validators.minLength(3)]],
      // ci: ['', [Validators.required, Validators.pattern(/^\d.*/), Validators.minLength(4)], [this.ciValidator.bind(this)]],
      fechaNac: ['', Validators.required],
      sexo: ['', Validators.required]
    });
  }

  ciValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    return this.personaService.buscarCi(control.value).pipe(
      map(persona => {
        return persona ? {ciExists: true} : null;
      }),
      catchError(() => of(null)) // Si hay un error en la solicitud, no marcará error
    );
  }

  ngOnInit() {
    if (this.data) {
      this.personaForm.patchValue(this.data);
    }
  }

  onSubmit() {
    if (this.personaForm.valid) {
      const persona = {
        ...this.data,
        ...this.personaForm.value
      };
      this.personaService.createPersona(persona).subscribe({
        next: (response) => {
          if (this.selectedFile && response.datos.id) {
            this.personaService.uploadUserPhoto(response.datos.id, this.selectedFile).subscribe({
              next: () => {
                this.snackBar.open('Persona creado exitosamente', 'Cerrar', {
                  duration: 3000,
                  panelClass: ['success-snackbar']
                });
                this.matDialogRef.close(true);
              },
              error: () => {
                this.snackBar.open('Error al subir la foto', 'Cerrar', {
                  duration: 3000,
                  panelClass: ['error-snackbar']
                });
                this.matDialogRef.close(true);
              }
            });
          } else {
            this.snackBar.open('Persona creado exitosamente', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.matDialogRef.close(true);
          }

        },
        error: (err) => {
          console.error('Error al crear la persona:', err);
        },
        complete: () => {
          console.log('Solicitud completada.');
          this.snackBar.open('Error al crear Persona', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

//   metodos para validacion
  getErrorMessageNombre(controlName: string): string {
    const control = this.personaForm.get(controlName);
    if (control?.hasError('required')) {
      return 'El nombre es requerido';
    }
    if (control?.hasError('pattern')) {
      return 'Solo se permiten caracteres';
    }
    if (control?.hasError('minlength')) {
      return 'Se reguiere mas de 3 caracteres';
    }
    return '';
  }

  getErrorMessageApellido(controlName: string): string {
    const control = this.personaForm.get(controlName);
    if (control?.hasError('required')) {
      return 'El apellido es requerido';
    }
    if (control?.hasError('pattern')) {
      return 'Solo se permiten caracteres';
    }
    if (control?.hasError('minlength')) {
      return 'Se reguiere mas de 3 caracteres';
    }
    return '';
  }

  getErrorMessageCi(controlName: string): string {
    const control = this.personaForm.get(controlName);
    if (control?.hasError('required')) {
      return 'El ci es requerido';
    }
    if (control?.hasError('pattern')) {
      return 'Ci debe comenar por numeros';
    }
    if (control?.hasError('minlength')) {
      return 'Se reguiere mas de 4 caracteres';
    }
    if (control?.hasError('ciExists')) {
      return 'El CI ya se encuentra registrado';
    }
    return '';
  }

  getErrorMessage(controlName: string): string {
    const control = this.personaForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Campo es requerido';
    }
    return '';
  }

  getErrorMessageSexo(controlName: string): string {
    const control = this.personaForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Seleccione un sexo *';
    }
    return '';
  }

  //Gestion de subida de archivos
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  // openImagePreview(): void {
  //   const imageUrl = this.previewUrl || this.data.uriFoto;
  //   if (imageUrl) {
  //     this.dialog.open(ImagePreviewDialogComponent, {
  //       data: { imageUrl, alt: this.data.username },
  //       maxWidth: '100vw',
  //       maxHeight: '100vh',
  //       panelClass: 'image-preview-dialog'
  //     });
  //   }
  // }
}
