import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserService } from '../../core/services/user.service';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';
import { PerfilEditDialogComponent, ProfileEditData } from './perfil-edit-dialog/perfil-edit-dialog.component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    ImageUrlPipe,
  ],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  loading = true;

  user: ProfileEditData | null = null;

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadUserProfile();
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
          roles: datos.roles?.map((r: any) => typeof r === 'string' ? r : (r?.nombreRol || r?.nombre || r?.name || '')) || [],
        };
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar perfil', 'Cerrar', { duration: 3000, panelClass: ['error-snackbar'] });
        this.loading = false;
      }
    });
  }

  openEditDialog() {
    if (!this.user) return;

    const dialogRef = this.dialog.open(PerfilEditDialogComponent, {
      data: { ...this.user },
      width: '900px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUserProfile();
      }
    });
  }

  openImagePreview() {
    if (this.user?.uriFoto) {
      import('../admin/usuario-sistema/imagen-preview-dialog/image-preview-dialog.component').then(m => {
        this.dialog.open(m.ImagePreviewDialogComponent, {
          data: { imageUrl: this.user!.uriFoto, alt: this.user!.username },
          maxWidth: '100vw',
          maxHeight: '100vh',
          panelClass: 'image-preview-dialog'
        });
      });
    }
  }

  formatRole(role: string): string {
    const roleNames: Record<string, string> = {
      'ADMIN': 'Administrador',
      'ENCARGADO_IGLESIA': 'Enc. Iglesia',
      'ENCARGADO_EVENTO': 'Enc. Eventos',
      'TESORERO': 'Tesorero'
    };
    return roleNames[role] || role;
  }

  getInitials(): string {
    if (this.user?.name) {
      return this.user.name.charAt(0).toUpperCase();
    }
    return this.user?.username?.charAt(0).toUpperCase() || '?';
  }
}
