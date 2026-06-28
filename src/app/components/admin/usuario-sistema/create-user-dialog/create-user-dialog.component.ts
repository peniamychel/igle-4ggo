import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../../../core/services/user.service';
import { MiembroService } from '../../../../core/services/miembro.service';
import { CargoService } from '../../../../core/services/cargo.service';
import { PrivilegioService } from '../../../../core/services/privilegio.service';
import { PrivilegioDto } from '../../../../core/models/interfaces/privilegio.interface';
import { Miembro } from '../../../../core/models/miembro.model';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-create-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatSelectModule,
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
  miembros: Miembro[] = [];
  todosPrivilegios: PrivilegioDto[] = [];
  selectedPrivilegioIds: Set<number> = new Set<number>();
  assignedMemberIds: number[] = [];

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

  constructor(
    private dialogRef: MatDialogRef<CreateUserDialogComponent>,
    private fb: FormBuilder,
    private userService: UserService,
    private miembroService: MiembroService,
    private cargoService: CargoService,
    private privilegioService: PrivilegioService,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      miembroId: ['', Validators.required],
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      name: [{ value: '', disabled: true }, Validators.required],
      apellidos: [{ value: '', disabled: true }, Validators.required],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
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

        // Validar si el miembro ya tiene una cuenta asignada
        if (this.assignedMemberIds.includes(Number(miembroId))) {
          this.userForm.get('miembroId')?.setErrors({ yaTieneUsuario: true });
        } else {
          // Limpiar error de yaTieneUsuario si no hay duplicación
          const control = this.userForm.get('miembroId');
          if (control?.errors && control.errors['yaTieneUsuario']) {
            const errors = { ...control.errors };
            delete errors['yaTieneUsuario'];
            control.setErrors(Object.keys(errors).length ? errors : null);
          }
        }
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
    forkJoin({
      miembros: this.miembroService.getMiembros(),
      cargos: this.cargoService.getCargos(),
      usuarios: this.userService.getAllUsers()
    }).subscribe({
      next: (result) => {
        const activeMembers = result.miembros.datos.filter(m => m.estado);
        this.assignedMemberIds = result.usuarios.datos
          .map(u => Number(u.miembroId))
          .filter(id => id !== null && id !== undefined && !isNaN(id));
        
        const membersWithCargoIds = result.cargos.datos
          .filter(c => c.estado)
          .map(c => Number(c.idMiembro));

        // Mostrar todos los miembros que tengan algún cargo
        this.miembros = activeMembers.filter(m =>
          membersWithCargoIds.includes(Number(m.id))
        );
      },
      error: (error) => {
        console.error('Error al cargar datos:', error);
        this.snackBar.open('Error al cargar el listado de miembros, cargos o usuarios', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const userData = {
        ...this.userForm.getRawValue(),
        privilegioIds: Array.from(this.selectedPrivilegioIds)
      };

      this.userService.createUser(userData).subscribe({
        next: (response) => {
          this.snackBar.open('Usuario creado exitosamente', 'Cerrar', {
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
