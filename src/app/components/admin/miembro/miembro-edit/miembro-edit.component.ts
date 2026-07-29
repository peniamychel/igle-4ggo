import {Component, Inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatNativeDateModule} from '@angular/material/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatExpansionModule} from '@angular/material/expansion';
import {Miembro} from '../../../../core/models/miembro.model';
import {MiembroService} from '../../../../core/services/miembro.service';
import {ImageUrlPipe} from '../../../../shared/pipes/image-url.pipe';
import { ImageCropDialogComponent } from '../../../../shared/components/image-crop-dialog/image-crop-dialog.component';

@Component({
  selector: 'app-miembro-edit',
  templateUrl: './miembro-edit.component.html',
  styleUrls: ['./miembro-edit.component.css'],
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
    ImageUrlPipe
  ]
})
export class MiembroFormEditarComponent implements OnInit {
  miembroForm!: FormGroup;
  editMode = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  photoRemoved = false;

  constructor(
    private fb: FormBuilder,
    private miembroService: MiembroService,
    private dialogRef: MatDialogRef<MiembroFormEditarComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: Miembro
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

  ngOnInit() {
    if (this.data) {
      this.editMode = true;
      this.patchFormValues();
    }
  }

  patchFormValues() {
    if (this.data) {
      if (this.data.uriFoto) {
        this.imagePreview = this.data.uriFoto;
      }
      this.miembroForm.patchValue({
        ...this.data
      });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      const dialogRef = this.dialog.open(ImageCropDialogComponent, {
        data: { imageFile: file },
        width: '400px',
        maxWidth: '95vw',
        disableClose: true
      });
      
      dialogRef.afterClosed().subscribe((croppedFile: File) => {
        if (croppedFile) {
          this.selectedFile = croppedFile;
          const reader = new FileReader();
          reader.onload = () => {
            this.imagePreview = reader.result as string;
          };
          reader.readAsDataURL(this.selectedFile);
        } else {
          input.value = '';
        }
      });
    }
  }

  removePhoto() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.photoRemoved = true;
  }

  public onSubmit() {
    if (this.miembroForm.valid) {
      const formValue = this.miembroForm.value;

      const miembroData: Partial<Miembro> = {
        ...this.data,
        nombre: formValue.nombre,
        apellido: formValue.apellido,
        ci: formValue.ci,
        fechaNac: formValue.fechaNac,
        celular: formValue.celular,
        sexo: formValue.sexo,
        direccion: formValue.direccion,
        fechaConvercion: formValue.fechaConvercion,
        lugarConvercion: formValue.lugarConvercion,
        interventores: formValue.interventores,
        detalles: formValue.detalles,
        // Datos adicionales (opcionales)
        localidadNacimiento: formValue.localidadNacimiento,
        provincia: formValue.provincia,
        departamento: formValue.departamento,
        nombrePadre: formValue.nombrePadre,
        nombreMadre: formValue.nombreMadre,
        id: this.data.id
      };

      this.miembroService.updateMiembro(miembroData).subscribe(async () => {
        if (this.selectedFile && this.data.id) {
          await this.miembroService.uploadPhoto(this.data.id, this.selectedFile).toPromise();
        } else if (this.photoRemoved && this.data.id) {
          await this.miembroService.deletePhoto(this.data.id).toPromise();
        }
        this.dialogRef.close(true);
      });
    }
  }
}
