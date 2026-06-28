import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../../../core/services/user.service';
import { MiembroService } from '../../../../core/services/miembro.service';
import { PrivilegioService } from '../../../../core/services/privilegio.service';
import { PrivilegioDto } from '../../../../core/models/interfaces/privilegio.interface';
import { Miembro } from '../../../../core/models/miembro.model';
import { User } from '../../../../core/models/user.model';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-edit-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSelectModule,
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
  miembros: Miembro[] = [];
  todosPrivilegios: PrivilegioDto[] = [];
  selectedPrivilegioIds: Set<number> = new Set<number>();

  modules = [
    { key: 'Usuarios', name: 'Usuarios', viewPrivilege: 'Ver Usuarios', writePrivilege: 'Escribir Usuarios', icon: 'switch_account', desc: 'Gestionar acceso al sistema' },
    { key: 'Miembros', name: 'Miembros', viewPrivilege: 'Ver Miembros', writePrivilege: 'Escribir Miembros', icon: 'people', desc: 'Gestionar feligreses y registros' },
    { key: 'Iglesias', name: 'Iglesias', viewPrivilege: 'Ver Iglesias', writePrivilege: 'Escribir Iglesias', icon: 'church', desc: 'Administrar templos y anexos' },
    { key: 'MiembroIglesia', name: 'Membresías', viewPrivilege: 'Ver MiembroIglesia', writePrivilege: 'Escribir MiembroIglesia', icon: 'recent_actors', desc: 'Asignaciones y traslados' },
    { key: 'Cargos', name: 'Cargos y Roles', viewPrivilege: 'Ver Cargos', writePrivilege: 'Escribir Cargos', icon: 'work', desc: 'Asignación de cargos' },
    { key: 'Eventos', name: 'Eventos', viewPrivilege: 'Ver Eventos', writePrivilege: 'Escribir Eventos', icon: 'event', desc: 'Planificación de actividades' },
    { key: 'Certificados', name: 'Certificados', viewPrivilege: 'Ver Certificados', writePrivilege: 'Escribir Certificados', icon: 'workspace_premium', desc: 'Emisión de constancias' },
    { key: 'Privilegios', name: 'Privilegios', viewPrivilege: 'Ver Privilegios', writePrivilege: 'Escribir Privilegios', icon: 'vpn_key', desc: 'Políticas y permisos' }
  ];

  get hasChanges(): boolean {
    const basicDetailsChanged =
      this.userForm.value.username !== this.data.username ||
      this.userForm.value.email !== this.data.email ||
      this.userForm.value.miembroId !== this.data.miembroId;

    const passwordChanged = this.changePassword && this.passwordForm.valid;

    const originalIds = new Set(this.data.privilegios?.map(p => p.id).filter(id => id !== undefined) || []);
    let privilegesChanged = originalIds.size !== this.selectedPrivilegioIds.size;
    if (!privilegesChanged) {
      for (const id of this.selectedPrivilegioIds) {
        if (!originalIds.has(id)) {
          privilegesChanged = true;
          break;
        }
      }
    }

    return basicDetailsChanged || passwordChanged || privilegesChanged;
  }

  constructor(
    private dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: User,
    private fb: FormBuilder,
    private userService: UserService,
    private miembroService: MiembroService,
    private privilegioService: PrivilegioService,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      miembroId: [data.miembroId || '', Validators.required],
      username: [data.username, [Validators.required]],
      email: [data.email, [Validators.required, Validators.email]],
      name: [{ value: data.name || '', disabled: true }, Validators.required],
      apellidos: [{ value: data.apellidos || '', disabled: true }, Validators.required]
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });

    if (data.privilegios) {
      data.privilegios.forEach(p => {
        if (p.id) this.selectedPrivilegioIds.add(p.id);
      });
    }
  }

  ngOnInit(): void {
    this.loadMiembros();
    this.loadPrivileges();
    this.userForm.get('miembroId')?.valueChanges.subscribe(miembroId => {
      const selectedMiembro = this.miembros.find(m => m.id === miembroId);
      if (selectedMiembro) {
        this.userForm.patchValue({
          name: selectedMiembro.nombre,
          apellidos: selectedMiembro.apellido
        });
      } else {
        this.userForm.patchValue({
          name: '',
          apellidos: ''
        });
      }
    });
  }

  loadPrivileges(): void {
    this.privilegioService.getAll().subscribe({
      next: (privs) => {
        this.todosPrivilegios = privs;
      },
      error: (err) => {
        console.error('Error al cargar privilegios:', err);
      }
    });
  }

  getPrivilegeIdByName(name: string): number | undefined {
    return this.todosPrivilegios.find(p => p.nombre === name)?.id;
  }

  isPrivilegeSelected(name: string): boolean {
    const id = this.getPrivilegeIdByName(name);
    return id ? this.selectedPrivilegioIds.has(id) : false;
  }

  togglePrivilegeSelection(name: string): void {
    const id = this.getPrivilegeIdByName(name);
    if (!id) return;
    if (this.selectedPrivilegioIds.has(id)) {
      this.selectedPrivilegioIds.delete(id);
      if (name.startsWith('Ver ')) {
        const writeName = name.replace('Ver ', 'Escribir ');
        const writeId = this.getPrivilegeIdByName(writeName);
        if (writeId) {
          this.selectedPrivilegioIds.delete(writeId);
        }
      }
    } else {
      this.selectedPrivilegioIds.add(id);
      if (name.startsWith('Escribir ')) {
        const viewName = name.replace('Escribir ', 'Ver ');
        const viewId = this.getPrivilegeIdByName(viewName);
        if (viewId) {
          this.selectedPrivilegioIds.add(viewId);
        }
      }
    }
  }

  loadMiembros(): void {
    this.miembroService.getMiembros().subscribe({
      next: (response) => {
        this.miembros = response.datos.filter(m => m.estado);
      },
      error: (error) => {
        console.error('Error al cargar miembros:', error);
        this.snackBar.open('Error al cargar miembros', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.valid && (!this.changePassword || this.passwordForm.valid)) {
      const basicDetailsChanged =
        this.userForm.value.username !== this.data.username ||
        this.userForm.value.email !== this.data.email ||
        this.userForm.value.miembroId !== this.data.miembroId;

      const originalIds = new Set(this.data.privilegios?.map(p => p.id).filter(id => id !== undefined) || []);
      let privilegesChanged = originalIds.size !== this.selectedPrivilegioIds.size;
      if (!privilegesChanged) {
        for (const id of this.selectedPrivilegioIds) {
          if (!originalIds.has(id)) {
            privilegesChanged = true;
            break;
          }
        }
      }

      const passwordChanged = this.changePassword && this.passwordForm.valid;

      let obs$ = of<any>(null);

      if (basicDetailsChanged || privilegesChanged) {
        const formRaw = this.userForm.getRawValue();
        const updateUserData = {
          id: this.data.id!,
          username: formRaw.username,
          email: formRaw.email,
          name: formRaw.name,
          apellidos: formRaw.apellidos,
          miembroId: formRaw.miembroId,
          privilegioIds: Array.from(this.selectedPrivilegioIds)
        };
        obs$ = obs$.pipe(switchMap(() => this.userService.updateUser(updateUserData)));
      }

      if (passwordChanged) {
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
