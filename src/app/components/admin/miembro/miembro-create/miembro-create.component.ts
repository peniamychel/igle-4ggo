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
import {Miembro} from '../../../../core/models/miembro.model';
import {PersonaService} from '../../../../core/services/persona.service';
import {Persona} from '../../../../core/models/persona.model';
import {MatSelectChange} from '@angular/material/select';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MiembroService} from '../../../../core/services/miembro.service';
import {firstValueFrom} from 'rxjs';

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
    MatButtonToggleModule
  ]
})
export class MiembroCreateComponent implements OnInit {
  miembroForm!: FormGroup;
  editMode = false;
  personas: Persona[] = [];
  selectedPersona: Persona | null = null;

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
    // this.personaService.getPersonas().subscribe(response => {
    //   this.personas = response.datos.filter(p => p.estado);
    // });
    this.personaService.personaNoMiembro().subscribe( response => {
      this.personas = response.datos.filter(p => p.estado);
    })
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
        direccion: this.selectedPersona.direccion,
        uriFoto: this.selectedPersona.uriFoto
      });

    }
  }

  public async onSubmit() {
    if (this.miembroForm.valid) {
      const formValue = this.miembroForm.value;
      let personaId: number;

      if (this.selectedPersona) {
        personaId = this.selectedPersona.id!;
      } else {
        const personaData = {
          nombre: formValue.nombre,
          apellido: formValue.apellido,
          ci: formValue.ci,
          fechaNac: formValue.fechaNac,
          celular: formValue.celular,
          sexo: formValue.sexo,
          direccion: formValue.direccion,
          uriFoto: formValue.uriFoto
        };

        const personaResponse = await this.personaService.createPersona(personaData).toPromise();
        // const personaResponse = await firstValueFrom(this.personaService.createPersona(personaData));
        personaId = personaResponse.datos.id;

      }

      const miembroData = {...this.data,
        fechaConvercion: formValue.fechaConvercion,
        lugarConvercion: formValue.lugarConvercion,
        interventores: formValue.interventores,
        detalles: formValue.detalles,
        personaId: personaId!
      };

      if (this.editMode && this.data.id) {
        await this.miembroService.updateMiembro(miembroData).toPromise();
        if (this.selectedPersona) {
          await this.personaService.updatePersonax(this.selectedPersona).toPromise();
        }
      } else {
        await this.miembroService.createMiembro(miembroData).toPromise();
      }

      this.dialogRef.close(true);
    }
  }
}
