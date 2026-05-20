import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { UserService } from '../../core/services/user.service';
import { ImagePreviewDialogComponent } from '../admin/usuario-sistema/imagen-preview-dialog/image-preview-dialog.component';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatDividerModule,
  ],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit, OnDestroy {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  hideCurrentPassword = true;
  hideNewPassword = true;
  changePassword = false;
  loading = true;
  saving = false;

  user: {
    id?: number;
    email: string;
    username: string;
    name: string;
    apellidos: string;
    uriFoto: string;
    roles: string[];
  } | null = null;

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      apellidos: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  ngOnDestroy() {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  loadUserProfile() {
    this.loading = true;
    this.userService.getUserByNameForToken().subscribe({
      next: (response: any) => {
        const datos = response.datos || response;
        this.user = {
          id: datos.id,
          email: datos.email,
          username: datos.username,
          name: datos.name || '',
          apellidos: datos.apellidos || '',
          uriFoto: datos.uriFoto || '',
          roles: datos.roles?.map((r: any) => typeof r === 'string' ? r : r.name) || [],
        };
        this.profileForm.patchValue({
          name: this.user.name,
          apellidos: this.user.apellidos,
          username: this.user.username,
          email: this.user.email,
        });
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar perfil', 'Cerrar', { duration: 3000, panelClass: ['error-snackbar'] });
        this.loading = false;
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl);
      }
      this.selectedFile = file;
      this.previewUrl = URL.createObjectURL(file);
    }
  }

  openImagePreview() {
    const imageUrl = this.previewUrl || this.user?.uriFoto;
    if (imageUrl) {
      this.dialog.open(ImagePreviewDialogComponent, {
        data: { imageUrl, alt: this.user?.username || 'Foto' },
        maxWidth: '100vw',
        maxHeight: '100vh',
        panelClass: 'image-preview-dialog'
      });
    }
  }

  saveProfile() {
    if (this.profileForm.invalid || !this.user?.id) return;
    this.saving = true;

    const updateData = {
      id: this.user.id,
      username: this.profileForm.value.username,
      email: this.profileForm.value.email,
      name: this.profileForm.value.name,
      apellidos: this.profileForm.value.apellidos,
    };

    this.userService.updateUser(updateData).pipe(
      switchMap(() => {
        if (this.selectedFile && this.user?.id) {
          return this.userService.uploadUserPhoto(this.user.id, this.selectedFile);
        }
        return of(null);
      }),
      switchMap(() => {
        if (this.changePassword && this.passwordForm.valid && this.user?.id) {
          return this.userService.changePassword({
            id: this.user.id,
            currentPassword: this.passwordForm.value.currentPassword,
            newPassword: this.passwordForm.value.newPassword,
          });
        }
        return of(null);
      })
    ).subscribe({
      next: () => {
        this.snackBar.open('Perfil actualizado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.saving = false;
        this.changePassword = false;
        this.passwordForm.reset();
        this.selectedFile = null;
        this.previewUrl = null;
        this.loadUserProfile();
      },
      error: () => {
        this.snackBar.open('Error al actualizar perfil', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.saving = false;
      }
    });
  }

  getInitials(): string {
    if (this.user?.name) {
      return this.user.name.charAt(0).toUpperCase();
    }
    return this.user?.username?.charAt(0).toUpperCase() || '?';
  }
}
