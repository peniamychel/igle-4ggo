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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MiembroIglesiaService } from '../../../../../core/services/miembro-iglesia.service';
import { IglesiaService } from '../../../../../core/services/iglesia.service';
import { MiembroService } from '../../../../../core/services/miembro.service';
import { CargoService } from '../../../../../core/services/cargo.service';
import { Iglesia } from '../../../../../core/models/iglesia.model';
import { Miembro } from '../../../../../core/models/miembro.model';
import { Cargo } from '../../../../../core/models/cargo.model';
import { forkJoin } from 'rxjs';

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
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './miembro-iglesia-form.component.html',
  styleUrls: ['./miembro-iglesia-form.component.css']
})
export class MiembroIglesiaFormTraspasoComponent implements OnInit {
  form: FormGroup;
  iglesias: Iglesia[] = [];
  miembros: Miembro[] = [];
  cargos: Cargo[] = [];
  allMemberships: any[] = [];
  allChurches: Iglesia[] = [];
  
  resolvedOriginIglesia?: Iglesia;
  selectedDestinoIglesia?: Iglesia;
  selectedFile: File | null = null;
  selectedFileName: string = '';

  constructor(
    private fb: FormBuilder,
    private miembroIglesiaService: MiembroIglesiaService,
    private iglesiaService: IglesiaService,
    private miembroService: MiembroService,
    private cargoService: CargoService,
    private dialogRef: MatDialogRef<MiembroIglesiaFormTraspasoComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: {
      miembro?: Miembro;
      iglesia?: Iglesia;
      isEdit?: boolean;
      miembroIglesia?: any;
    }
  ) {
    const isEdit = this.data?.isEdit || false;
    const req = this.data?.miembroIglesia;

    this.form = this.fb.group({
      miembroId: [this.data?.miembro?.id || '', Validators.required],
      iglesiaId: [req?.iglesiaDestinoId || '', Validators.required],
      motivoTraspaso: [req?.motivoTraspaso || '', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      fechaTraspaso: [req?.fechaTraspaso ? new Date(req.fechaTraspaso) : new Date(), Validators.required],
      uriCartaTraspaso: [req?.uriCartaTraspaso || '']
    });

    if (isEdit && req?.uriCartaTraspaso) {
      const parts = req.uriCartaTraspaso.split('/');
      this.selectedFileName = parts[parts.length - 1];
    }
  }

  ngOnInit() {
    const requests: any = {
      cargos: this.cargoService.getCargos(),
      memberships: this.miembroIglesiaService.getMiembrosIglesia()
    };
    
    if (!this.data?.iglesia?.id) {
      requests.iglesias = this.iglesiaService.getIglesias();
    }

    forkJoin(requests).subscribe({
      next: (res: any) => {
        this.cargos = res.cargos.datos || [];
        this.allMemberships = res.memberships.datos || [];
        if (res.iglesias) {
          this.allChurches = res.iglesias.datos?.filter((i: any) => i.estado) || [];
        }

        // Suscribirse a cambios en el miembro seleccionado
        this.form.get('miembroId')?.valueChanges.subscribe(miembroId => {
          if (miembroId) {
            this.resolveOriginChurch(miembroId);
          } else {
            if (this.data?.iglesia?.id) {
              this.resolvedOriginIglesia = undefined;
            }
            this.iglesias = [];
            this.selectedDestinoIglesia = undefined;
            this.form.patchValue({ iglesiaId: '' });
          }
        });

        // Si ya hay un miembro pre-seleccionado de entrada
        const initialMiembroId = this.form.get('miembroId')?.value;
        if (initialMiembroId) {
          this.resolveOriginChurch(initialMiembroId);
        }

        this.loadMiembros();
      },
      error: (err) => {
        console.error('Error al cargar datos del modal de traspaso', err);
      }
    });
  }

  loadMiembros() {
    const originId = this.data?.iglesia?.id || this.resolvedOriginIglesia?.id;
    if (!originId) {
      this.miembros = [];
      return;
    }

    this.miembroService.getMiembros().subscribe(response => {
      const activeMemberships = this.allMemberships.filter(mi => mi.iglesiaId === originId && mi.estado);
      const activeMiembroIds = activeMemberships.map(mi => mi.miembroId);
      const membersOfChurch = response.datos.filter(m => activeMiembroIds.includes(m.id!) && m.estado);
      
      // Excluir a los miembros que tengan algún cargo activo en esta iglesia de origen
      this.miembros = membersOfChurch.filter(m => {
        const hasActiveCargo = this.cargos.some(c => 
          c.idMiembro === m.id && 
          c.iglesiaId === originId && 
          c.estado === true
        );
        return !hasActiveCargo;
      });
    });
  }

  onOriginChurchChange(churchId: number) {
    this.resolvedOriginIglesia = this.allChurches.find(c => c.id === churchId);
    
    // Limpiar selección previa de miembro e iglesia destino
    this.form.patchValue({
      miembroId: '',
      iglesiaId: ''
    });
    this.selectedDestinoIglesia = undefined;
    this.iglesias = [];

    if (this.resolvedOriginIglesia) {
      this.loadMiembros();
      this.loadIglesiasDestino(this.resolvedOriginIglesia.id!);
    }
  }

  resolveOriginChurch(miembroId: number) {
    if (this.data?.iglesia?.id) {
      this.resolvedOriginIglesia = this.data.iglesia;
      this.loadIglesiasDestino(this.data.iglesia.id);
      return;
    }

    const activeMembership = this.allMemberships.find(mi => mi.miembroId === miembroId && mi.estado);
    if (activeMembership) {
      this.iglesiaService.getIglesias().subscribe(response => {
        this.resolvedOriginIglesia = response.datos.find(i => i.id === activeMembership.iglesiaId);
        if (this.resolvedOriginIglesia) {
          this.loadIglesiasDestino(this.resolvedOriginIglesia.id!);
        }
      });
    } else {
      this.resolvedOriginIglesia = undefined;
      this.iglesias = [];
      this.selectedDestinoIglesia = undefined;
      this.form.patchValue({ iglesiaId: '' });
    }
  }

  loadIglesiasDestino(excludeIglesiaId: number) {
    this.iglesiaService.getIglesias().subscribe(response => {
      this.iglesias = response.datos.filter(i => i.estado && i.id !== excludeIglesiaId);
      
      const isEdit = this.data?.isEdit || false;
      const req = this.data?.miembroIglesia;
      if (isEdit && req?.iglesiaDestinoId) {
        this.selectedDestinoIglesia = this.iglesias.find(i => i.id === req.iglesiaDestinoId);
      }
    });
  }

  loadCargos() {
    this.cargoService.getCargos().subscribe(response => {
      this.cargos = response.datos || [];
    });
  }

  getPastorName(iglesiaId: number | undefined): string {
    if (!iglesiaId) return 'Pastor: Por asignar';
    const pastorCargo = this.cargos.find(c => 
      c.iglesiaId === iglesiaId && 
      c.estado && 
      c.tipoCargoDto?.nombre?.toLowerCase().includes('pastor')
    );
    return pastorCargo && pastorCargo.miembroDto 
      ? `Pastor: ${pastorCargo.miembroDto.nombre} ${pastorCargo.miembroDto.apellido}`
      : 'Pastor: Por asignar';
  }

  getIglesiaInitials(iglesia: Iglesia): string {
    let name = iglesia.nombre;
    if (name.toLowerCase().startsWith('iglesia ')) {
      name = name.substring(8);
    }
    return name.substring(0, 2).toUpperCase();
  }

  selectDestination(iglesia: Iglesia) {
    this.selectedDestinoIglesia = iglesia;
    this.form.patchValue({ iglesiaId: iglesia.id });
    this.form.get('iglesiaId')?.markAsTouched();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
      this.form.patchValue({
        uriCartaTraspaso: file.name
      });
      this.form.get('uriCartaTraspaso')?.markAsTouched();
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.form.patchValue({
      uriCartaTraspaso: ''
    });
  }

  onSubmit() {
    if (this.form.valid && this.resolvedOriginIglesia) {
      const isEdit = this.data?.isEdit || false;
      const req = this.data?.miembroIglesia;

      const payload: any = {
        miembroId: this.form.getRawValue().miembroId,
        iglesiaId: this.resolvedOriginIglesia.id,
        iglesiaDestinoId: this.form.value.iglesiaId,
        motivoTraspaso: this.form.value.motivoTraspaso,
        fechaTraspaso: this.form.value.fechaTraspaso,
        uriCartaTraspaso: req?.uriCartaTraspaso || ''
      };

      if (isEdit && req) {
        payload.id = req.id;
        payload.estado = req.estado;
        payload.estadoTraspaso = req.estadoTraspaso;
      }

      const requestObservable = isEdit
        ? this.miembroIglesiaService.updateMiembroIglesia(payload)
        : this.miembroIglesiaService.traspaso(payload);

      requestObservable.subscribe({
        next: (response) => {
          const requestId = response.datos?.id || req?.id;
          if (this.selectedFile && requestId) {
            this.miembroIglesiaService.uploadCartaTraspaso(requestId, this.selectedFile).subscribe({
              next: () => {
                this.dialogRef.close(true);
              },
              error: (err) => {
                console.error('Error al subir la carta de traspaso', err);
                this.dialogRef.close(true);
              }
            });
          } else {
            this.dialogRef.close(true);
          }
        },
        error: (err) => {
          console.error('Error al procesar el traspaso', err);
          const errorMsg = err.error?.message || 'Error al procesar el traspaso. Si el problema persiste, por favor contacte con soporte técnico.';
          this.snackBar.open(errorMsg, 'Cerrar', { duration: 5000 });
        }
      });
    }
  }
}
