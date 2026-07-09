import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { UserService } from '../../../../core/services/user.service';
import { CargoService } from '../../../../core/services/cargo.service';
import { MiembroService } from '../../../../core/services/miembro.service';
import { ServicioService } from '../../../../core/services/servicio.service';
import { TipoCargoService } from '../../../../core/services/tipo-cargo.service';
import { ServicioDto } from '../../../../core/models/interfaces/servicio.interface';
import { TipoCargo } from '../../../../core/models/tipo-cargo.model';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';

export interface MiembroCargoOption {
  id: number;
  nombreCompleto: string;
  nombre: string;
  apellido: string;
  ci?: number | string;
  cargoNombre?: string;
  rolCargoId?: number;
  nombreRol?: string;
}

@Component({
  selector: 'app-create-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    ImageUrlPipe
  ],
  templateUrl: './create-user-dialog.component.html',
  styleUrls: ['./create-user-dialog.component.css']
})
export class CreateUserDialogComponent implements OnInit {
  userForm: FormGroup;
  hidePassword = true;
  miembrosCargoOptions: MiembroCargoOption[] = [];

  // Servicios & Acciones
  servicios: ServicioDto[] = [];
  rolesDisponibles: TipoCargo[] = [];
  selectedRolBaseKey: string = '';
  selectedRolId: number | null = null;
  selectedAccionIds: Set<number> = new Set<number>();

