import { Component, OnInit, ViewChild, inject } from '@angular/core';
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
import { MatMenuModule } from '@angular/material/menu';
import { TipoEventoService } from '../../../../core/services/tipo-evento.service';
import { TipoEvento } from '../../../../core/models/tipo-evento.model';
import { TipoEventoCreateComponent } from '../tipo-evento-create/tipo-evento-create.component';
import { TipoEventoDetailComponent } from '../tipo-evento-detail/tipo-evento-detail.component';
import { TipoEventoEditComponent } from '../tipo-evento-edit/tipo-evento-edit.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../../core/services/security/auth.service';
import { HasPrivilegioDirective } from '../../../../core/directives/has-privilegio.directive';

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
    MatMenuModule,
    HasPrivilegioDirective
  ],
  templateUrl: './tipo-evento-list.component.html',
  styleUrls: ['./tipo-evento-list.component.css']
})
export class TipoEventoListComponent implements OnInit {
  displayedColumns: string[] = [];
  dataSource: MatTableDataSource<TipoEvento>;
  public authService = inject(AuthService);

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
    const isAdmin = this.authService.isLoggedRolAdmin();
    this.displayedColumns = isAdmin ? ['nombre', 'estado', 'acciones'] : ['nombre', 'estado'];
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
          title: `¿Está seguro que desea ${action}?`,
          message: `Está a punto de ${action} el tipo de evento <strong>${tipoEvento.nombre}</strong>.`,
          confirmText: tipoEvento.estado ? 'Desactivar' : 'Activar',
          type: 'warning'
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

  deleteTipoEvento(tipoEvento: TipoEvento) {
    if (tipoEvento.id) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: '¿Está seguro que desea eliminar?',
          message: `Está a punto de eliminar permanentemente el tipo de evento <strong>${tipoEvento.nombre}</strong>. Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          type: 'danger'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && tipoEvento.id) {
          this.tipoEventoService.deleteTipoEvento(tipoEvento.id).subscribe({
            next: () => {
              this.loadTipoEventos();
              this.messageSnackBar(`Tipo de Evento '${tipoEvento.nombre}' eliminado exitosamente.`);
            },
            error: (err) => {
              const errMsg = err.error?.message || 'No se pudo eliminar el tipo de evento. Verifique si tiene eventos asociados.';
              this.messageSnackBar(errMsg, 'error');
            }
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
