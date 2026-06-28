import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CargoService } from '../../../../core/services/cargo.service';
import { MiembroIglesiaService } from '../../../../core/services/miembro-iglesia.service';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { TipoCargo } from '../../../../core/models/tipo-cargo.model';
import { Miembro } from '../../../../core/models/miembro.model';
import { Cargo } from '../../../../core/models/cargo.model';

@Component({
  selector: 'app-cargo-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule
  ],
  templateUrl: './cargo-create.component.html',
  styleUrls: ['./cargo-create.component.css']
})
export class CargoCreateComponent implements OnInit {
  @ViewChild('searchIglesia') searchIglesiaInput!: ElementRef;
  @ViewChild('searchMiembro') searchMiembroInput!: ElementRef;
  cargoForm: FormGroup;
  iglesias: Iglesia[] = [];
  filteredIglesias: Iglesia[] = [];
  tiposCargo: TipoCargo[] = [];
  miembros: Miembro[] = [];
  filteredMiembros: Miembro[] = [];
  selectedFile: File | null = null;

  cargosActivos: Cargo[] = [];

  constructor(
    private fb: FormBuilder,
    private cargoService: CargoService,
    private miembroIglesiaService: MiembroIglesiaService,
    private dialogRef: MatDialogRef<CargoCreateComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { iglesias: Iglesia[], tiposCargo: TipoCargo[], miembros: Miembro[] }
  ) {
    this.cargoForm = this.fb.group({
      rolCargoId: ['', Validators.required],
      iglesiaId: ['', Validators.required],
      idMiembro: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: [''],
      detalle: ['', Validators.maxLength(500)]
    });
  }

  ngOnInit() {
    if (this.data) {
      this.iglesias = this.data.iglesias;
      this.filteredIglesias = [...this.iglesias];
      this.tiposCargo = this.data.tiposCargo.filter(tc => tc.estado);
      this.miembros = [];
      this.filteredMiembros = [];
      // Cargar cargos para filtrar los miembros que ya tienen roles activos
      this.cargoService.getCargos().subscribe({
        next: (res) => {
          this.cargosActivos = res.datos || [];
        },
        error: (err) => {
          console.error('[CargoCreate] Error loading active cargos:', err);
        }
      });

      this.registerIglesiaChangeHandler();

      if (this.iglesias.length === 1) {
        this.cargoForm.patchValue({ iglesiaId: this.iglesias[0].id });
        this.cargoForm.get('iglesiaId')?.disable();
      }
    }
  }

  memberCargoName = '';

  checkMiembroCargo(miembroId: number) {
    if (!miembroId) return;
    const cargoMiembro = this.cargosActivos.find(c => Number(c.idMiembro) === Number(miembroId) && c.estado === true);
    if (cargoMiembro) {
      const rolNombre = cargoMiembro.tipoCargoDto?.nombre || (cargoMiembro as any).rolCargo?.nombre || 'un cargo';
      this.memberCargoName = rolNombre;
      this.cargoForm.get('idMiembro')?.setErrors({ yaTieneCargo: true });
    } else {
      const control = this.cargoForm.get('idMiembro');
      if (control?.errors && control.errors['yaTieneCargo']) {
        const errors = { ...control.errors };
        delete errors['yaTieneCargo'];
        control.setErrors(Object.keys(errors).length ? errors : null);
      }
    }
  }

  registerIglesiaChangeHandler() {
    if (!this.cargoForm.get('iglesiaId')?.value) {
      this.cargoForm.get('idMiembro')?.disable();
    }

    // Suscribirse a cambios de miembro para validar si ya tiene cargo
    this.cargoForm.get('idMiembro')?.valueChanges.subscribe(miembroId => {
      this.checkMiembroCargo(Number(miembroId));
    });

    this.cargoForm.get('iglesiaId')?.valueChanges.subscribe(iglesiaId => {
      if (iglesiaId) {
        this.cargoForm.get('idMiembro')?.enable();
        this.miembroIglesiaService.getMiembrosPorIglesia(iglesiaId).subscribe(response => {
          this.miembros = response.datos || [];
          this.filteredMiembros = [...this.miembros];
          this.cargoForm.get('idMiembro')?.setValue('');
        });
      } else {
        this.miembros = [];
        this.filteredMiembros = [];
        this.cargoForm.get('idMiembro')?.setValue('');
        this.cargoForm.get('idMiembro')?.disable();
      }
    });
  }

  filterIglesias(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredIglesias = this.iglesias.filter(iglesia => 
      iglesia.nombre.toLowerCase().includes(filterValue)
    );
  }

  onIglesiaSelectOpen(isOpen: boolean) {
    if (isOpen) {
      setTimeout(() => {
        if (this.searchIglesiaInput) {
          this.searchIglesiaInput.nativeElement.focus();
        }
      }, 0);
    }
  }

  filterMiembros(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredMiembros = this.miembros.filter(miembro => {
      const nombreCompleto = this.getMiembroNombreCompleto(miembro).toLowerCase();
      const ci = (miembro.ci?.toString() || '').toLowerCase();
      return nombreCompleto.includes(filterValue) || ci.includes(filterValue);
    });
  }

  onMiembroSelectOpen(isOpen: boolean) {
    if (isOpen) {
      setTimeout(() => {
        if (this.searchMiembroInput) {
          this.searchMiembroInput.nativeElement.focus();
        }
      }, 0);
    }
  }

  onSubmit() {
    if (this.cargoForm.valid) {
      const cargoData: Partial<Cargo> = this.cargoForm.getRawValue();
      this.cargoService.createCargo(cargoData).subscribe({
        next: (response: any) => {
          const cargoId = response.datos?.id;
          if (this.selectedFile && cargoId) {
            this.cargoService.uploadActaAsignacion(cargoId, this.selectedFile).subscribe({
              next: () => this.dialogRef.close(true),
              error: () => this.dialogRef.close(true)
            });
          } else {
            this.dialogRef.close(true);
          }
        },
        error: (err) => {
          console.error('Error saving cargo:', err);
          const errorMsg = err.error?.message || 'Error al guardar el cargo. Si el problema persiste, por favor contacte con soporte técnico.';
          this.snackBar.open(errorMsg, 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
    }
  }

  removeFile() {
    this.selectedFile = null;
  }

  getError(controlName: string): string {
    const control = this.cargoForm.get(controlName);
    if (control?.hasError('required')) return 'Este campo es requerido';
    if (control?.hasError('maxlength')) return 'Longitud máxima excedida';
    if (control?.hasError('yaTieneCargo')) return 'Este miembro ya tiene el rol: ' + this.memberCargoName;
    return '';
  }

  getMiembroNombreCompleto(miembro: Miembro): string {
    if (!miembro) return 'N/A';
    return `${miembro.nombre} ${miembro.apellido}`;
  }
}