  constructor(
    private dialogRef: MatDialogRef<CreateUserDialogComponent>,
    private fb: FormBuilder,
    private userService: UserService,
    private cargoService: CargoService,
    private miembroService: MiembroService,
    private servicioService: ServicioService,
    private tipoCargoService: TipoCargoService,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      miembroId: ['', [Validators.required]],
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      apellidos: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  ngOnInit(): void {
    this.loadData();

    this.userForm.get('miembroId')?.valueChanges.subscribe(miembroId => {
      if (!miembroId) return;

      const selected = this.miembrosCargoOptions.find(m => m.id === miembroId);
      if (selected) {
        this.userForm.patchValue({
          name: selected.nombre,
          apellidos: selected.apellido
        });

        if (selected.rolCargoId) {
          const matchingRol = this.rolesDisponibles.find(r => r.id === selected.rolCargoId);
          if (matchingRol) {
            this.selectRol(matchingRol);
          }
        } else if (selected.nombreRol) {
          const matchingRol = this.rolesDisponibles.find(
            r => (r.nombreRol || r.nombre || '').toUpperCase() === selected.nombreRol?.toUpperCase()
          );
          if (matchingRol) {
            this.selectRol(matchingRol);
          }
        }
      }
    });
  }

  loadData(): void {
    forkJoin({
      servicios: this.servicioService.getAll(),
      roles: this.tipoCargoService.getTipoCargos(),
      cargos: this.cargoService.getCargos(),
      miembros: this.miembroService.getMiembros(),
      users: this.userService.getAllUsers()
    }).subscribe({
      next: ({ servicios, roles, cargos, miembros, users }) => {
        this.servicios = servicios;
        this.rolesDisponibles = (roles.datos || []).filter(r => r.estado !== false);

        // IDs de miembros que YA poseen usuario
        const assignedMemberIds = new Set<number>(
          (users.datos || [])
            .map(u => Number(u.miembroId))
            .filter(id => id !== null && id !== undefined && !isNaN(id))
        );

        // Mapa de miembros indexado por ID
        const miembrosMap = new Map<number, any>();
        (miembros.datos || []).forEach(m => {
          if (m.id) miembrosMap.set(m.id, m);
        });

        // Filtrar miembros con cargo activo que AÚN NO tienen usuario
        const mapMiembrosOpciones = new Map<number, MiembroCargoOption>();
        (cargos.datos || []).forEach((c: any) => {
          const mId = c.idMiembro || c.miembro?.id || c.miembroDto?.id;
          if (mId && c.estado !== false) {
            if (!assignedMemberIds.has(mId)) {
              if (!mapMiembrosOpciones.has(mId)) {
                const miembroInfo = c.miembro || c.miembroDto || miembrosMap.get(mId);
                const nombre = miembroInfo?.nombre || '';
                const apellido = miembroInfo?.apellido || '';
                const ci = miembroInfo?.ci;
                const cargoNombre = c.rolCargo?.nombre || c.tipoCargoDto?.nombre || c.tipoCargoDto?.nombreRol || c.detalle || 'Cargo Asignado';
                const rolCargoId = c.rolCargoId || c.rolCargo?.id || c.tipoCargoDto?.id;
                const nombreRol = c.rolCargo?.nombre || c.tipoCargoDto?.nombreRol || c.tipoCargoDto?.nombre;

                mapMiembrosOpciones.set(mId, {
                  id: mId,
                  nombre: nombre,
                  apellido: apellido,
                  nombreCompleto: (nombre || apellido) ? `${nombre} ${apellido}`.trim() : `Miembro #${mId}`,
                  ci: ci,
                  cargoNombre: cargoNombre,
                  rolCargoId: rolCargoId,
                  nombreRol: nombreRol
                });
              }
            }
          }
        });

        this.miembrosCargoOptions = Array.from(mapMiembrosOpciones.values());

        // Si existen miembros con cargo elegibles, seleccionar automáticamente el primero de la lista
        if (this.miembrosCargoOptions.length > 0) {
          this.userForm.patchValue({ miembroId: this.miembrosCargoOptions[0].id });
        }
      }
    });
  }

  selectRol(rol: TipoCargo): void {
    this.selectedRolBaseKey = rol.nombreRol || rol.nombre || 'ROL';
    this.selectedRolId = rol.id || null;

    if (rol.id) {
      this.servicioService.getAccionesByRolCargo(rol.id).subscribe({
        next: (acciones) => {
          if (acciones && acciones.length > 0) {
            this.selectedAccionIds = new Set(acciones.map(a => a.id).filter((id): id is number => id !== undefined));
          } else if ((rol.nombreRol || rol.nombre || '').toUpperCase().includes('ADMIN')) {
            this.selectAllAcciones();
          } else {
            this.selectedAccionIds.clear();
          }
        }
      });
    } else {
      this.selectedAccionIds.clear();
    }
  }

  isRolActive(rol: TipoCargo): boolean {
    if (this.selectedRolId !== null && this.selectedRolId !== undefined) {
      return rol.id === this.selectedRolId;
    }
    if (this.selectedRolBaseKey) {
      const name = (rol.nombreRol || rol.nombre || '').toUpperCase();
      return name.includes(this.selectedRolBaseKey.toUpperCase());
    }
    return false;
  }

  getRoleIcon(nombreRol: string = ''): string {
    const key = nombreRol.toUpperCase();
    if (key.includes('ADMIN')) return 'admin_panel_settings';
    if (key.includes('PASTOR')) return 'auto_awesome';
    if (key.includes('IGLESIA') || key.includes('ENCARGADO')) return 'church';
    if (key.includes('TESORERO') || key.includes('FINANZA')) return 'account_balance';
    if (key.includes('SECRETARIO')) return 'description';
    if (key.includes('JOVEN') || key.includes('LIDER')) return 'groups';
    return 'badge';
  }

  selectAllAcciones(): void {
    const allIds = new Set<number>();
    this.servicios.forEach(s => {
      s.acciones?.forEach(a => {
        if (a.id) allIds.add(a.id);
      });
    });
    this.selectedAccionIds = allIds;
  }

  isAccionSelected(accionId: number | undefined): boolean {
    if (!accionId) return false;
    return this.selectedAccionIds.has(accionId);
  }

  hasServiceAccessForRole(servicio: ServicioDto): boolean {
    if (!servicio.acciones) return false;
    return servicio.acciones.some(a => this.isAccionSelected(a.id));
  }

  toggleAccion(accionId: number | undefined): void {
    if (!accionId) return;
    if (this.selectedAccionIds.has(accionId)) {
      this.selectedAccionIds.delete(accionId);
    } else {
      this.selectedAccionIds.add(accionId);
    }
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const userData = this.userForm.getRawValue();
      userData.roles = [this.selectedRolBaseKey];

      this.userService.createUser(userData).subscribe({
        next: () => {
          this.snackBar.open('Usuario creado exitosamente con sus permisos de servicio', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          let errorMsg = 'Error al crear usuario';
          if (error?.error?.message) {
            errorMsg = error.error.message;
          }
          this.snackBar.open(errorMsg, 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
