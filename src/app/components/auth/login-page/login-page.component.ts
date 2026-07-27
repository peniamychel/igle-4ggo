import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/security/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {
  loginForm: FormGroup;
  hidePassword = true;
  loading = false;
  error: string = '';

  requiresSelection = false;
  preAuthToken = '';
  iglesias: any[] = [];

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private themeService = inject(ThemeService);

  isDarkMode = this.themeService.isDarkMode;

  // Cuentas demo ocultas temporalmente. Para reactivarlas, descomentar los objetos
  // de abajo (el @if del template las muestra automáticamente cuando el array no está vacío).
  demoAccounts: { username: string; password: string; title: string; subtitle: string; icon: string; badge: string; }[] = environment.production ? [] : [
    {
      username: 'admin',
      password: '123456',
      title: 'Administrador',
      subtitle: 'Superusuario · Acceso total',
      icon: 'security',
      badge: 'admin'
    },
    {
      username: 'romina',
      password: '123456',
      title: 'Pastora Romina',
      subtitle: 'Pastor · Acceso Iglesias',
      icon: 'church',
      badge: 'romina'
    },
    {
      username: 'salo',
      password: '123456',
      title: 'Pastor Salome',
      subtitle: 'Pastor · Acceso Eventos',
      icon: 'church',
      badge: 'marcelo'
    }
  ];

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          if (response.requiresSelection) {
            this.requiresSelection = true;
            this.preAuthToken = response.preAuthToken || '';
            this.iglesias = response.iglesias || [];
            this.loading = false;
          } else {
            this.router.navigate(['/inicio']);
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'Usuario o contraseña incorrectos';
          this.loading = false;
        }
      });
    }
  }

  loginWithDemo(account: any): void {
    if (this.loading) return;
    this.loginForm.patchValue({
      username: account.username,
      password: account.password
    });
    this.onSubmit();
  }

  onSelectIglesia(iglesiaId: number): void {
    this.loading = true;
    this.authService.selectCargo(this.preAuthToken, iglesiaId).subscribe({
      next: () => {
        this.router.navigate(['/inicio']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al seleccionar congregación';
        this.loading = false;
      }
    });
  }

  cancelSelection(): void {
    this.requiresSelection = false;
    this.preAuthToken = '';
    this.iglesias = [];
    this.error = '';
  }
}
