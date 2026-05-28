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
import { TipoEventoService } from '../../../../core/services/tipo-evento.service';
import { TipoEvento } from '../../../../core/models/tipo-evento.model';
import { TipoEventoCreateComponent } from '../tipo-evento-create/tipo-evento-create.component';
import { TipoEventoDetailComponent } from '../tipo-evento-detail/tipo-evento-detail.component';
import { TipoEventoEditComponent } from '../tipo-evento-edit/tipo-evento-edit.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-tipo-evento-list',
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
  templateUrl: './tipo-evento-list.component.html',
  styleUrls: ['./tipo-evento-list.component.css']
})
export class TipoEventoListComponent implements OnInit {
  displayedColumns: string[] = ['nombre', 'estado', 'acciones'];
  dataSource: MatTableDataSource<TipoEvento>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private tipoEventoService: TipoEventoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<TipoEvento>([]);
  }

  ngOnInit() {
    this.loadTipoEventos();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadTipoEventos() {
    this.tipoEventoService.getTipoEventos().subscribe(response => {
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
    const dialogRef = this.dialog.open(TipoEventoCreateComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTipoEventos();
        this.messageSnackBar(`Tipo de Evento '${result.nombre}' creado`);
      }
    });
  }

  openEditDialog(tipoEvento: TipoEvento) {
    const dialogRef = this.dialog.open(TipoEventoEditComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: tipoEvento
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTipoEventos();
        this.messageSnackBar(`Tipo de Evento '${tipoEvento.nombre}' modificado`);
      }
    });
  }

  openDetailDialog(tipoEvento: TipoEvento) {
    this.dialog.open(TipoEventoDetailComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: tipoEvento
    });
  }

  toggleEstado(tipoEvento: TipoEvento) {
    if (tipoEvento.id) {
      const action = tipoEvento.estado ? 'desactivar' : 'activar';
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          message: `¿Está seguro que desea ${action} el tipo de evento <br><strong style="font-size: 1.25em; color: #1976d2; display: block; margin-top: 8px;">${tipoEvento.nombre}</strong>?`
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && tipoEvento.id) {
          this.tipoEventoService.toggleEstado(tipoEvento.id).subscribe(newEstado => {
            tipoEvento.estado = newEstado;
            this.messageSnackBar(`Tipo de Evento '${tipoEvento.nombre}' ${newEstado ? 'activado' : 'desactivado'}`);
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
