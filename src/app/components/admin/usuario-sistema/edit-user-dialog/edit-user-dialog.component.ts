import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { UserService } from '../../../../core/services/user.service';
import { CargoService } from '../../../../core/services/cargo.service';
import { MiembroService } from '../../../../core/services/miembro.service';
import { ServicioService } from '../../../../core/services/servicio.service';
import { TipoCargoService } from '../../../../core/services/tipo-cargo.service';
import { ServicioDto } from '../../../../core/models/interfaces/servicio.interface';
import { TipoCargo } from '../../../../core/models/tipo-cargo.model';
import { User } from '../../../../core/models/user.model';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { MiembroCargoOption } from '../create-user-dialog/create-user-dialog.component';

@Component({
  selector: 'app-edit-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    ImageUrlPipe
  ],
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.css']
})
export class EditUserDialogComponent implements OnInit {
  userForm: FormGroup;
  passwordForm: FormGroup;
  hideNewPassword = true;
  changePassword = false;
  miembrosCargoOptions: MiembroCargoOption[] = [];

  // Servicios & Acciones
  servicios: ServicioDto[] = [];
  rolesDisponibles: TipoCargo[] = [];
  selectedRolBaseKey: string = '';
  selectedRolId: number | null = null;
  selectedAccionIds: Set<number> = new Set<number>();

  constructor(
    private dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: User,
    private fb: FormBuilder,
    private userService: UserService,
    private cargoService: CargoService,
    private miembroService: MiembroService,
    private servicioService: ServicioService,
    private tipoCargoService: TipoCargoService,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      miembroId: [data.miembroId || ''],
      username: [data.username, [Validators.required]],
      email: [data.email, [Validators.required, Validators.email]],
      name: [data.name || '', Validators.required],
      apellidos: [data.apellidos || '', Validators.required]
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });

    if (data.acciones) {
      this.selectedAccionIds = new Set(data.acciones.map(a => a.id).filter((id): id is number => id !== undefined));
    }
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

        if (this.data.roles && this.data.roles.length > 0) {
          const firstRoleName = (this.data.roles[0].nombreRol || this.data.roles[0].name || this.data.roles[0].nombre || '').toUpperCase();
          const match = this.rolesDisponibles.find(r => (r.nombreRol || r.nombre || '').toUpperCase() === firstRoleName);
          if (match) {
            this.selectRol(match);
          }
        }

        if (!this.data.acciones || this.data.acciones.length === 0) {
          this.selectAllAcciones();
        }

        const currentMiembroId = Number(this.data.miembroId);
        const assignedMemberIds = new Set<number>(
          (users.datos || [])
            .map(u => Number(u.miembroId))
            .filter(id => id !== null && id !== undefined && !isNaN(id) && id !== currentMiembroId)
        );

        // Mapa de miembros indexado por ID
        const miembrosMap = new Map<number, any>();
        (miembros.datos || []).forEach(m => {
          if (m.id) miembrosMap.set(m.id, m);
        });

        const mapMiembrosOpciones = new Map<number, MiembroCargoOption>();
        (cargos.datos || []).forEach((c: any) => {
          const mId = c.idMiembro || c.miembro?.id || c.miembroDto?.id;
          if (mId && c.estado !== false) {
            if (!assignedMemberIds.has(mId) || mId === currentMiembroId) {
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
    if (this.userForm.valid && (!this.changePassword || this.passwordForm.valid)) {
      const formRaw = this.userForm.getRawValue();
      const updateUserData = {
        id: this.data.id!,
        username: formRaw.username,
        email: formRaw.email,
        name: formRaw.name,
        apellidos: formRaw.apellidos,
        miembroId: formRaw.miembroId ? formRaw.miembroId : null
      };

      let obs$ = this.userService.updateUser(updateUserData);

      if (this.changePassword && this.passwordForm.valid) {
        obs$ = obs$.pipe(switchMap(() => this.userService.resetPassword({
          id: this.data.id!,
          newPassword: this.passwordForm.value.newPassword
        })));
      }

      obs$.subscribe({
        next: () => {
          this.snackBar.open('Usuario actualizado exitosamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close(true);
        },
        error: (err: any) => {
          let errorMessage = 'Error al actualizar usuario';
          if (err?.error?.message) {
            if (typeof err.error.message === 'string') {
              errorMessage = err.error.message;
            } else if (typeof err.error.message === 'object') {
              const messages = Object.values(err.error.message).join(', ');
              if (messages) {
                errorMessage = messages;
              }
            }
          }
          this.snackBar.open(errorMessage, 'Cerrar', {
            duration: 4000,
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
