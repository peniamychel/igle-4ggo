import { Component, inject, OnInit, ViewChild } from '@angular/core';

import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../../core/services/security/auth.service';
import { LoginModalComponent } from '../../components/auth/login/login-modal.component';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '../../core/services/user.service';
import { CreateUserDto, SingleUserResponse, User, UserResponse } from '../../core/models/user.model';


interface MenuItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatDialogModule,
    RouterModule,
    MatTooltipModule,
  ],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent implements OnInit {
  @ViewChild('drawer') sidenav!: MatSidenav;
  isSmallScreen = false;
  username: string = '';
  isAuthenticated = false;
  errorMessage: string | null = null;

  user: CreateUserDto | null = null;

  private router = inject(Router);
  private breakpointObserver: BreakpointObserver = inject(BreakpointObserver);
  private authService: AuthService = inject(AuthService);
  private dialog: MatDialog = inject(MatDialog);
  private usuarioService = inject(UserService);
  private datosUsuario: any = JSON.parse(localStorage.getItem("datosUsuario") || '{}');


  menuItems: MenuItem[] = [
    { label: 'Inicio', route: '/', icon: 'home' },
    { label: 'Miembro', route: '/miembro', icon: 'wc' },
    { label: 'Persona', route: '/persona', icon: 'people' },
    { label: 'Iglesia', route: '/iglesia', icon: 'church' },
    { label: 'Eventos', route: '/eventos', icon: 'event' },
    { label: 'Iglesia Miembros', route: '/miembroiglesia', icon: 'recent_actors' },
    { label: 'Iglesia Grafico', route: '/graficoiglesias', icon: 'settings' },

    { label: 'Perfil', route: '/perfil', icon: 'event' },
    { label: 'Configuración', route: '/configuracion', icon: 'settings' },
    { label: 'Usuarios Sistema', route: '/usuariosistema', icon: 'switch_account' },
  ];
  constructor() {
  }

  filtrarMenuItems(): MenuItem[] {
    if (this.isAuthenticated && this.authService.isLoggedRolAdmin()) {
      return this.menuItems;
    } else {
      if (this.isAuthenticated && this.authService.isLoggedRolEncargado()) {
        return this.menuItems.filter(item =>

          item.route !== '/usuariosistema'
        );
      } else {
        return this.menuItems.filter(item => item.route === '/' || item.route === '/configuracion');
      }
    }
  }

  ngOnInit() {
    this.configureSidenavResponsive();
    this.initializeUserState();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && this.isSmallScreen && this.sidenav) {
        this.sidenav.close();
      }
    });
    this.getUserProfile();
  }

  private configureSidenavResponsive() {
    // Observa cambios en el tamaño de pantalla para ajustar la visualización del sidenav
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .subscribe(result => this.toggleSidenav(result.matches));
  }

  // private toggleSidenav(isSmallScreen: boolean) {
  //   this.isSmallScreen = isSmallScreen;
  //
  //   if (this.sidenav) {
  //     isSmallScreen ? this.sidenav.close() : this.sidenav.open();
  //   }
  // }

  private toggleSidenav(isSmallScreen: boolean) {
    this.isSmallScreen = isSmallScreen;

    if (this.sidenav) {
      this.sidenav.mode = isSmallScreen ? 'over' : 'side';
      if (!isSmallScreen) {
        this.sidenav.open();  // Asegura que esté abierto en pantallas grandes
      } else {
        this.sidenav.close(); // Cierra cuando cambia a pantalla pequeña
      }
    }
  }

  private initializeUserState() {
    this.authService.currentUser$.subscribe(user => {
      this.username = user?.username || '';
      this.isAuthenticated = !!user;
    });
  }

  openLoginModal() {
    const dialogRef = this.dialog.open(LoginModalComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Login successful
        console.log('Login successful');
        this.getUserProfile();
      }
    });
    // this.sidenav.close();

  }

  logout() {
    this.authService.logout();
    // this.usuarioservice.logout();
    localStorage.removeItem("datosUsuario");
    this.user = null;
    this.username = '';
    this.isAuthenticated = false;
    this.router.navigate(['/']);

  }

  // Atributo de localStorage
  // private storedUser = localStorage.getItem('user_datass');

  getUserProfile(): void {
    this.usuarioService.getUserByNameForToken().subscribe({
      next: (response) => {
        if (response) {
          this.user = response; // Almacena los datos del usuario
          // console.log('Usuario encontrado:', this.user);
          // this.storedUser = JSON.stringify(this.user);
          localStorage.setItem("datosUsuario", JSON.stringify(this.user));
          // this.datosUsuario = localStorage.getItem("datosUsuario");
        } else {
          this.errorMessage = 'No se encontró el usuario.';
        }
      },
      error: (error) => {
        this.errorMessage = 'Error al obtener el usuario.';
        console.error('Error:', error);
      }
    });
  }

}
