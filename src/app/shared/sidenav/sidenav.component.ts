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
import { ThemeService } from '../../core/services/theme.service';
import { ImageUrlPipe } from '../pipes/image-url.pipe';


export interface MenuItem {
  label: string;
  route?: string;
  icon: string;
  children?: MenuItem[];
  expanded?: boolean;
  /** Si true, el ítem solo se muestra a usuarios con rol ADMIN */
  adminOnly?: boolean;
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
    ImageUrlPipe
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
  private themeService = inject(ThemeService);

  isDarkMode = this.themeService.isDarkMode;
  
  toggleTheme() {
    this.themeService.toggleTheme();
  }

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
        { label: 'Tipos de Evento', route: '/tipoevento', icon: 'category' },
        { label: 'Eventos', route: '/eventos', icon: 'local_activity' },
        { label: 'Responsables', route: '/responsable-evento', icon: 'assignment_ind' },
        { label: 'Participaciones', route: '/participacion-evento', icon: 'group' },
        { label: 'Bautizos', route: '/bautizos', icon: 'water_drop' },
        { label: 'Talleres', route: '/talleres', icon: 'school' },
        { label: 'Tipos de Certificado', route: '/tipocertificado', icon: 'badge' },
        { label: 'Certificados', route: '/certificados', icon: 'workspace_premium' }
      ]
    },
    { label: 'Ofrendas', route: '/ofrendas', icon: 'monetization_on' },
    {
      label: 'Administración',
      icon: 'admin_panel_settings',
      adminOnly: true,
      children: [
        { label: 'Usuarios Sistema', route: '/usuariosistema', icon: 'switch_account' },
        { label: 'Privilegios', route: '/privilegios', icon: 'security' }
      ]
    },
    { label: 'Perfil', route: '/perfil', icon: 'manage_accounts' },
    { label: 'Configuración', route: '/configuracion', icon: 'settings' }
  ];
  constructor() {
  }

  /**
   * Mapa explícito de ruta → palabra clave del privilegio en el JWT.
   * Los privilegios del JWT tienen el formato "Gestionar X" o "Ver X".
   * La palabra clave se busca (contains) en cada authority del usuario.
   */
  private readonly ROUTE_PRIVILEGE_MAP: Record<string, string> = {
    '/miembro':          'Miembros',
    '/persona':          'Personas',
    '/iglesia':          'Iglesias',
    '/miembroiglesia':   'MiembroIglesia',
    '/graficoiglesias':  'Iglesias',
    '/tipocargo':        'Tipos de Cargo',
    '/cargo':            'Cargos',
    '/pastores':         'Cargos',
    '/encargados':       'Cargos',
    '/lideres':          'Cargos',
    '/cambios-iglesia':  'Iglesias',
    '/solicitudes':      'Miembros',
    '/tipoevento':           'Eventos',
    '/eventos':              'Eventos',
    '/responsable-evento':   'Eventos',
    '/participacion-evento': 'Eventos',
    '/bautizos':             'Eventos',
    '/talleres':             'Eventos',
    '/tipocertificado':      'Eventos',
    '/certificados':         'Eventos',
    '/ofrendas':         'Ofrendas',
    '/usuariosistema':   'usuario',
    '/privilegios':      'Privilegios',
  };

  /**
   * Determina si el usuario tiene el privilegio necesario para una ruta.
   * Usa el mapa explícito ROUTE_PRIVILEGE_MAP y compara contra las
   * authorities guardadas en localStorage tras el login (provenientes del JWT).
   */
  private hasPrivilegeForRoute(route: string | undefined, _label: string, _parentLabel: string = ''): boolean {
    if (!route) return false;

    // Rutas siempre visibles para cualquier usuario autenticado
    if (route === '/' || route === '/perfil' || route === '/configuracion') {
      return true;
    }

    const storedPrivilegios = localStorage.getItem('privilegios');
    if (!storedPrivilegios) return false;

    let userPrivileges: string[] = [];
    try {
      userPrivileges = JSON.parse(storedPrivilegios);
    } catch (e) {
      console.error('Error al parsear privilegios del localStorage', e);
      return false;
    }

    const keyword = this.ROUTE_PRIVILEGE_MAP[route];
    if (!keyword) return false;

    const normalize = (str: string) =>
      str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    const normalizedKeyword = normalize(keyword);
    return userPrivileges.some(p => normalize(p).includes(normalizedKeyword));
  }

  /**
   * Filtra de manera recursiva el menú basándose en los roles del usuario y sus privilegios.
   *
   * - Los ítems con `adminOnly: true` solo se muestran si el usuario es ADMIN.
   * - Los grupos padre solo se muestran si al menos un hijo es visible.
   * - Los ítems hoja se muestran según la asignación de privilegios del JWT.
   *
   * @param items Lista de menús a filtrar.
   * @param isAdmin Si el usuario tiene rol ADMIN.
   * @param parentLabel Nombre del menú padre actual (para contexto).
   */
  private filterMenu(items: MenuItem[], isAdmin: boolean, parentLabel: string = ''): MenuItem[] {
    return items
      .map(item => {
        if (item.children) {
          const filteredChildren = this.filterMenu(item.children, isAdmin, item.label);
          return { ...item, children: filteredChildren };
        }
        return item;
      })
      .filter(item => {
        // Ocultar grupos/ítems marcados como adminOnly para no-admins
        if (item.adminOnly && !isAdmin) return false;

        if (item.children) {
          return item.children.length > 0;
        }
        // Admin ve todo
        if (isAdmin) return true;

        return this.hasPrivilegeForRoute(item.route, item.label, parentLabel);
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

    this.filteredMenuItems = this.filterMenu(this.menuItems, isAdmin);

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
   * Se suscribe al observable de autenticación para actualizar el estado del usuario.
   * Los privilegios ya vienen en el JWT desde el login y están guardados
   * en localStorage['privilegios'] por AuthService — no hace falta una llamada extra al API.
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
