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
import {MatIcon} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';

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
    MatIcon
  ],
  templateUrl: './persona-edit.component.html',
  styleUrls: ['./persona-edit.component.css']
})
export class PersonaEditComponent implements OnInit {
  private matDialogRef= inject(MatDialogRef<PersonaEditComponent>);
  personaForm: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string = 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop';

  constructor(
    private fb: FormBuilder,
    private personaService: PersonaService,
    private dialogRef: MatDialogRef<PersonaEditComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: Persona
  ) {
    this.personaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-Z]+( [a-zA-Z]+)*$'), Validators.minLength(3)]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-Z]+( [a-zA-Z]+)*$'), Validators.minLength(3)]],
      ci: ['', [Validators.required]],
      fechaNac: ['', Validators.required],
      sexo: ['', Validators.required],
      celular: [''],
      direccion: ['']
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
      if (this.data.uriFoto) {
        this.imagePreview = this.data.uriFoto;
      }
    }
  }

  onSubmit() {
    if (this.personaForm.valid) {
      const persona = {
        ...this.data,
        ...this.personaForm.value
      }
      this.personaService.updatePersona(persona.id!, persona).subscribe( {
        next:(response)=>{
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
        error:(err)=>{
          console.error('Error al crear la persona:', err);
        },
        complete:()=>{
          console.log('Solicitud completada.');
          this.snackBar.open('Error al Actualizar Persona', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
}
