import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../core/models/user.model';
import { ImagePreviewDialogComponent } from '../imagen-preview-dialog/image-preview-dialog.component';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface RoleDefinition {
  key: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

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
    FormsModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    ImageUrlPipe
  ],
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.css']
})
export class EditUserDialogComponent {
  userForm: FormGroup;
  passwordForm: FormGroup;
  selectedFile: File | null = null;
  hideNewPassword = true;
  changePassword = false;
  previewUrl: string | null = null;
  imageDeleted = false;

  roleDefinitions: RoleDefinition[] = [
    {
      key: 'ADMIN',
      label: 'Administrador',
      description: 'Acceso total al sistema y configuración',
      icon: 'shield',
      color: '#f44336'
    },
    {
      key: 'ENCARGADO_IGLESIA',
      label: 'Encargado de Iglesia',
      description: 'Gestión de miembros y actividades de la iglesia',
      icon: 'church',
      color: '#7c4dff'
    },
    {
      key: 'ENCARGADO_EVENTO',
      label: 'Encargado de Eventos',
      description: 'Organización y gestión de eventos',
      icon: 'event',
      color: '#00bfa5'
    },
    {
      key: 'TESORERO',
      label: 'Tesorero',
      description: 'Gestión financiera y donaciones',
      icon: 'account_balance',
      color: '#ff9800'
    }
  ];

  get availableRoles(): string[] {
    return this.roleDefinitions.map(r => r.key);
  }

  get hasChanges(): boolean {
    const basicDetailsChanged =
      this.userForm.value.username !== this.data.username ||
      this.userForm.value.email !== this.data.email ||
      this.userForm.value.name !== this.data.name ||
      this.userForm.value.apellidos !== this.data.apellidos;

    const originalRoles = this.data.roles.map(r => r.name);
    const selectedRoles = this.availableRoles.filter((_, i) =>
      this.userForm.get('roles')?.value[i]
    );
    const rolesChanged = selectedRoles.length !== originalRoles.length ||
      selectedRoles.some(r => !originalRoles.includes(r));

    const photoChanged = !!this.selectedFile;
    const photoDeleted = this.imageDeleted && !!this.data.uriFoto;
    const passwordChanged = this.changePassword && this.passwordForm.valid;

    return basicDetailsChanged || rolesChanged || photoChanged || photoDeleted || passwordChanged;
  }

  constructor(
    private dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: User,
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.userForm = this.fb.group({
      username: [data.username, [Validators.required]],
      email: [data.email, [Validators.required, Validators.email]],
      name: [data.name, Validators.required],
      apellidos: [data.apellidos, Validators.required],
      roles: this.fb.array(this.roleDefinitions.map(role =>
        data.roles.some(userRole => userRole.name === role.key)
      ))
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.imageDeleted = false;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  openImagePreview(): void {
    const imageUrl = this.previewUrl || this.data.uriFoto;
    if (imageUrl) {
      this.dialog.open(ImagePreviewDialogComponent, {
        data: { imageUrl, alt: this.data.username },
        maxWidth: '100vw',
        maxHeight: '100vh',
        panelClass: 'image-preview-dialog'
      });
    }
  }

  deletePhoto(): void {
    this.imageDeleted = true;
    this.selectedFile = null;
    this.previewUrl = null;
  }

  onSubmit(): void {
    if (this.userForm.valid && (!this.changePassword || this.passwordForm.valid)) {
      const selectedRoles = this.availableRoles.filter((_, i) =>
        this.userForm.get('roles')?.value[i]
      );

      const basicDetailsChanged =
        this.userForm.value.username !== this.data.username ||
        this.userForm.value.email !== this.data.email ||
        this.userForm.value.name !== this.data.name ||
        this.userForm.value.apellidos !== this.data.apellidos;

      const originalRoles = this.data.roles.map(r => r.name);
      const rolesChanged = selectedRoles.length !== originalRoles.length ||
        selectedRoles.some(r => !originalRoles.includes(r));

      const photoChanged = !!this.selectedFile;
      const photoDeleted = this.imageDeleted && this.data.uriFoto && !this.selectedFile;
      const passwordChanged = this.changePassword && this.passwordForm.valid;

      let obs$ = of<any>(null);

      if (basicDetailsChanged) {
        const updateUserData = {
          id: this.data.id,
          username: this.userForm.value.username,
          email: this.userForm.value.email,
          name: this.userForm.value.name,
          apellidos: this.userForm.value.apellidos
        };
        obs$ = obs$.pipe(switchMap(() => this.userService.updateUser(updateUserData)));
      }

      if (rolesChanged) {
        obs$ = obs$.pipe(switchMap(() => this.userService.updateUserRoles({
          id: this.data.id!,
          roles: selectedRoles
        })));
      }

      if (photoDeleted) {
        obs$ = obs$.pipe(switchMap(() => this.userService.deleteUserPhoto(this.data.id!)));
      }

      if (photoChanged) {
        obs$ = obs$.pipe(switchMap(() => this.userService.uploadUserPhoto(this.data.id!, this.selectedFile!)));
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
