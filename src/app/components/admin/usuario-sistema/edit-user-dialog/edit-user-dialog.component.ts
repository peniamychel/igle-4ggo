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

  get hasChanges(): boolean {
    const basicDetailsChanged =
      this.userForm.value.username !== this.data.username ||
      this.userForm.value.email !== this.data.email ||
      this.userForm.value.miembroId !== this.data.miembroId;

    const passwordChanged = this.changePassword && this.passwordForm.valid;

    return basicDetailsChanged || passwordChanged;
  }

  constructor(
    private dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: User,
    private fb: FormBuilder,
    private userService: UserService,
    private miembroService: MiembroService,
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
  }

  ngOnInit(): void {
    this.loadMiembros();
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

      const passwordChanged = this.changePassword && this.passwordForm.valid;

      let obs$ = of<any>(null);

      if (basicDetailsChanged) {
        // Get raw value to include disabled controls (name/apellidos)
        const formRaw = this.userForm.getRawValue();
        const updateUserData = {
          id: this.data.id,
          username: formRaw.username,
          email: formRaw.email,
          name: formRaw.name,
          apellidos: formRaw.apellidos,
          miembroId: formRaw.miembroId
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
