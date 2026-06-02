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
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Miembro} from '../../../../core/models/miembro.model';
import {Persona} from '../../../../core/models/persona.model';
import {PersonaService} from '../../../../core/services/persona.service';
import {MiembroService} from '../../../../core/services/miembro.service';
import {ImageUrlPipe} from '../../../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-miembro-form',
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
    ImageUrlPipe
  ]
})
export class MiembroFormEditarComponent implements OnInit {
  miembroForm!: FormGroup;
  editMode = false;
  selectedPersona: Persona | null = null;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  photoRemoved = false;

  constructor(
    private fb: FormBuilder,
    private miembroService: MiembroService,
    private personaService: PersonaService,
    private dialogRef: MatDialogRef<MiembroFormEditarComponent>,
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
    if (this.data.personaDto) {
      this.selectedPersona = this.data.personaDto;
      if (this.data.personaDto.uriFoto) {
        this.imagePreview = this.data.personaDto.uriFoto;
      }
      this.miembroForm.patchValue({
        ...this.data.personaDto,
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
    this.photoRemoved = true;
  }

  public onSubmit() {
    if (this.miembroForm.valid) {
      const formValue = this.miembroForm.value;

      const persona: any = {
        ...this.data.personaDto,
        nombre: formValue.nombre,
        apellido: formValue.apellido,
        ci: formValue.ci,
        fechaNac: formValue.fechaNac,
        celular: formValue.celular,
        sexo: formValue.sexo,
        direccion: formValue.direccion
      };

      this.personaService.updatePersonax(persona).subscribe(async () => {
        if (this.selectedFile && this.data.personaDto?.id) {
          await this.personaService.uploadUserPhoto(this.data.personaDto.id, this.selectedFile).toPromise();
        } else if (this.photoRemoved && this.data.personaDto?.id) {
          await this.personaService.deleteProfilePhoto(this.data.personaDto.id).toPromise();
        }

        const miembroData = {
          ...this.data,
          fechaConvercion: formValue.fechaConvercion,
          lugarConvercion: formValue.lugarConvercion,
          interventores: formValue.interventores,
          detalles: formValue.detalles,
          personaId: this.data.personaDto!.id,
          id: this.data.id
        };

        this.miembroService.updateMiembro(miembroData).subscribe(() => {
          this.dialogRef.close(true);
        });
      });
    }
  }
}
