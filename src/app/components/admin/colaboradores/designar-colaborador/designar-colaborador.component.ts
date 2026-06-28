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
import { TipoCargoService } from '../../../../core/services/tipo-cargo.service';
import { MiembroIglesiaService } from '../../../../core/services/miembro-iglesia.service';
import { TipoCargo } from '../../../../core/models/tipo-cargo.model';
import { Miembro } from '../../../../core/models/miembro.model';
import { Cargo } from '../../../../core/models/cargo.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-designar-colaborador',
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
  templateUrl: './designar-colaborador.component.html',
  styleUrls: ['./designar-colaborador.component.css']
})
export class DesignarColaboradorComponent implements OnInit {
  @ViewChild('searchMiembro') searchMiembroInput!: ElementRef;
  cargoForm: FormGroup;
  tiposCargo: TipoCargo[] = [];
  miembros: Miembro[] = [];
  filteredMiembros: Miembro[] = [];
  selectedFile: File | null = null;
  loading = false;
  cargosActivos: Cargo[] = [];
  memberCargoName = '';

  constructor(
    private fb: FormBuilder,
    private cargoService: CargoService,
    private tipoCargoService: TipoCargoService,
    private miembroIglesiaService: MiembroIglesiaService,
    private dialogRef: MatDialogRef<DesignarColaboradorComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { iglesiaId: number, iglesiaNombre: string }
  ) {
    this.cargoForm = this.fb.group({
      rolCargoId: ['', Validators.required],
      iglesiaId: [this.data?.iglesiaId || '', Validators.required],
      idMiembro: ['', Validators.required],
      fechaInicio: [new Date(), Validators.required],
      fechaFin: [''],
      detalle: ['', Validators.maxLength(500)]
    });
  }

  ngOnInit() {
    this.loadData();
    
    // Suscribirse a cambios del miembro seleccionado para validar si ya tiene cargo activo
    this.cargoForm.get('idMiembro')?.valueChanges.subscribe(miembroId => {
      this.checkMiembroCargo(Number(miembroId));
    });
  }

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

  loadData() {
    if (!this.data?.iglesiaId) return;
    this.loading = true;

    forkJoin({
      cargos: this.tipoCargoService.getTipoCargosParaColaboradores(),
      miembros: this.miembroIglesiaService.getMisMiembros(), // uses pastor's own church members safely
      colaboradores: this.cargoService.getMisColaboradores()
    }).subscribe({
      next: (res: any) => {
        this.tiposCargo = (res.cargos?.datos || []).filter((tc: any) => tc.estado);
        this.miembros = res.miembros?.datos || [];
        
        // Mapear los colaboradores recibidos
        this.cargosActivos = res.colaboradores?.datos || [];
        this.cargosActivos.forEach((c: any) => {
          if (c.rolCargo && !c.tipoCargoDto) {
            c.tipoCargoDto = c.rolCargo;
          }
        });

        this.filteredMiembros = [...this.miembros];
        this.loading = false;
      },
      error: (err) => {
        console.error('[DesignarColaborador] Error loading initialization data:', err);
        this.loading = false;
      }
    });
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
    if (this.cargoForm.valid && !this.loading) {
      this.loading = true;
      const cargoData: Partial<Cargo> = this.cargoForm.getRawValue();
      this.cargoService.createCargo(cargoData).subscribe({
        next: (response: any) => {
          const cargoId = response.datos?.id;
          if (this.selectedFile && cargoId) {
            this.cargoService.uploadActaAsignacion(cargoId, this.selectedFile).subscribe({
              next: () => {
                this.loading = false;
                this.dialogRef.close(true);
              },
              error: () => {
                this.loading = false;
                this.dialogRef.close(true); // Close true anyway since the cargo was created
              }
            });
          } else {
            this.loading = false;
            this.dialogRef.close(true);
          }
        },
        error: (err) => {
          console.error('[DesignarColaborador] Error creating cargo:', err);
          this.loading = false;
          const errorMsg = err.error?.message || 'Error al guardar el colaborador. Si el problema persiste, por favor contacte con soporte técnico.';
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
