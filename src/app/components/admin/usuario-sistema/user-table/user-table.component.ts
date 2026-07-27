import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MatTableModule, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { User, UserResponse } from '../../../../core/models/user.model';
import { CreateUserDialogComponent } from '../create-user-dialog/create-user-dialog.component';
import { EditUserDialogComponent } from '../edit-user-dialog/edit-user-dialog.component';
import { ViewUserDialogComponent } from '../view-user-dialog/view-user-dialog.component';
import { RolesPipe } from '../../../../core/pipes/roles.pipe';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { UserService } from '../../../../core/services/user.service';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { finalize } from 'rxjs/operators';
import { ServicioService } from '../../../../core/services/servicio.service';
import { ServicioDto, AccionDto } from '../../../../core/models/interfaces/servicio.interface';
import { TipoCargoService } from '../../../../core/services/tipo-cargo.service';
import { TipoCargo } from '../../../../core/models/tipo-cargo.model';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatCardModule,
    MatTooltipModule,
    MatTabsModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatChipsModule,
    MatMenuModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    FormsModule,
    RolesPipe,
    ImageUrlPipe,
    LoadingSpinnerComponent
  ],
  templateUrl: './user-table.component.html',
  styleUrls: ['./user-table.component.css']
})
export class UserTableComponent implements OnInit, AfterViewInit {
  isLoading = true;
  displayedColumns: string[] = ['name', 'roles', 'iglesia', 'accionesCount', 'estado', 'actions'];
  dataSource: MatTableDataSource<User>;
  pagedData: User[] = [];
  pageSize = 15;
  pageSizeOptions = [5, 10, 15, 25, 100];

  // Matriz de Servicios & Acciones
  currentTab: 'categorized' | 'matrix' = 'categorized';
  servicios: ServicioDto[] = [];
  rolesDisponibles: TipoCargo[] = [];
  selectedRol: TipoCargo | null = null;
  accionesPorRolMap: Record<number, number[]> = {};

  // Métricas / KPIs
  totalUsers = 0;
  activeUsers = 0;
  totalRoles = 0;
  totalAcciones = 0;

  private avatarColors = [
    '#7c4dff', '#651fff', '#6200ea', '#e91e63',
    '#2196f3', '#00bcd4', '#009688', '#4caf50',
    '#ff9800', '#ff5722', '#795548', '#607d8b'
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatSort) set matSort(ms: MatSort) {
    this.sort = ms;
    this.dataSource.sort = this.sort;
  }

