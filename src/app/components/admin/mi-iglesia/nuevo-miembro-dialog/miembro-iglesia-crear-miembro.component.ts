import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Miembro } from '../../../../core/models/miembro.model';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { MiembroService } from '../../../../core/services/miembro.service';
import { MiembroIglesiaService } from '../../../../core/services/miembro-iglesia.service';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-miembro-iglesia-crear-miembro',
  templateUrl: './miembro-iglesia-crear-miembro.component.html',
  styleUrls: ['./miembro-iglesia-crear-miembro.component.css'],
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
    MatNativeDateModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTooltipModule,
    MatExpansionModule,
    MatSnackBarModule,
    ImageUrlPipe
  ]
})
export class MiembroIglesiaCrearMiembroComponent implements OnInit {
  miembroForm!: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private miembroService: MiembroService,
    private miembroIglesiaService: MiembroIglesiaService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<MiembroIglesiaCrearMiembroComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { iglesia: Iglesia }
  ) {
    this.createForm();
  }

  createForm() {
    this.miembroForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      ci: ['', Validators.required],
      fechaNac: ['', Validators.required],
      celular: ['', Validators.required],
      sexo: ['', Validators.required],
      // Obligatorios: nombre, apellido, CI, fecha de nacimiento, sexo y celular.
      // El resto es opcional (puede completarse más adelante).
      direccion: [''],
      fechaConvercion: [''],
      lugarConvercion: [''],
      interventores: [''],
      detalles: [''],
      // Datos adicionales (opcionales) — sección desplegable
      localidadNacimiento: [''],
      provincia: [''],
      departamento: [''],
      nombrePadre: [''],
      nombreMadre: ['']
    });
  }

  ngOnInit() {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removePhoto() {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  public async onSubmit() {
    if (this.miembroForm.valid && !this.saving) {
      this.saving = true;
      const formValue = this.miembroForm.value;

      const miembroData: Partial<Miembro> = {
        nombre: formValue.nombre,
        apellido: formValue.apellido,
        ci: formValue.ci,
        fechaNac: formValue.fechaNac,
        celular: formValue.celular,
        sexo: formValue.sexo,
        direccion: formValue.direccion,
        fechaConvercion: formValue.fechaConvercion || null,
        lugarConvercion: formValue.lugarConvercion,
        interventores: formValue.interventores,
        detalles: formValue.detalles,
        // Datos adicionales (opcionales)
        localidadNacimiento: formValue.localidadNacimiento,
        provincia: formValue.provincia,
        departamento: formValue.departamento,
        nombrePadre: formValue.nombrePadre,
        nombreMadre: formValue.nombreMadre,
        uriFoto: ''
      };

      try {
        // Paso 1: Crear Miembro
        const response = await this.miembroService.createMiembro(miembroData).toPromise();
        const miembroId = response.datos.id;

        // Paso 2: Cargar Foto si existe
        if (this.selectedFile && miembroId) {
          try {
            await this.miembroService.uploadPhoto(miembroId, this.selectedFile).toPromise();
          } catch (photoError) {
            console.error('Error al subir la foto del miembro:', photoError);
            this.snackBar.open('Miembro creado, pero falló la carga de la foto.', 'Cerrar', {
              duration: 4000,
              panelClass: ['warning-snackbar']
            });
          }
        }

        // Paso 3: Crear relación de Miembro con la Iglesia actual
        const relacionData = {
          miembroId: miembroId,
          iglesiaId: this.data.iglesia.id,
          fecha: new Date(),
          estado: true
        };

        await this.miembroIglesiaService.createMiembroIglesia(relacionData).toPromise();

        this.snackBar.open('Miembro registrado y asignado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        this.dialogRef.close(true);
      } catch (error: any) {
        console.error('Error durante el registro del miembro:', error);
        const errorMsg = error?.error?.message || 'Error al registrar el nuevo miembro.';
        this.snackBar.open(errorMsg, 'Cerrar', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      } finally {
        this.saving = false;
      }
    }
  }
}
