import { Component, OnInit, ViewChild, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { TipoCargoService } from '../../../../core/services/tipo-cargo.service';
import { TipoCargo } from '../../../../core/models/tipo-cargo.model';
import { TipoCargoCreateComponent } from '../tipo-cargo-create/tipo-cargo-create.component';
import { TipoCargoDetailComponent } from '../tipo-cargo-detail/tipo-cargo-detail.component';
import { TipoCargoEditComponent } from '../tipo-cargo-edit/tipo-cargo-edit.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-tipo-cargo-list',
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
    MatMenuModule
  ],
  templateUrl: './tipo-cargo-list.component.html',
  styleUrls: ['./tipo-cargo-list.component.css']
})
export class TipoCargoListComponent implements OnInit {
  displayedColumns: string[] = ['tipo', 'nombre', 'nombreRol', 'estado', 'acciones'];
  dataSource: MatTableDataSource<TipoCargo>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private tipoCargoService: TipoCargoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    @Optional() public dialogRef?: MatDialogRef<TipoCargoListComponent>
  ) {
    this.dataSource = new MatTableDataSource<TipoCargo>([]);
  }

  ngOnInit() {
    this.loadTipoCargos();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadTipoCargos() {
    this.tipoCargoService.getTipoCargos().subscribe(response => {
      const data = Array.isArray(response.datos) ? [...response.datos] : [];
      data.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
      this.dataSource.data = data;
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
    const dialogRef = this.dialog.open(TipoCargoCreateComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTipoCargos();
        this.messageSnackBar(`Tipo Ministerio '${result.nombre}' creado`);
      }
    });
  }

  openEditDialog(tipoCargo: TipoCargo) {
    if (this.isAdminRole(tipoCargo)) {
      this.messageSnackBar('No se puede editar el rol Administrador', 'warning');
      return;
    }
    const dialogRef = this.dialog.open(TipoCargoEditComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: tipoCargo
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTipoCargos();
        this.messageSnackBar(`Tipo Ministerio '${tipoCargo.nombre}' modificado`);
      }
    });
  }

  openDetailDialog(tipoCargo: TipoCargo) {
    this.dialog.open(TipoCargoDetailComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: tipoCargo
    });
  }

  isAdminRole(tipoCargo: TipoCargo): boolean {
    return tipoCargo.nombreRol === 'ADMIN';
  }

  toggleEstado(tipoCargo: TipoCargo) {
    if (this.isAdminRole(tipoCargo)) {
      this.messageSnackBar('No se puede desactivar el rol Administrador', 'warning');
      return;
    }
    if (tipoCargo.id) {
      const action = tipoCargo.estado ? 'desactivar' : 'activar';
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: `¿Está seguro que desea ${action}?`,
          message: `Está a punto de ${action} el tipo ministerio <strong>${tipoCargo.nombre}</strong>.`,
          confirmText: tipoCargo.estado ? 'Desactivar' : 'Activar',
          type: 'warning'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && tipoCargo.id) {
          this.tipoCargoService.toggleEstado(tipoCargo.id).subscribe(response => {
            tipoCargo.estado = response.datos.estado;
            this.messageSnackBar(`Tipo Ministerio '${tipoCargo.nombre}' ${response.datos.estado ? 'activado' : 'desactivado'}`);
          });
        }
      });
    }
  }

  deleteTipoCargo(tipoCargo: TipoCargo) {
    if (this.isAdminRole(tipoCargo)) {
      this.messageSnackBar('No se puede eliminar el rol Administrador', 'warning');
      return;
    }
    if (!tipoCargo.id) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '¿Está seguro que desea eliminar?',
        message: `Está a punto de eliminar el tipo ministerio <strong>${tipoCargo.nombre}</strong>. Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && tipoCargo.id) {
        this.tipoCargoService.deleteTipoCargo(tipoCargo.id).subscribe({
          next: () => {
            this.loadTipoCargos();
            this.messageSnackBar(`Tipo Ministerio '${tipoCargo.nombre}' eliminado`);
          },
          error: () => {
            this.messageSnackBar('Error al eliminar el tipo ministerio', 'error');
          }
        });
      }
    });
  }

  messageSnackBar(message: string, type: 'success' | 'warning' | 'error' = 'success') {
    const panelClass = type === 'success' ? 'success-snackbar' : type === 'warning' ? 'warning-snackbar' : 'error-snackbar';
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: [panelClass]
    });
  }
}
