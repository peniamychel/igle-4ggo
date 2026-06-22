import {Component, Inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatSelectModule} from '@angular/material/select';
import {MatNativeDateModule} from '@angular/material/core';
import {MatDialogRef, MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Miembro} from '../../../../core/models/miembro.model';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MiembroService} from '../../../../core/services/miembro.service';
import {ImageUrlPipe} from '../../../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-miembro-create',
  templateUrl: './miembro-create.component.html',
  styleUrls: ['./miembro-create.component.css'],
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
    ImageUrlPipe
  ]
})
export class MiembroCreateComponent implements OnInit {
  miembroForm!: FormGroup;
  editMode = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private miembroService: MiembroService,
    private dialogRef: MatDialogRef<MiembroCreateComponent>,
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
      direccion: ['', Validators.required],
      fechaConvercion: [''],
      lugarConvercion: ['', Validators.required],
      interventores: ['', Validators.required],
      detalles: ['', Validators.required]
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
    if (this.miembroForm.valid) {
      const formValue = this.miembroForm.value;

      const miembroData: Partial<Miembro> = {
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
        uriFoto: ''
      };

      try {
        const response = await this.miembroService.createMiembro(miembroData).toPromise();
        const miembroId = response.datos.id;

        if (this.selectedFile && miembroId) {
          await this.miembroService.uploadPhoto(miembroId, this.selectedFile).toPromise();
        }
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error al crear el miembro:', error);
      }
    }
  }
}
