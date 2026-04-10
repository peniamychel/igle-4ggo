import {Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/security/auth.service';
import {routes} from '../../../app.routes';
import {Router} from '@angular/router';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.css']
})
export class LoginModalComponent {
  loginForm: FormGroup;
  hidePassword = true;
  error: string = '';

  private router: Router = inject(Router);


  constructor(
    private dialogRef: MatDialogRef<LoginModalComponent>,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.error = '';
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          this.dialogRef.close(true);
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.error = 'Usuario o contraseña incorrectos';
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
