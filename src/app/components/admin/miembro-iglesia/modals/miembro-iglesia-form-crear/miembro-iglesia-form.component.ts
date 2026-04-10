import {Component, inject, Inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MiembroIglesiaService } from '../../../../../core/services/miembro-iglesia.service';
import { IglesiaService } from '../../../../../core/services/iglesia.service';
import { Iglesia } from '../../../../../core/models/iglesia.model';
import { Miembro } from '../../../../../core/models/miembro.model';
import {MiembroService} from '../../../../../core/services/miembro.service';
// import Date from '$GLOBAL$';

@Component({
  selector: 'app-miembro-iglesia-form',
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
    FormsModule
  ],
  templateUrl: './miembro-iglesia-form.component.html',
  styleUrls: ['./miembro-iglesia-form.component.css']
})
export class MiembroIglesiaFormCrearComponent implements OnInit {
  form: FormGroup;
  iglesias: Iglesia[] = [];
  miembros: Miembro[] = [];

  private miembroService: MiembroService = inject(MiembroService)

  constructor(
    private fb: FormBuilder,
    private miembroIglesiaService: MiembroIglesiaService,
    private iglesiaService: IglesiaService,
    private dialogRef: MatDialogRef<MiembroIglesiaFormCrearComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { iglesia: Iglesia }
  ) {
    this.form = this.fb.group({
      miembroId: ['', Validators.required],
      fecha: ['', Validators.required],
    });
    this.loadIglesias();
  }

  loadIglesias() {
    // this.iglesiaService.getIglesias().subscribe(response => {
    //   this.iglesias = response.datos.filter(i => i.estado && i.id !== this.data.iglesia.id);
    // });
    this.miembroService.getMiembros().subscribe(response => {
      // this.miembros = response.datos.filter(m => m.estado && m.id !== this.data.miembro.id);
      this.miembros = response.datos.filter(m => m.estado);
    });
  }

  onSubmit() {
    if (this.form.valid) {
      // Update current membership
      const newMiembroIglesia = {
        miembroId: this.form.value.miembroId,
        iglesiaId: this.data.iglesia.id,
        fecha: new Date(),
      };
      this.miembroIglesiaService.createMiembroIglesia(newMiembroIglesia).subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }


  searchTerm: string = '';
  filteredIglesias = [...this.iglesias];  // Inicializar con todas las iglesias

  filterIglesias() {
    const term = this.searchTerm.toLowerCase();
    this.filteredIglesias = this.iglesias.filter(iglesia =>
      iglesia.nombre.toLowerCase().includes(term) ||
      iglesia.direccion.toLowerCase().includes(term)
    );
  }

  ngOnInit(): void {
    this.loadIglesias();
  }
}
