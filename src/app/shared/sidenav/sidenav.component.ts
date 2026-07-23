import { Component, inject, OnInit, OnDestroy, ViewChild, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
import { MiembroIglesiaService } from '../../core/services/miembro-iglesia.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { CreateUserDto, SingleUserResponse, User, UserResponse } from '../../core/models/user.model';
import { ThemeService } from '../../core/services/theme.service';
import { ImageUrlPipe } from '../pipes/image-url.pipe';
import { SolicitudListComponent } from '../../components/admin/miembro-iglesia/solicitud-list/solicitud-list.component';
import { Subscription, interval } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { ROUTE_VIEW_MAP } from '../../core/constants/privilegios.constants';
import { MatBadgeModule } from '@angular/material/badge';


export interface MenuItem {
  label: string;
  route?: string;
  icon: string;
  children?: MenuItem[];
  expanded?: boolean;
  /** Si true, el ítem solo se muestra a usuarios con rol ADMIN */
  adminOnly?: boolean;
  /** Si true, el ítem se oculta para usuarios con rol ADMIN */
  nonAdminOnly?: boolean;
  /** Etiqueta del grupo. Si está presente, se renderiza un separador antes de este ítem */
  groupLabel?: string;
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
    ImageUrlPipe,
    MatBadgeModule
  ],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') sidenav!: MatSidenav;
  isSmallScreen = false;
  username: string = '';
  isAuthenticated = false;
  errorMessage: string | null = null;

  user: CreateUserDto | null = null;

  activeIglesiaNombre: string | null = null;
  activeCargoNombre: string | null = null;
  iglesiasDisponibles: any[] = [];
  pendingSolicitudesCount: number = 0;

  private router = inject(Router);
  private breakpointObserver: BreakpointObserver = inject(BreakpointObserver);
  public authService: AuthService = inject(AuthService);
  private dialog: MatDialog = inject(MatDialog);
  private usuarioService = inject(UserService);
  private miembroIglesiaService = inject(MiembroIglesiaService);
  private notificacionService = inject(NotificacionService);
  private datosUsuario: any = JSON.parse(localStorage.getItem("datosUsuario") || '{}');
  private themeService = inject(ThemeService);
  private destroyRef = inject(DestroyRef);
  private pollingSub?: Subscription;

  isDarkMode = this.themeService.isDarkMode;
  
  toggleTheme() {
    this.themeService.toggleTheme();
  }

  loadActiveContext(): void {
    this.activeIglesiaNombre = this.authService.getCurrentIglesiaNombre();
    this.activeCargoNombre = this.authService.getCurrentCargoNombre();
    const storedIglesias = localStorage.getItem('user_iglesias');
    if (storedIglesias) {
      try {
        this.iglesiasDisponibles = JSON.parse(storedIglesias);
      } catch (e) {
        this.iglesiasDisponibles = [];
      }
    } else {
      this.iglesiasDisponibles = [];
    }
  }

  filteredMenuItems: MenuItem[] = [];

  menuItems: MenuItem[] = [
    // ── General ──
    { label: 'Inicio', route: '/inicio', icon: 'home' },

    // ── Miembros ──
    { label: 'Miembros', route: '/miembro', icon: 'people', groupLabel: 'Miembros' },
    { label: 'Mis Miembros', route: '/mi-iglesia', icon: 'people_alt', nonAdminOnly: true },
    { label: 'Cambios Iglesia', route: '/cambios-iglesia', icon: 'swap_horiz' },

    // ── Iglesias ──
    { label: 'Iglesias', route: '/iglesia', icon: 'church', groupLabel: 'Iglesias' },
    { label: 'Obreros', route: '/obreros', icon: 'work' },

    // ── Eventos ──
    { label: 'Eventos', route: '/eventos', icon: 'event', groupLabel: 'Eventos' },
    { label: 'Certificaciones', route: '/certificados', icon: 'workspace_premium' },

    // ── Recursos ──
    { label: 'Ofrendas', route: '/ofrendas', icon: 'monetization_on', groupLabel: 'Recursos' },
    { label: 'Inventario', route: '/activos', icon: 'inventory_2' },
    { label: 'Informes', route: '/informes', icon: 'assessment' },

    // ── Sistema ──
    {
      label: 'Administración',
      icon: 'admin_panel_settings',
      adminOnly: true,
      groupLabel: 'Sistema',
      children: [
        { label: 'Usuarios Sistema', route: '/usuariosistema', icon: 'switch_account' }
      ]
    },
    { label: 'Perfil', route: '/perfil', icon: 'manage_accounts', groupLabel: 'Sistema' },
    { label: 'Configuración', route: '/configuracion', icon: 'settings' },
    { label: 'Ayuda', route: '/ayuda', icon: 'help_outline' }
  ];
  constructor() {
  }

  /**
   * Determina si el usuario tiene el privilegio de VISUALIZACIÓN necesario para
   * que un ítem de menú sea visible.
   *
   * Delega en el mapa único {@link ROUTE_VIEW_MAP} y en
   * {@link AuthService.hasPrivilegio}, de modo que menú y `privilegioGuard`
   * consultan exactamente la misma fuente y nunca se contradicen.
   *
   * Reglas:
   *  - Rutas siempre visibles para autenticados (`/`, `/inicio`, `/mi-iglesia`,
   *    `/perfil`, `/configuracion`) → `true`.
   *  - Rutas no listadas en el mapa → `false` (no se muestra el ítem salvo
   *    decisión explícita del `filterMenu`).
   *  - Rutas listadas → exige el privilegio `Ver <Entidad>` correspondiente.
   */
  private hasPrivilegeForRoute(route: string | undefined): boolean {
    if (!route) return false;

    const role = localStorage.getItem('role');
    const isPastorOrEncargado = role === 'ROLE_PASTOR' || role === 'ROLE_ENCARGADO_IGLESIA';
    if (isPastorOrEncargado && (route === '/cambios-iglesia' || route === '/solicitudes' || route === '/colaboradores')) {
      return true;
    }

    if (route === '/configuracion') {
      return isPastorOrEncargado;
    }

    if (route === '/activos') {
      return role === 'ROLE_PASTOR' || role === 'ROLE_ENCARGADO_IGLESIA' || role === 'ROLE_DIACONO';
    }

    // Rutas siempre visibles para cualquier usuario autenticado.
    if (route === '/' || route === '/inicio' || route === '/mi-iglesia'
        || route === '/perfil' || route === '/ayuda') {
      return true;
    }

    // El mapa usa la ruta SIN barra inicial.
    const key = route.startsWith('/') ? route.slice(1) : route;
    const requerido = ROUTE_VIEW_MAP[key];
    if (!requerido) {
      // Ruta no controlada por privilegio: no mostrar (defensivo).
      return false;
    }
    return this.authService.hasPrivilegio(requerido);
  }

  canViewConfig(): boolean {
    const role = localStorage.getItem('role');
    return role === 'ROLE_ADMIN' || role === 'ROLE_PASTOR' || role === 'ROLE_ENCARGADO_IGLESIA';
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
    const role = localStorage.getItem('role');
    const isPastorOrEncargado = role === 'ROLE_PASTOR' || role === 'ROLE_ENCARGADO_IGLESIA';

    return items
      .map(item => {
        if (item.children) {
          const filteredChildren = this.filterMenu(item.children, isAdmin, item.label);
          return { ...item, children: filteredChildren };
        }
        return item;
      })
      .filter(item => {
        // Hide entire Iglesia section/list for pastor or encargado
        if (isPastorOrEncargado && (item.label === 'Iglesias' || item.route === '/iglesia')) {
          return false;
        }

        // Ocultar grupos/ítems marcados como adminOnly para no-admins
        if (item.adminOnly && !isAdmin) return false;

        // Ocultar ítems marcados como nonAdminOnly para admins
        if (item.nonAdminOnly && isAdmin) return false;

        if (item.children) {
          return item.children.length > 0;
        }
        // Admin ve todo
        if (isAdmin) return true;

        return this.hasPrivilegeForRoute(item.route);
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
    let activeMenu: MenuItem[] = [];

    if (isAdmin) {
      activeMenu = this.menuItems.map(item => {
        let newItem = { ...item };
        if (newItem.label === 'Administración') {
          newItem.label = 'Administrador';
        }
        return newItem;
      });
    } else {
      activeMenu = this.menuItems.reduce((acc: MenuItem[], item) => {
        let newItem = { ...item };
        if (newItem.route === '/miembro') {
          // Omitir Miembros global para no-admins
          return acc;
        }
        if (newItem.route === '/mi-iglesia') {
          newItem.label = 'Miembros';
        }
        if (newItem.label === 'Obreros' || newItem.route === '/obreros') {
          newItem.label = 'Colaboradores';
          newItem.route = '/colaboradores';
          newItem.icon = 'people';
        }
        acc.push(newItem);
        return acc;
      }, []);
    }

    this.filteredMenuItems = this.filterMenu(activeMenu, isAdmin);

    // Restaurar estado de los menús
    const savedState = sessionStorage.getItem('expandedMenus');
    if (savedState) {
      try {
        const expandedLabels: string[] = JSON.parse(savedState);
        this.filteredMenuItems.forEach(item => {
          if (expandedLabels.includes(item.label) || (item.label === 'Administrador' && expandedLabels.includes('Administración'))) {
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
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
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
      .pipe(takeUntilDestroyed(this.destroyRef))
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
    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(user => {
      this.username = user?.username || '';
      this.isAuthenticated = !!user;
      this.loadActiveContext();
      this.updateFilteredMenuItems();

      if (this.isAuthenticated) {
        this.startPolling();
        // Escucha en tiempo real si hay mutaciones de traspasos para recargar el conteo
        this.miembroIglesiaService.solicitudesChanged$
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.loadPendingSolicitudesCount();
          });
      } else {
        this.stopPolling();
        this.pendingSolicitudesCount = 0;
      }
    });
  }

  startPolling() {
    this.stopPolling();
    // Poll cada 60 segundos: el backend expone un endpoint de conteo liviano
    // (unos pocos bytes) en vez de descargar traspasos/eventos/decisiones completos.
    this.pollingSub = interval(60000).pipe(
      startWith(0)
    ).subscribe(() => {
      this.loadPendingSolicitudesCount();
    });
  }

  stopPolling() {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
      this.pollingSub = undefined;
    }
  }

  loadPendingSolicitudesCount(): void {
    if (!this.isAuthenticated) return;

    if (!this.hasSolicitudesPrivilege()) {
      this.pendingSolicitudesCount = 0;
      return;
    }

    const iglesiaId = this.authService.getCurrentIglesiaId() || 0;

    this.notificacionService.getBadge(iglesiaId).subscribe({
      next: (res) => {
        this.pendingSolicitudesCount = res.datos?.total || 0;
      },
      error: (error) => {
        console.error('Error al cargar conteo de notificaciones unificadas:', error);
      }
    });
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  onSwitchChurch(iglesiaId: number): void {
    if (this.authService.getCurrentIglesiaId() === iglesiaId) return;

    this.authService.switchChurch(iglesiaId).subscribe({
      next: () => {
        this.loadActiveContext();
        this.router.navigate(['/inicio']).then(() => {
          this.updateFilteredMenuItems();
          window.location.reload();
        });
      },
      error: (err) => {
        console.error('Error al cambiar de iglesia:', err);
      }
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

  hasSolicitudesPrivilege(): boolean {
    if (!this.isAuthenticated) return false;
    const isAdmin = this.authService.isLoggedRolAdmin();
    if (isAdmin) return true;
    return this.hasPrivilegeForRoute('/solicitudes');
  }

  openSolicitudesModal(): void {
    this.dialog.open(SolicitudListComponent, {
      width: '420px',
      maxHeight: '80vh',
      position: { top: '65px', right: '16px' },
      panelClass: 'solicitudes-popover-panel',
      hasBackdrop: true
    });
  }

}
