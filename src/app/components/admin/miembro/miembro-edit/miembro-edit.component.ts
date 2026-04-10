import {Component, Inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatSelectChange, MatSelectModule} from '@angular/material/select';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatNativeDateModule} from '@angular/material/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {Miembro} from '../../../../core/models/miembro.model';
import {Persona} from '../../../../core/models/persona.model';
import {PersonaService} from '../../../../core/services/persona.service';
import {MiembroService} from '../../../../core/services/miembro.service';

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
    MatButtonToggleModule
  ]
})
export class MiembroFormEditarComponent implements OnInit {
  miembroForm!: FormGroup;
  personaForm!: FormGroup;
  editMode = false;
  personas: Persona[] = [];
  selectedPersona: Persona | null = null;
  private persona: Persona | null = null;
  private miembro: Miembro | null = null;

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
      // Persona fields
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      ci: ['', Validators.required],
      fechaNac: ['', Validators.required],
      celular: ['', Validators.required],
      sexo: ['', Validators.required],
      direccion: ['', Validators.required],
      uriFoto: [''],

      // Miembro fields
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
    this.personaService.getPersonas().subscribe(response => {
      this.personas = response.datos.filter(p => p.estado);
    });
  }

  patchFormValues() {
    if (this.data.personaDto) {
      this.selectedPersona = this.data.personaDto;
      this.miembroForm.patchValue({
        ...this.data.personaDto,
        ...this.data
      });
    }
  }


  public async onSubmit2() {
    if (this.miembroForm.valid) {
      const miembroForm = this.miembroForm.value;

      this.persona = this.data.personaDto!;

      const persona = await this.personaService.getPersonaById(this.persona.id!).toPromise();

      this.data.personaDto = {
        ...this.data.personaDto,
        nombre: miembroForm.nombre,
        apellido: miembroForm.apellido,
        ci: miembroForm.ci,
        fechaNac: miembroForm.fechaNac,
        celular: miembroForm.celular,
        sexo: miembroForm.sexo,
        direccion: miembroForm.direccion,
        uriFoto: miembroForm.uriFoto,
        id: this.data.personaDto!.id
      };
      await this.personaService.updatePersonax(this.persona).toPromise();

      const miembroData = {
        ...this.data,
        fechaConvercion: miembroForm.fechaConvercion,
        lugarConvercion: miembroForm.lugarConvercion,
        interventores: miembroForm.interventores,
        detalles: miembroForm.detalles,
        personaId: this.data.personaDto!.id
      };
      await this.miembroService.updateMiembro(miembroData).toPromise();


      this.dialogRef.close(true);
    }
  }

  public onSubmit() {
    const miembroForm = this.miembroForm.value;

    if (this.miembroForm.valid) {
      // console.log(this.data)

      const persona = {
        ...this.data.personaDto,
        nombre: miembroForm.nombre,
        apellido: miembroForm.apellido,
        ci: miembroForm.ci,
        fechaNac: miembroForm.fechaNac,
        celular: miembroForm.celular,
        sexo: miembroForm.sexo,
        direccion: miembroForm.direccion,
        uriFoto: miembroForm.uriFoto
      };
      this.personaService.updatePersonax(persona).subscribe(() => {
      });

      const miembroData = {
        ...this.data,
        fechaConvercion: miembroForm.fechaConvercion,
        lugarConvercion: miembroForm.lugarConvercion,
        interventores: miembroForm.interventores,
        detalles: miembroForm.detalles,
        personaId: this.data.personaDto!.id,
        id: this.data.id
      };

      this.miembroService.updateMiembro(miembroData).subscribe(() => {
        this.dialogRef.close(true);
      });

    }
  }
}
