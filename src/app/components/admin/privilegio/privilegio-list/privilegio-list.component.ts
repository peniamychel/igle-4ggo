import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { forkJoin } from 'rxjs';
import { PrivilegioService } from '../../../../core/services/privilegio.service';
import { PrivilegioDto, PrivilegioResponse } from '../../../../core/models/interfaces/privilegio.interface';
import { PrivilegioCreateComponent } from '../privilegio-create/privilegio-create.component';
import { PrivilegioDetailComponent } from '../privilegio-detail/privilegio-detail.component';
import { PrivilegioEditComponent } from '../privilegio-edit/privilegio-edit.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { TipoCargoService } from '../../../../core/services/tipo-cargo.service';
import { TipoCargo } from '../../../../core/models/tipo-cargo.model';
import { HasPrivilegioDirective } from '../../../../core/directives/has-privilegio.directive';

@Component({
  selector: 'app-privilegio-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSnackBarModule,
    MatCardModule,
    MatTooltipModule,
    MatChipsModule,
    MatButtonToggleModule,
    MatDividerModule,
    MatMenuModule,
    HasPrivilegioDirective
  ],
  templateUrl: './privilegio-list.component.html',
  styleUrls: ['./privilegio-list.component.css']
})
export class PrivilegioListComponent implements OnInit {
  displayedColumns: string[] = ['nombre', 'acto', 'estado', 'acciones'];
  dataSource: MatTableDataSource<PrivilegioDto>;

  rolesDisponibles: TipoCargo[] = [];
  selectedRolCargoId: number | null = null;
  privilegiosPorRol: PrivilegioResponse[] = [];
  todosPrivilegios: PrivilegioDto[] = [];
  privilegiosPorRolMap: Record<number, number[]> = {};

  privilegeGroups = [
    {
      categoryName: 'Operación de Membresía',
      icon: 'people',
      description: 'Gestión de personas, fichas de miembros y traslados de filiales.',
      privilegeNames: ['Ver Miembros', 'Escribir Miembros', 'Ver MiembroIglesia', 'Escribir MiembroIglesia', 'Ver Iglesias', 'Escribir Iglesias']
    },
    {
      categoryName: 'Obreros y Ministerios',
      icon: 'work',
      description: 'Asignación de cargos históricos y responsabilidades de liderazgo.',
      privilegeNames: ['Ver Cargos', 'Escribir Cargos']
    },
    {
      categoryName: 'Eventos y Bautizos',
      icon: 'event',
      description: 'Calendario de eventos anuales, bautizos, talleres y participación.',
      privilegeNames: ['Ver Eventos', 'Escribir Eventos']
    },
    {
      categoryName: 'Certificaciones con QR',
      icon: 'workspace_premium',
      description: 'Emisión de certificados de bautismo y dedicaciones con validación QR.',
      privilegeNames: ['Ver Certificados', 'Escribir Certificados']
    },
    {
      categoryName: 'Configuración y Usuarios',
      icon: 'security',
      description: 'Cuentas de usuario del sistema y configuración de privilegios.',
      privilegeNames: ['Ver Usuarios', 'Escribir Usuarios', 'Ver Privilegios', 'Escribir Privilegios']
    },
    {
      categoryName: 'Auditoría y Consulta',
      icon: 'history',
      description: 'Visualización de reportes, bitácora de auditoría y finanzas.',
      privilegeNames: ['Ver Dashboard', 'Ver Reportes', 'Ver Bitácora', 'Ver Ofrendas', 'Ver Ayuda']
    }
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private privilegioService: PrivilegioService,
    private tipoCargoService: TipoCargoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<PrivilegioDto>([]);
  }

  ngOnInit() {
    this.loadPrivilegios();
    this.loadRoles();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadPrivilegios() {
    this.privilegioService.getAll().subscribe(data => {
      this.todosPrivilegios = data;
      const sorted = [...data];
      sorted.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      this.dataSource.data = sorted;
    });
  }

  loadRoles() {
    this.tipoCargoService.getTipoCargos().subscribe(res => {
      this.rolesDisponibles = res.datos || [];
      
      this.rolesDisponibles.forEach(role => {
        if (role.id) {
          this.privilegioService.getPrivilegiosByRolCargo(role.id).subscribe(data => {
            this.privilegiosPorRolMap[role.id!] = data.map(p => p.id).filter((id): id is number => id !== undefined);
          });
        }
      });

      if (this.rolesDisponibles.length > 0) {
        const adminRole = this.rolesDisponibles.find(r => r.nombreRol === 'ADMIN');
        this.selectedRolCargoId = adminRole ? adminRole.id! : this.rolesDisponibles[0].id!;
        this.loadPrivilegiosPorRol();
      }
    });
  }

  loadPrivilegiosPorRol() {
    if (this.selectedRolCargoId) {
      this.privilegioService.getPrivilegiosByRolCargo(this.selectedRolCargoId).subscribe(data => {
        this.privilegiosPorRol = data;
      });
    }
  }

  seleccionarRol(rolCargoId: number) {
    this.selectedRolCargoId = rolCargoId;
    this.loadPrivilegiosPorRol();
  }

  getSelectedRolName(): string {
    const role = this.rolesDisponibles.find(r => r.id === this.selectedRolCargoId);
    return role ? role.nombre : '';
  }

  get privilegiosDisponibles(): PrivilegioDto[] {
    const idsAsignados = new Set(this.privilegiosPorRol.map(p => p.id));
    return this.todosPrivilegios.filter(p => p.id && !idsAsignados.has(p.id));
  }

  agregarPrivilegio(privilegioId: number) {
    if (this.selectedRolCargoId) {
      this.privilegioService.addPrivilegioToRolCargo(this.selectedRolCargoId, privilegioId).subscribe(() => {
        this.loadPrivilegiosPorRol();
        this.messageSnackBar('Privilegio asignado al rol');
      });
    }
  }

  quitarPrivilegio(privilegioId: number) {
    if (this.selectedRolCargoId) {
      this.privilegioService.removePrivilegioFromRolCargo(this.selectedRolCargoId, privilegioId).subscribe(() => {
        this.loadPrivilegiosPorRol();
        this.messageSnackBar('Privilegio removido del rol');
      });
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(PrivilegioCreateComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPrivilegios();
        this.loadPrivilegiosPorRol();
        this.messageSnackBar(`Privilegio '${result.nombre}' creado`);
      }
    });
  }

