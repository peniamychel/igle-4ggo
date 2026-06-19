import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { FormsModule } from '@angular/forms';
import { User } from '../../../../core/models/user.model';
import { CreateUserDialogComponent } from '../create-user-dialog/create-user-dialog.component';
import { EditUserDialogComponent } from '../edit-user-dialog/edit-user-dialog.component';
import { ViewUserDialogComponent } from '../view-user-dialog/view-user-dialog.component';
import { RolesPipe } from '../../../../core/pipes/roles.pipe';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { UserService } from '../../../../core/services/user.service';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { PrivilegioService } from '../../../../core/services/privilegio.service';
import { PrivilegioDto } from '../../../../core/models/interfaces/privilegio.interface';
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
    FormsModule,
    RolesPipe,
    MatCardModule,
    MatTooltipModule,
    ImageUrlPipe
  ],
  templateUrl: './user-table.component.html',
  styleUrls: ['./user-table.component.css']
})
export class UserTableComponent implements OnInit, AfterViewInit {
  allColumns: string[] = ['name', 'email', 'roles', 'lastLogin', 'estado', 'actions'];
  displayedColumns: string[] = [...this.allColumns];
  dataSource: MatTableDataSource<User>;
  pagedData: User[] = [];
  pageSize = 15;
  pageSizeOptions = [5, 10, 15, 25, 100];

  // Matrix and roles properties
  rolesDisponibles: TipoCargo[] = [];
  todosPrivilegios: PrivilegioDto[] = [];
  privilegiosPorRolMap: Record<number, number[]> = {};
  selectedMatrixRole = 'ADMIN';

  rolesInfo: any[] = [];

