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
import { PrivilegioService } from '../../../../core/services/privilegio.service';
import { PrivilegioDto, PrivilegioResponse } from '../../../../core/models/interfaces/privilegio.interface';
import { PrivilegioCreateComponent } from '../privilegio-create/privilegio-create.component';
import { PrivilegioDetailComponent } from '../privilegio-detail/privilegio-detail.component';
import { PrivilegioEditComponent } from '../privilegio-edit/privilegio-edit.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';

const ROLES = ['ADMIN', 'ENCARGADO_IGLESIA', 'ENCARGADO_EVENTO', 'TESORERO'];

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
  ],
  templateUrl: './privilegio-list.component.html',
  styleUrls: ['./privilegio-list.component.css']
})
export class PrivilegioListComponent implements OnInit {
  displayedColumns: string[] = ['nombre', 'acto', 'estado', 'acciones'];
  dataSource: MatTableDataSource<PrivilegioDto>;

  rolesDisponibles = ROLES;
  selectedRol = 'ADMIN';
  privilegiosPorRol: PrivilegioResponse[] = [];
  todosPrivilegios: PrivilegioDto[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private privilegioService: PrivilegioService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<PrivilegioDto>([]);
  }

  ngOnInit() {
    this.loadPrivilegios();
    this.loadPrivilegiosPorRol();
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

  loadPrivilegiosPorRol() {
    this.privilegioService.getPrivilegiosByRol(this.selectedRol).subscribe(data => {
      this.privilegiosPorRol = data;
    });
  }

  seleccionarRol(rol: string) {
    this.selectedRol = rol;
    this.loadPrivilegiosPorRol();
  }

  get privilegiosDisponibles(): PrivilegioDto[] {
    const idsAsignados = new Set(this.privilegiosPorRol.map(p => p.id));
    return this.todosPrivilegios.filter(p => p.id && !idsAsignados.has(p.id));
  }

  agregarPrivilegio(privilegioId: number) {
    this.privilegioService.addPrivilegioToRol(this.selectedRol, privilegioId).subscribe(() => {
      this.loadPrivilegiosPorRol();
      this.messageSnackBar('Privilegio asignado al rol');
    });
  }

  quitarPrivilegio(privilegioId: number) {
    this.privilegioService.removePrivilegioFromRol(this.selectedRol, privilegioId).subscribe(() => {
      this.loadPrivilegiosPorRol();
      this.messageSnackBar('Privilegio removido del rol');
    });
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
}
