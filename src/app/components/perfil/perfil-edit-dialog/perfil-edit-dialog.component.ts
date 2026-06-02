import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

export interface ProfileEditData {
  id?: number;
  email: string;
  username: string;
  name: string | null;
  apellidos: string | null;
  uriFoto: string | null;
  roles: string[];
}

@Component({
  selector: 'app-perfil-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatSnackBarModule,
    FormsModule,
    ReactiveFormsModule,
    ImageUrlPipe,
  ],
  templateUrl: './perfil-edit-dialog.component.html',
  styleUrls: ['./perfil-edit-dialog.component.css']
})
export class PerfilEditDialogComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  hideCurrentPassword = true;
  hideNewPassword = true;
  changePassword = false;
  saving = false;

  private originalProfile = {
    name: '',
    apellidos: '',
    username: '',
    email: ''
  };

  get hasChanges(): boolean {
    const profileChanged =
      this.profileForm.value.name !== this.originalProfile.name ||
      this.profileForm.value.apellidos !== this.originalProfile.apellidos ||
      this.profileForm.value.username !== this.originalProfile.username ||
      this.profileForm.value.email !== this.originalProfile.email;

    const photoChanged = !!this.selectedFile;
    const passwordChanged = this.changePassword && this.passwordForm.valid;

    return profileChanged || photoChanged || passwordChanged;
  }

  constructor(
    private dialogRef: MatDialogRef<PerfilEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProfileEditData,
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      name: [data.name, Validators.required],
      apellidos: [data.apellidos, Validators.required],
      username: [data.username, Validators.required],
      email: [data.email, [Validators.required, Validators.email]],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit() {
    this.originalProfile = {
      name: this.data.name || '',
      apellidos: this.data.apellidos || '',
      username: this.data.username,
      email: this.data.email,
    };
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto() {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  onSubmit() {
    if (this.profileForm.invalid) return;

    const profileChanged =
      this.profileForm.value.name !== this.originalProfile.name ||
      this.profileForm.value.apellidos !== this.originalProfile.apellidos ||
      this.profileForm.value.username !== this.originalProfile.username ||
      this.profileForm.value.email !== this.originalProfile.email;

    const photoChanged = !!this.selectedFile;
    const passwordChanged = this.changePassword && this.passwordForm.valid;

    if (!profileChanged && !photoChanged && !passwordChanged) {
      this.snackBar.open('No se detectaron cambios', 'Cerrar', { duration: 3000 });
      return;
    }

    this.saving = true;

    let obs$ = of<any>(null);

    if (profileChanged) {
      obs$ = obs$.pipe(switchMap(() => this.userService.updateUser({
        id: this.data.id,
        username: this.profileForm.value.username,
        email: this.profileForm.value.email,
        name: this.profileForm.value.name,
        apellidos: this.profileForm.value.apellidos,
      })));
    }

    if (photoChanged) {
      obs$ = obs$.pipe(switchMap(() => this.userService.uploadUserPhoto(this.data.id!, this.selectedFile!)));
    }

    if (passwordChanged) {
      obs$ = obs$.pipe(switchMap(() => this.userService.changePassword({
        id: this.data.id!,
        currentPassword: this.passwordForm.value.currentPassword,
        newPassword: this.passwordForm.value.newPassword,
      })));
    }

    obs$.subscribe({
      next: () => {
        this.snackBar.open('Perfil actualizado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        let errorMessage = 'Error al actualizar perfil';
        if (err?.error?.message) {
          if (typeof err.error.message === 'string') {
            errorMessage = err.error.message;
          } else if (typeof err.error.message === 'object') {
            const messages = Object.values(err.error.message).join(', ');
            if (messages) errorMessage = messages;
          }
        }
        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
        this.saving = false;
      }
    });
  }

  getInitials(): string {
    if (this.data?.name) {
      return this.data.name.charAt(0).toUpperCase();
    }
    return this.data?.username?.charAt(0).toUpperCase() || '?';
  }
}