  constructor(
    private userService: UserService,
    private servicioService: ServicioService,
    private tipoCargoService: TipoCargoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<User>([]);
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadPageSize();
    this.loadServiciosYRolesData();

    this.dataSource.sortingDataAccessor = (item: User, property: string) => {
      switch (property) {
        case 'name':
          return `${item.name || ''} ${item.apellidos || ''}`.toLowerCase();
        case 'roles':
          return item.roles.map(role => role.nombreRol || role.name || role.nombre).join(', ').toLowerCase();
        default:
          return (item as any)[property];
      }
    };

    this.dataSource.filterPredicate = (data: User, filter: string) => {
      const accumulator = (currentTerm: string, key: string) => {
        return currentTerm + (data as any)[key];
      };
      const dataStr = Object.keys(data).reduce(accumulator, '').toLowerCase();
      const transformedFilter = filter.trim().toLowerCase();
      return dataStr.indexOf(transformedFilter) !== -1;
    };
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadPageSize(): void {
    const savedSize = localStorage.getItem('userTablePageSize');
    if (savedSize) {
      const parsed = parseInt(savedSize, 10);
      if (this.pageSizeOptions.includes(parsed)) {
        this.pageSize = parsed;
      }
    }
  }

  savePageSize(newSize: number): void {
    this.pageSize = newSize;
    localStorage.setItem('userTablePageSize', newSize.toString());
  }

  onPageChanged(): void {
    this.updatePagedData();
  }

  updatePagedData(): void {
    if (this.paginator) {
      const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
      const endIndex = startIndex + this.paginator.pageSize;
      this.pagedData = this.dataSource.filteredData.slice(startIndex, endIndex);
    } else {
      this.pagedData = this.dataSource.filteredData.slice(0, this.pageSize);
    }
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsers().pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (res: UserResponse) => {
        const users: User[] = res.datos || [];
        this.dataSource.data = users;
        this.totalUsers = users.length;
        this.activeUsers = users.filter((u: User) => u.estado).length;
        this.updatePagedData();
      },
      error: () => {
        this.snackBar.open('Error al cargar la lista de usuarios', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadServiciosYRolesData(): void {
    // 1. Cargar catálogo de Servicios y Acciones
    this.servicioService.getAll().subscribe({
      next: (servicios) => {
        this.servicios = servicios;
        let countAcciones = 0;
        servicios.forEach(s => countAcciones += (s.acciones?.length || 0));
        this.totalAcciones = countAcciones;

        // 2. Cargar Roles/Cargos de la Iglesia
        this.tipoCargoService.getTipoCargos().subscribe({
          next: (res) => {
            const cargos = res.datos || [];
            this.rolesDisponibles = cargos;
            this.totalRoles = cargos.length;
            if (cargos.length > 0) {
              this.selectRol(cargos[0]);
            }

            // 3. Cargar Mapa de Acciones asignadas a cada Rol
            cargos.forEach(role => {
              if (role.id) {
                this.servicioService.getAccionesByRolCargo(role.id).subscribe({
                  next: (rolAcciones) => {
                    this.accionesPorRolMap[role.id!] = rolAcciones
                      .map(a => a.id)
                      .filter((id): id is number => id !== undefined);
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  selectRol(rol: TipoCargo): void {
    this.selectedRol = rol;
  }

  isAccionAsignada(rolId: number | undefined, accionId: number | undefined): boolean {
    if (!rolId || !accionId) return false;
    const asignadas = this.accionesPorRolMap[rolId] || [];
    return asignadas.includes(accionId);
  }

  toggleAccionForRol(rol: TipoCargo, accion: AccionDto): void {
    if (!rol.id || !accion.id) return;
    const rolId = rol.id;
    const accionId = accion.id;
    const asignadas = this.accionesPorRolMap[rolId] || [];
    const estaAsignada = asignadas.includes(accionId);

    if (estaAsignada) {
      this.servicioService.removeAccionFromRolCargo(rolId, accionId).subscribe({
        next: () => {
          this.accionesPorRolMap[rolId] = asignadas.filter(id => id !== accionId);
          this.snackBar.open(`Acción '${accion.nombre}' revocada de '${rol.nombre}'`, 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: () => {
          this.snackBar.open('Error al revocar la acción', 'Cerrar', { duration: 3000 });
        }
      });
    } else {
      this.servicioService.addAccionToRolCargo(rolId, accionId).subscribe({
        next: () => {
          this.accionesPorRolMap[rolId] = [...asignadas, accionId];
          this.snackBar.open(`Acción '${accion.nombre}' asignada a '${rol.nombre}'`, 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: () => {
          this.snackBar.open('Error al asignar la acción', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  isServicioCompletoAsignado(rolId: number | undefined, servicio: ServicioDto): boolean {
    if (!rolId || !servicio.acciones || servicio.acciones.length === 0) return false;
    const asignadas = this.accionesPorRolMap[rolId] || [];
    return servicio.acciones.every(a => a.id && asignadas.includes(a.id));
  }

  isServicioParcialAsignado(rolId: number | undefined, servicio: ServicioDto): boolean {
    if (!rolId || !servicio.acciones || servicio.acciones.length === 0) return false;
    const asignadas = this.accionesPorRolMap[rolId] || [];
    const cuantas = servicio.acciones.filter(a => a.id && asignadas.includes(a.id)).length;
    return cuantas > 0 && cuantas < servicio.acciones.length;
  }

  toggleServicioCompletoForRol(rol: TipoCargo, servicio: ServicioDto): void {
    if (!rol.id || !servicio.acciones || servicio.acciones.length === 0) return;
    const rolId = rol.id;
    const estaCompleto = this.isServicioCompletoAsignado(rolId, servicio);
    const accionIdsServicio = servicio.acciones.map(a => a.id).filter((id): id is number => id !== undefined);

    if (estaCompleto) {
      forkJoin(accionIdsServicio.map(accionId => this.servicioService.removeAccionFromRolCargo(rolId, accionId))).subscribe({
        next: () => {
          const asignadas = this.accionesPorRolMap[rolId] || [];
          this.accionesPorRolMap[rolId] = asignadas.filter(id => !accionIdsServicio.includes(id));
          this.snackBar.open(`Servicio '${servicio.nombre}' revocado de '${rol.nombre}'`, 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: () => {
          this.snackBar.open('Error al modificar permisos del servicio', 'Cerrar', { duration: 3000 });
        }
      });
    } else {
      const asignadasActuales = this.accionesPorRolMap[rolId] || [];
      const faltantes = accionIdsServicio.filter(id => !asignadasActuales.includes(id));

      if (faltantes.length === 0) return;

      forkJoin(faltantes.map(accionId => this.servicioService.addAccionToRolCargo(rolId, accionId))).subscribe({
        next: () => {
          this.accionesPorRolMap[rolId] = [...(this.accionesPorRolMap[rolId] || []), ...faltantes];
          this.snackBar.open(`Servicio '${servicio.nombre}' activado completamente para '${rol.nombre}'`, 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: () => {
          this.snackBar.open('Error al activar el servicio', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.updatePagedData();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateUserDialogComponent, {
      width: '960px',
      maxWidth: '95vw',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  openEditDialog(user: User): void {
    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      width: '960px',
      maxWidth: '95vw',
      data: user,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  openViewDialog(user: User): void {
    this.dialog.open(ViewUserDialogComponent, {
      width: '650px',
      data: user
    });
  }

  deleteUser(user: User): void {
    if (!user.id) return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar Eliminación',
        message: `¿Está seguro de eliminar al usuario '${user.name || user.username}'?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.deleteUser(user.id!).subscribe({
          next: () => {
            this.snackBar.open('Usuario eliminado exitosamente', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadUsers();
          },
          error: () => {
            this.snackBar.open('Error al eliminar usuario', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  toggleUserStatus(user: User): void {
    if (!user.id) return;
    const nextEstado = !user.estado;
    const updateDto = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name || '',
      apellidos: user.apellidos || '',
      miembroId: user.miembroId,
      estado: nextEstado
    };
    this.userService.updateUser(updateDto).subscribe({
      next: (updatedUser) => {
        user.estado = updatedUser.estado;
        this.dataSource.data = [...this.dataSource.data];
        this.updatePagedData();
        this.snackBar.open(`Usuario ${updatedUser.estado ? 'Activado' : 'Desactivado'} correctamente`, 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: () => {
        this.snackBar.open('Error al actualizar el estado del usuario', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getAvatarColor(name: string): string {
    if (!name) return this.avatarColors[0];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return this.avatarColors[hash % this.avatarColors.length];
  }

  getRoleDisplayName(roleKey: string): string {
    const rolesMap: Record<string, string> = {
      'ADMIN': 'Administrador Global',
      'PASTOR': 'Pastor Responsable',
      'ENCARGADO_IGLESIA': 'Encargado de Iglesia',
      'ENCARGADO_EVENTO': 'Encargado de Evento',
      'TESORERO': 'Tesorero',
      'SECRETARIO': 'Secretario'
    };
    return rolesMap[roleKey.toUpperCase()] || roleKey;
  }

  hasServiceAccess(rolId: number, servicio: ServicioDto): boolean {
    return this.isServicioCompletoAsignado(rolId, servicio);
  }

  toggleServiceAccess(event: any, rol: TipoCargo, servicio: ServicioDto): void {
    if (!rol.id || !servicio.acciones || servicio.acciones.length === 0) return;
    const checked = event.checked;
    const rolId = rol.id;
    const actionIdsServicio = servicio.acciones.map(a => a.id).filter((id): id is number => id !== undefined);

    const obs = actionIdsServicio.map(accionId => {
      const asignadas = this.accionesPorRolMap[rolId] || [];
      const estaAsignada = asignadas.includes(accionId);
      if (checked && !estaAsignada) {
        return this.servicioService.addAccionToRolCargo(rolId, accionId);
      } else if (!checked && estaAsignada) {
        return this.servicioService.removeAccionFromRolCargo(rolId, accionId);
      }
      return null;
    }).filter(o => o !== null);

    if (obs.length === 0) return;

    forkJoin(obs).subscribe({
      next: () => {
        if (checked) {
          const asignadas = this.accionesPorRolMap[rolId] || [];
          this.accionesPorRolMap[rolId] = [...new Set([...asignadas, ...actionIdsServicio])];
        } else {
          const asignadas = this.accionesPorRolMap[rolId] || [];
          this.accionesPorRolMap[rolId] = asignadas.filter(id => !actionIdsServicio.includes(id));
        }
        this.snackBar.open(`Servicio '${servicio.nombre}' ${checked ? 'asignado' : 'revocado'} exitosamente.`, 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: () => {
        this.snackBar.open('Error al modificar permisos del servicio', 'Cerrar', { duration: 3000 });
      }
    });
  }

  getServiceDisplayName(codigo: string): string {
    switch (codigo) {
      case 'MIEMBROS':
        return 'Miembros (Global) / Miembros (Local)';
      case 'OBREROS':
        return 'Obreros (Global) / Colaboradores (Local)';
      case 'IGLESIAS':
        return 'Iglesias (Global) / Traspasos (Local)';
      case 'EVENTOS':
        return 'Eventos (Global) / Eventos (Local)';
      case 'CERTIFICADOS':
        return 'Certificaciones (Global) / Certificaciones (Local)';
      case 'OFRENDAS':
        return 'Ofrendas (Global) / Ofrendas (Local)';
      case 'USUARIOS':
        return 'Administrador (Global)';
      case 'DASHBOARD':
        return 'Inicio (Global) / Inicio (Local)';
      case 'BITACORA':
        return 'Configuración (Global) / Configuración (Local)';
      default:
        return codigo;
    }
  }

  getServiceDescription(codigo: string): string {
    switch (codigo) {
      case 'DASHBOARD':
        return 'Panel de Control - Módulo principal con métricas y estadísticas (Global o Local)';
      case 'MIEMBROS':
        return 'Gestión de todos los miembros a nivel global o local según el rol asignado';
      case 'IGLESIAS':
        return 'Listado global de iglesias o gestión de traspasos y cambios de iglesia locales';
      case 'OBREROS':
        return 'Gestión de obreros del país de forma global o colaboradores locales de una iglesia';
      case 'EVENTOS':
        return 'Lista y control de eventos de todas las iglesias o gestión local de eventos';
      case 'CERTIFICADOS':
        return 'Visualización y generación de certificados de todas las iglesias o de forma local';
      case 'OFRENDAS':
        return 'Ver y auditar todas las ofrendas por iglesia o registro local de diezmos/ofrendas';
      case 'USUARIOS':
        return 'Gestión administrativa de usuarios del sistema, roles, servicios y acciones';
      case 'BITACORA':
        return 'Configuración del sistema, lista de bitácoras de auditoría y configuración de usuario';
      default:
        return '';
    }
  }
}
