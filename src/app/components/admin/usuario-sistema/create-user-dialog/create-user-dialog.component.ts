import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../../../core/services/user.service';

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
    FormsModule,
    ReactiveFormsModule,
    MatSnackBarModule
  ],
  templateUrl: './create-user-dialog.component.html',
  styleUrls: ['./create-user-dialog.component.css']
})
export class CreateUserDialogComponent {
  userForm: FormGroup;
  hidePassword = true;
  availableRoles = ['ADMIN', 'ENCARGADO_IGLESIA', 'ENCARGADO_EVENTO'];
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<CreateUserDialogComponent>,
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      apellidos: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(4)]],
      roles: this.fb.array(this.availableRoles.map(() => false))
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl);
      }
      this.selectedFile = file;
      this.previewUrl = URL.createObjectURL(file);
    }
  }

  ngOnDestroy(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const selectedRoles = this.availableRoles.filter((_, i) =>
        this.userForm.get('roles')?.value[i]
      );

      const userData = {
        ...this.userForm.value,
        roles: selectedRoles,
        uriFoto: ''
      };

      this.userService.createUser(userData).subscribe({
        next: (response) => {
          if (this.selectedFile && response.datos.id) {
            this.userService.uploadUserPhoto(response.datos.id, this.selectedFile).subscribe({
              next: () => {
                this.snackBar.open('Usuario creado exitosamente', 'Cerrar', {
                  duration: 3000,
                  panelClass: ['success-snackbar']
                });
                this.dialogRef.close(true);
              },
              error: () => {
                this.snackBar.open('Error al subir la foto', 'Cerrar', {
                  duration: 3000,
                  panelClass: ['error-snackbar']
                });
                this.dialogRef.close(true);
              }
            });
          } else {
            this.snackBar.open('Usuario creado exitosamente', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.dialogRef.close(true);
          }
        },
        error: (error) => {
          this.snackBar.open('Error al crear usuario', 'Cerrar', {
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
