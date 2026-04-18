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


export interface MenuItem {
  label: string;
  route?: string;
  icon: string;
  children?: MenuItem[];
  expanded?: boolean;
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

  filteredMenuItems: MenuItem[] = [];


  menuItems: MenuItem[] = [
    { label: 'Inicio', route: '/', icon: 'home' },
    {
      label: 'Obreros',
      icon: 'work',
      children: [
        { label: 'Pastores', route: '/pastores', icon: 'person' },
        { label: 'Encargados', route: '/encargados', icon: 'assignment' },
        { label: 'Líderes', route: '/lideres', icon: 'star' },
        { label: 'Tipo Cargo', route: '/tipocargo', icon: 'badge' },
        { label: 'Cargos Miembros', route: '/cargo', icon: 'assignment_ind' }
      ]
    },
    {
      label: 'Miembros',
      icon: 'people',
      children: [
        { label: 'Lista Miembros', route: '/miembro', icon: 'list' },
        { label: 'Personas', route: '/persona', icon: 'person_outline' },
        { label: 'Cambios iglesia', route: '/cambios-iglesia', icon: 'swap_horiz' },
        { label: 'Solicitudes', route: '/solicitudes', icon: 'mark_email_unread' }
      ]
    },
    {
      label: 'Iglesias',
      icon: 'church',
      children: [
        { label: 'Lista Iglesias', route: '/iglesia', icon: 'list' },
        { label: 'Iglesia Miembros', route: '/miembroiglesia', icon: 'recent_actors' },
        { label: 'Iglesia Grafico', route: '/graficoiglesias', icon: 'bar_chart' }
      ]
    },
    {
      label: 'Eventos',
      icon: 'event',
      children: [
        { label: 'Actividades', route: '/eventos', icon: 'local_activity' },
        { label: 'Bautizos', route: '/bautizos', icon: 'water_drop' },
        { label: 'Talleres', route: '/talleres', icon: 'school' },
        { label: 'Certificados', route: '/certificados', icon: 'workspace_premium' }
      ]
    },
    { label: 'Ofrendas', route: '/ofrendas', icon: 'monetization_on' },
    {
      label: 'Usuario Sistemas',
      icon: 'admin_panel_settings',
      children: [
        { label: 'Usuarios Sistema', route: '/usuariosistema', icon: 'switch_account' },
        { label: 'Perfil', route: '/perfil', icon: 'manage_accounts' },
        { label: 'Configuración', route: '/configuracion', icon: 'settings' }
      ]
    }
  ];
  constructor() {
  }

  /**
   * Filtra de manera recursiva el menú basándose en los roles del usuario.
   * 
   * @param items Lista de menús a filtrar.
   * @param isAdmin Booleano que indica si el usuario tiene rol de Administrador.
   * @param isEncargado Booleano que indica si el usuario tiene rol de Encargado.
   * @returns Un arreglo con los elementos del menú autorizados para el usuario.
   */
  private filterMenu(items: MenuItem[], isAdmin: boolean, isEncargado: boolean): MenuItem[] {
    return items
      .map(item => {
        if (item.children) {
          const filteredChildren = this.filterMenu(item.children, isAdmin, isEncargado);
          return { ...item, children: filteredChildren };
        }
        return item;
      })
      .filter(item => {
        if (item.children) {
          return item.children.length > 0;
        }
        if (isAdmin) return true;
        if (isEncargado) {
          return item.route !== '/usuariosistema';
        }
        return item.route === '/' || item.route === '/configuracion';
      });
  }

  /**
   * Actualiza la lista de menús filtrados dependiendo del estado de autenticación y roles.
   * Además, restaura el estado de expansión de los submenús desde sessionStorage.
   */
  updateFilteredMenuItems(): void {
    if (!this.isAuthenticated) {
      this.filteredMenuItems = [];
      sessionStorage.removeItem('expandedMenus');
      return;
    }
    const isAdmin = this.authService.isLoggedRolAdmin();
    const isEncargado = this.authService.isLoggedRolEncargado();

    this.filteredMenuItems = this.filterMenu(this.menuItems, isAdmin, isEncargado);

    // Restaurar estado de los menús
    const savedState = sessionStorage.getItem('expandedMenus');
    if (savedState) {
      try {
        const expandedLabels: string[] = JSON.parse(savedState);
        this.filteredMenuItems.forEach(item => {
          if (expandedLabels.includes(item.label)) {
            item.expanded = true;
          }
        });
      } catch (e) {
        console.error('Error parsing expandedMenus state', e);
      }
    }
  }

  /**
   * Alterna el estado de expansión (abierto/cerrado) de un menú desplegable.
   * 
   * @param item El ítem del menú que se va a expandir o contraer.
   */
  toggleSubmenu(item: MenuItem): void {
    item.expanded = !item.expanded;
    this.saveExpandedState();
  }

  /**
   * Guarda los nombres (labels) de los submenús que están expandidos en el `sessionStorage`.
   * Esto sirve para mantener su estado visual tras recargar la página.
   */
  private saveExpandedState(): void {
    const expandedLabels = this.filteredMenuItems
      .filter(item => item.expanded)
      .map(item => item.label);
    sessionStorage.setItem('expandedMenus', JSON.stringify(expandedLabels));
  }

  /**
   * Inicialización del componente.
   * Configura la responsividad, el estado del usuario y la suscripción a los eventos del router.
   */
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

  /**
   * Observa los cambios en el tamaño de la pantalla (breakpoints)
   * para ocultar o mostrar automáticamente la barra lateral.
   */
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

  /**
   * Alterna el modo y la visibilidad de la barra lateral según si la pantalla 
   * es pequeña (modo 'over') o grande (modo 'side').
   * 
   * @param isSmallScreen Booleano que indica si la pantalla actual es pequeña.
   */
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

  /**
   * Se suscribe a los observables de autenticación para determinar
   * si el usuario está logueado y actualizar su información general.
   */
  private initializeUserState() {
    this.authService.currentUser$.subscribe(user => {
      this.username = user?.username || '';
      this.isAuthenticated = !!user;
      this.updateFilteredMenuItems();
    });
  }

  /**
   * Abre un modal con el formulario de inicio de sesión.
   * Tras un inicio exitoso, obtiene el perfil del usuario.
   */
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

  /**
   * Cierra la sesión activa del usuario, limpia el almacenamiento
   * local y de sesión, y redirige a la página de inicio.
   */
  logout() {
    this.authService.logout();
    // this.usuarioservice.logout();
    localStorage.removeItem("datosUsuario");
    sessionStorage.removeItem("expandedMenus");
    this.user = null;
    this.username = '';
    this.isAuthenticated = false;
    this.router.navigate(['/']);
  }

  // Atributo de localStorage
  // private storedUser = localStorage.getItem('user_datass');

  /**
   * Obtiene la información detallada del perfil del usuario usando su token,
   * guardándola en la variable del componente y en el localStorage.
   */
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
