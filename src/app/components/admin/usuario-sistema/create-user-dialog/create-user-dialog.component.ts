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

  constructor(
    private dialogRef: MatDialogRef<CreateUserDialogComponent>,
    private fb: FormBuilder,
    private userService: UserService,
    private miembroService: MiembroService,
    private cargoService: CargoService,
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
    forkJoin({
      miembros: this.miembroService.getMiembros(),
      cargos: this.cargoService.getCargos(),
      usuarios: this.userService.getAllUsers()
    }).subscribe({
      next: (result) => {
        const activeMembers = result.miembros.datos.filter(m => m.estado);
        const assignedMemberIds = result.usuarios.datos
          .map(u => u.miembroId)
          .filter(id => id !== null && id !== undefined);
        const membersWithCargoIds = result.cargos.datos
          .filter(c => c.estado)
          .map(c => c.idMiembro);

        this.miembros = activeMembers.filter(m =>
          membersWithCargoIds.includes(m.id!) && !assignedMemberIds.includes(m.id!)
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
      // Get raw value to include disabled inputs (name and apellidos)
      const userData = this.userForm.getRawValue();

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
