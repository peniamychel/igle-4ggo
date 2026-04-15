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
  ],
  templateUrl: './tipo-cargo-list.component.html',
  styleUrls: ['./tipo-cargo-list.component.css']
})
export class TipoCargoListComponent implements OnInit {
  displayedColumns: string[] = ['tipo', 'nombre', 'estado', 'acciones'];
  dataSource: MatTableDataSource<TipoCargo>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private tipoCargoService: TipoCargoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
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
      this.dataSource.data = Array.isArray(response.datos) ? response.datos : [];
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
        this.messageSnackBar(`Tipo de Cargo '${result.nombre}' creado`);
      }
    });
  }

  openEditDialog(tipoCargo: TipoCargo) {
    const dialogRef = this.dialog.open(TipoCargoEditComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: tipoCargo
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTipoCargos();
        this.messageSnackBar(`Tipo de Cargo '${tipoCargo.nombre}' modificado`);
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

  toggleEstado(tipoCargo: TipoCargo) {
    if (tipoCargo.id) {
      const action = tipoCargo.estado ? 'desactivar' : 'activar';
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          message: `¿Está seguro que desea ${action} el tipo de cargo <br><strong style="font-size: 1.25em; color: #1976d2; display: block; margin-top: 8px;">${tipoCargo.nombre}</strong>?`
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && tipoCargo.id) {
          this.tipoCargoService.toggleEstado(tipoCargo.id).subscribe(newEstado => {
            tipoCargo.estado = newEstado;
            this.messageSnackBar(`Tipo de Cargo '${tipoCargo.nombre}' ${newEstado ? 'activado' : 'desactivado'}`);
          });
        }
      });
    }
  }

  messageSnackBar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['alerta-verde']
    });
  }
}
