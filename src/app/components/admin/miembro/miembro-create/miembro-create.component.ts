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
import {PersonaService} from '../../../../core/services/persona.service';
import {Persona} from '../../../../core/models/persona.model';
import {MatSelectChange} from '@angular/material/select';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MiembroService} from '../../../../core/services/miembro.service';
import {ImageUrlPipe} from '../../../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-miembro-form',
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
  personas: Persona[] = [];
  selectedPersona: Persona | null = null;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private miembroService: MiembroService,
    private personaService: PersonaService,
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
    this.loadPersonas();
    if (this.data) {
      this.editMode = true;
      this.patchFormValues();
    }
  }

  loadPersonas() {
    this.personaService.personaNoMiembro().subscribe(response => {
      this.personas = response.datos.filter(p => p.estado);
    });
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

  onPersonaSelect(event: MatSelectChange) {
    this.selectedPersona = event.value;
    if (this.selectedPersona && 'nombre' in this.selectedPersona) {
      this.miembroForm.patchValue({
        nombre: this.selectedPersona.nombre,
        apellido: this.selectedPersona.apellido,
        ci: this.selectedPersona.ci,
        fechaNac: this.selectedPersona.fechaNac,
        celular: this.selectedPersona.celular,
        sexo: this.selectedPersona.sexo,
        direccion: this.selectedPersona.direccion
      });
      if (this.selectedPersona.uriFoto) {
        this.imagePreview = this.selectedPersona.uriFoto;
      }
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
      let personaId: number;

      if (this.selectedPersona) {
        personaId = this.selectedPersona.id!;
      } else {
        const personaData: any = {
          nombre: formValue.nombre,
          apellido: formValue.apellido,
          ci: formValue.ci,
          fechaNac: formValue.fechaNac,
          celular: formValue.celular,
          sexo: formValue.sexo,
          direccion: formValue.direccion,
          uriFoto: ''
        };

        const personaResponse = await this.personaService.createPersona(personaData).toPromise();
        personaId = personaResponse.datos.id;

        if (this.selectedFile && personaId) {
          await this.personaService.uploadUserPhoto(personaId, this.selectedFile).toPromise();
        }
      }

      const miembroData = {
        fechaConvercion: formValue.fechaConvercion,
        lugarConvercion: formValue.lugarConvercion,
        interventores: formValue.interventores,
        detalles: formValue.detalles,
        personaId: personaId!
      };

      await this.miembroService.createMiembro(miembroData).toPromise();
      this.dialogRef.close(true);
    }
  }
}