  openEditDialog(privilegio: PrivilegioDto) {
    const dialogRef = this.dialog.open(PrivilegioEditComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: privilegio
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPrivilegios();
        this.loadPrivilegiosPorRol();
        this.messageSnackBar(`Privilegio '${privilegio.nombre}' modificado`);
      }
    });
  }

  openDetailDialog(privilegio: PrivilegioDto) {
    this.dialog.open(PrivilegioDetailComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: privilegio
    });
  }

  toggleEstado(privilegio: PrivilegioDto) {
    if (privilegio.id) {
      const action = privilegio.estado ? 'desactivar' : 'activar';
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: `¿Está seguro que desea ${action}?`,
          message: `Está a punto de ${action} el privilegio <strong>${privilegio.nombre}</strong>.`,
          confirmText: privilegio.estado ? 'Desactivar' : 'Activar',
          type: 'warning'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && privilegio.id) {
          const updated: PrivilegioDto = {
            ...privilegio,
            estado: !privilegio.estado
          };
          this.privilegioService.update(privilegio.id, updated).subscribe(() => {
            privilegio.estado = !privilegio.estado;
            this.messageSnackBar(`Privilegio '${privilegio.nombre}' ${privilegio.estado ? 'activado' : 'desactivado'}`);
          });
        }
      });
    }
  }

  messageSnackBar(message: string, type: 'success' | 'warning' | 'error' = 'success') {
    const panelClass = type === 'success' ? 'success-snackbar' : type === 'warning' ? 'warning-snackbar' : 'error-snackbar';
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: [panelClass]
    });
  }

  getRolePrivilegesPercentage(roleId: number): number {
    if (this.todosPrivilegios.length === 0) return 0;
    const assigned = this.privilegiosPorRolMap[roleId] || [];
    return Math.round((assigned.length / this.todosPrivilegios.length) * 100);
  }

  hasPrivilege(roleId: number, privilegeName: string): boolean {
    const assignedIds = this.privilegiosPorRolMap[roleId] || [];
    const priv = this.todosPrivilegios.find(p => p.nombre === privilegeName);
    return !!(priv && priv.id && assignedIds.includes(priv.id));
  }

  togglePrivilege(roleId: number, privilegeName: string) {
    const priv = this.todosPrivilegios.find(p => p.nombre === privilegeName);
    if (!priv || !priv.id) return;
    const privId = priv.id;
    
    const assignedIds = this.privilegiosPorRolMap[roleId] || [];
    const hasIt = assignedIds.includes(privId);
    
    if (hasIt) {
      this.privilegioService.removePrivilegioFromRolCargo(roleId, privId).subscribe(() => {
        this.privilegiosPorRolMap[roleId] = assignedIds.filter(id => id !== privId);
        this.loadPrivilegiosPorRol();
        this.messageSnackBar('Privilegio removido con éxito');
      });
    } else {
      this.privilegioService.addPrivilegioToRolCargo(roleId, privId).subscribe(() => {
        this.privilegiosPorRolMap[roleId] = [...assignedIds, privId];
        this.loadPrivilegiosPorRol();
        this.messageSnackBar('Privilegio asignado con éxito');
      });
    }
  }

  hasAllCategoryPrivileges(roleId: number, category: any): boolean {
    return category.privilegeNames.every((pName: string) => this.hasPrivilege(roleId, pName));
  }

  toggleCategoryPrivileges(roleId: number, category: any) {
    const allActive = this.hasAllCategoryPrivileges(roleId, category);
    const requests = category.privilegeNames.map((pName: string) => {
      const priv = this.todosPrivilegios.find(p => p.nombre === pName);
      if (!priv || !priv.id) return null;
      
      const assignedIds = this.privilegiosPorRolMap[roleId] || [];
      const hasIt = assignedIds.includes(priv.id);
      
      if (allActive && hasIt) {
        return this.privilegioService.removePrivilegioFromRolCargo(roleId, priv.id);
      } else if (!allActive && !hasIt) {
        return this.privilegioService.addPrivilegioToRolCargo(roleId, priv.id);
      }
      return null;
    }).filter((r: any) => r !== null);

    if (requests.length === 0) return;

    forkJoin(requests).subscribe(() => {
      this.privilegioService.getPrivilegiosByRolCargo(roleId).subscribe(data => {
        this.privilegiosPorRolMap[roleId] = data.map(p => p.id).filter((id): id is number => id !== undefined);
        this.loadPrivilegiosPorRol();
        this.messageSnackBar('Categoría de privilegios actualizada');
      });
    });
  }
}