  matrixModules = [
    { name: 'Dashboard', privilegeName: 'Ver Dashboard', icon: 'dashboard' },
    { name: 'Miembros', privilegeName: 'Gestionar Miembros', icon: 'people' },
    { name: 'Iglesias', privilegeName: 'Gestionar Iglesias', icon: 'church' },
    { name: 'Cargos', privilegeName: 'Gestionar Cargos', icon: 'work' },
    { name: 'Eventos', privilegeName: 'Gestionar Eventos', icon: 'event' },
    { name: 'Certificados', privilegeName: 'Gestionar Certificados', icon: 'workspace_premium' },
    { name: 'Ofrendas', privilegeName: 'Gestionar Ofrendas', icon: 'monetization_on' },
    { name: 'Inventario', privilegeName: 'Gestionar Inventario', icon: 'inventory' },
    { name: 'Usuarios', privilegeName: 'Gestionar usuario', icon: 'switch_account' },
    { name: 'Reportes', privilegeName: 'Ver Reportes', icon: 'bar_chart' },
    { name: 'Bitácora', privilegeName: 'Ver Bitácora', icon: 'history' },
    { name: 'Configuración', privilegeName: 'Gestionar Privilegios', icon: 'settings' },
    { name: 'Ayuda', privilegeName: 'Ver Ayuda', icon: 'help' }
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort; // Using MatSort as in original
  @ViewChild(MatSort) set matSort(ms: MatSort) {
    this.sort = ms;
    this.dataSource.sort = this.sort;
  }
  @ViewChild(MatTable) table!: MatTable<User>;

  constructor(
    private userService: UserService,
    private privilegioService: PrivilegioService,
    private tipoCargoService: TipoCargoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<User>([]);
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadPageSize();
    this.loadPrivilegesData();

    // Configurar el ordenamiento personalizado
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

    // Configurar el filtrado personalizado
    this.dataSource.filterPredicate = (data: User, filter: string) => {
      const searchStr = filter.toLowerCase();
      return data.username.toLowerCase().includes(searchStr) ||
        data.email.toLowerCase().includes(searchStr) ||
        (data.name?.toLowerCase() || '').includes(searchStr) ||
        (data.apellidos?.toLowerCase() || '').includes(searchStr) ||
        data.roles.map(role => (role.nombreRol || role.name || role.nombre || '').toLowerCase()).join(' ').includes(searchStr);
    };
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
    this.updatePagedData();
    this.paginator.page.subscribe(() => this.updatePagedData());
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        const data = [...response.datos];
        data.sort((a, b) => (b.id || 0) - (a.id || 0));
        this.dataSource.data = data;
        this.updatePagedData();
      },
      error: (error) => {
        this.snackBar.open('Error al cargar usuarios', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getRoleDetails(roleKey: string, friendlyName: string) {
    const defaultDetails: Record<string, any> = {
      'ADMIN': {
        nombre: 'Administrador',
        desc: 'Administra usuarios y roles del sistema',
        longDesc: 'Acceso total al sistema, gestión de usuarios y configuración',
        colorClass: 'purple-theme',
        iconName: 'security'
      },
      'ENCARGADO_IGLESIA': {
        nombre: 'Encargado Iglesia',
        desc: 'Gestiona miembros e inventario',
        longDesc: 'Gestión de miembros, iglesias, cargos, eventos e inventario',
        colorClass: 'green-theme',
        iconName: 'church'
      },
      'ENCARGADO_EVENTO': {
        nombre: 'Encargado Evento',
        desc: 'Gestiona eventos y certificados',
        longDesc: 'Gestión de eventos, certificados y participación',
        colorClass: 'orange-theme',
        iconName: 'event'
      },
      'TESORERO': {
        nombre: 'Tesorero',
        desc: 'Gestiona ofrendas y finanzas',
        longDesc: 'Gestión financiera: ofrendas, ingresos y egresos',
        colorClass: 'blue-theme',
        iconName: 'monetization_on'
      }
    };

    if (defaultDetails[roleKey]) {
      return defaultDetails[roleKey];
    }

    const colors = ['cyan-theme', 'red-theme', 'yellow-theme', 'pink-theme'];
    const icons = ['people', 'workspace_premium', 'work', 'settings'];
    const hash = roleKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    return {
      nombre: friendlyName,
      desc: `Cargo de tipo ${roleKey.toLowerCase().replace('_', ' ')}`,
      longDesc: `Permisos y privilegios asignados al cargo de ${friendlyName}`,
      colorClass: colors[hash % colors.length],
      iconName: icons[hash % icons.length]
    };
  }

  loadPrivilegesData() {
    this.privilegioService.getAll().subscribe({
      next: (privs) => {
        this.todosPrivilegios = privs;
        this.tipoCargoService.getTipoCargos().subscribe({
          next: (res) => {
            const cargos = res.datos || [];
            this.rolesDisponibles = cargos;
            
            this.rolesInfo = cargos.map(role => {
              const details = this.getRoleDetails(role.nombreRol || '', role.nombre);
              return {
                key: role.nombreRol,
                nombre: details.nombre,
                desc: details.desc,
                longDesc: details.longDesc,
                colorClass: details.colorClass,
                iconName: details.iconName
              };
            });

            cargos.forEach(role => {
              if (role.id) {
                this.privilegioService.getPrivilegiosByRolCargo(role.id).subscribe({
                  next: (rolPrivs) => {
                    this.privilegiosPorRolMap[role.id!] = rolPrivs.map(p => p.id);
                  }
                });
              }
            });
            
            if (cargos.length > 0 && (!this.selectedMatrixRole || !cargos.some(r => r.nombreRol === this.selectedMatrixRole))) {
              this.selectedMatrixRole = cargos[0].nombreRol || 'ADMIN';
            }
          }
        });
      }
    });
  }

  getUsersCountByRole(roleName: string): number {
    if (!this.dataSource.data) return 0;
    return this.dataSource.data.filter(user => 
      user.roles && user.roles.some(r => (r.nombreRol || r.name || r.nombre) === roleName)
    ).length;
  }

  getActiveModulesCount(roleKey: string): number {
    const role = this.rolesDisponibles.find(r => r.nombreRol === roleKey);
    if (!role || !role.id) return 0;
    const assignedIds = this.privilegiosPorRolMap[role.id] || [];
    return this.matrixModules.filter(mod => {
      const priv = this.todosPrivilegios.find(p => p.nombre === mod.privilegeName);
      return priv && priv.id && assignedIds.includes(priv.id);
    }).length;
  }

  hasPrivilege(roleKey: string, privilegeName: string): boolean {
    const role = this.rolesDisponibles.find(r => r.nombreRol === roleKey);
    if (!role || !role.id) return false;
    const assignedIds = this.privilegiosPorRolMap[role.id] || [];
    const priv = this.todosPrivilegios.find(p => p.nombre === privilegeName);
    return !!(priv && priv.id && assignedIds.includes(priv.id));
  }

  togglePrivilege(roleKey: string, privilegeName: string, event: Event) {
    event.stopPropagation();
    const role = this.rolesDisponibles.find(r => r.nombreRol === roleKey);
    if (!role || !role.id) return;
    const rolCargoId = role.id;
    
    const priv = this.todosPrivilegios.find(p => p.nombre === privilegeName);
    if (!priv || !priv.id) return;
    
    const assignedIds = this.privilegiosPorRolMap[rolCargoId] || [];
    const hasIt = assignedIds.includes(priv.id);
    
    if (hasIt) {
      this.privilegioService.removePrivilegioFromRolCargo(rolCargoId, priv.id).subscribe({
        next: () => {
          this.privilegiosPorRolMap[rolCargoId] = assignedIds.filter(id => id !== priv.id);
          this.snackBar.open(`Privilegio '${privilegeName}' removido del rol ${role.nombre}`, 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: () => {
          this.snackBar.open('Error al remover el privilegio', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      const privId = priv.id;
      this.privilegioService.addPrivilegioToRolCargo(rolCargoId, privId).subscribe({
        next: () => {
          this.privilegiosPorRolMap[rolCargoId] = [...assignedIds, privId];
          this.snackBar.open(`Privilegio '${privilegeName}' asignado al rol ${role.nombre}`, 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: () => {
          this.snackBar.open('Error al asignar el privilegio', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  selectMatrixRole(roleKey: string) {
    this.selectedMatrixRole = roleKey;
  }

  get totalUsers(): number {
    return this.dataSource.data.length;
  }
  
  get activeUsers(): number {
    return this.dataSource.data.filter(u => u.estado).length;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.updatePagedData();
  }

  onPageChanged(): void {
    this.updatePagedData();
  }

  private updatePagedData(): void {
    const filtered = this.dataSource.filteredData;
    const pageIndex = this.paginator?.pageIndex || 0;
    const size = this.paginator?.pageSize || this.pageSize;
    const start = pageIndex * size;
    this.pagedData = filtered.slice(start, start + size);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateUserDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  openEditDialog(user: User): void {
    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: user,
      panelClass: 'dialog-fullscreen-mobile'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  openViewDialog(user: User): void {
    this.dialog.open(ViewUserDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: user,
      panelClass: 'dialog-fullscreen-mobile'
    });
  }

  deleteUser(user: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Usuario',
        message: `¿Estás seguro de que deseas eliminar al usuario <strong>${user.name || ''} ${user.apellidos || ''} (${user.username})</strong>?<br><br>Esta acción eliminará permanentemente la cuenta de usuario y su foto de perfil.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm && user.id) {
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.snackBar.open('Usuario eliminado exitosamente', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadUsers();
          },
          error: (error) => {
            console.error('Error al eliminar usuario:', error);
            this.snackBar.open('Error al eliminar el usuario', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  toggleUserStatus(user: User): void {
    user.estado = !user.estado;
    this.dataSource.data = [...this.dataSource.data];
  }

  savePageSize(pageSize: number): void {
    localStorage.setItem('userTablePageSize', pageSize.toString());
  }

  private loadPageSize(): void {
    const savedPageSize = localStorage.getItem('userTablePageSize');
    if (savedPageSize) {
      this.pageSize = parseInt(savedPageSize, 10);
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = [
      '#7c4dff', '#00bfa5', '#ff6d00', '#2979ff',
      '#d500f9', '#00c853', '#ff3d00', '#651fff',
      '#1de9b6', '#f50057', '#304ffe', '#00b0ff'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  getRoleDisplayName(roleKey: string): string {
    switch (roleKey) {
      case 'ADMIN': return 'Administrador';
      case 'ENCARGADO_IGLESIA': return 'Encargado Iglesia';
      case 'ENCARGADO_EVENTO': return 'Encargado Evento';
      case 'TESORERO': return 'Tesorero';
      default: return roleKey;
    }
  }
}
