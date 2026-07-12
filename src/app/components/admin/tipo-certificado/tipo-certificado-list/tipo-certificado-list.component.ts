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
import { TipoCertificadoService } from '../../../../core/services/tipo-certificado.service';
import { TipoCertificado } from '../../../../core/models/tipo-certificado.model';
import { TipoCertificadoCreateComponent } from '../tipo-certificado-create/tipo-certificado-create.component';
import { TipoCertificadoDetailComponent } from '../tipo-certificado-detail/tipo-certificado-detail.component';
import { TipoCertificadoEditComponent } from '../tipo-certificado-edit/tipo-certificado-edit.component';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../../core/services/security/auth.service';
import { HasPrivilegioDirective } from '../../../../core/directives/has-privilegio.directive';

@Component({
  selector: 'app-tipo-certificado-list',
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
    LoadingSpinnerComponent,
    HasPrivilegioDirective
  ],
  templateUrl: './tipo-certificado-list.component.html',
  styleUrls: ['./tipo-certificado-list.component.css']
})
export class TipoCertificadoListComponent implements OnInit {
  isLoading = true;
  displayedColumns: string[] = [];
  dataSource: MatTableDataSource<TipoCertificado>;
  public authService = inject(AuthService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private tipoCertificadoService: TipoCertificadoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<TipoCertificado>([]);
  }

  ngOnInit() {
    this.loadTipoCertificados();
    const isAdmin = this.authService.isLoggedRolAdmin();
    this.displayedColumns = isAdmin ? ['nombre', 'fecha', 'estado', 'acciones'] : ['nombre', 'fecha', 'estado'];
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadTipoCertificados() {
    this.isLoading = true;
    this.tipoCertificadoService.getTipoCertificados().subscribe({
      next: response => {
        const data = Array.isArray(response.datos) ? [...response.datos] : [];
        data.sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA;
        });
        this.dataSource.data = data;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
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
    const dialogRef = this.dialog.open(TipoCertificadoCreateComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTipoCertificados();
        this.messageSnackBar(`Tipo de Certificado '${result.nombre}' creado`);
      }
    });
  }

  openEditDialog(tipoCertificado: TipoCertificado) {
    const dialogRef = this.dialog.open(TipoCertificadoEditComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: tipoCertificado
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTipoCertificados();
        this.messageSnackBar(`Tipo de Certificado '${tipoCertificado.nombre}' modificado`);
      }
    });
  }

  openDetailDialog(tipoCertificado: TipoCertificado) {
    this.dialog.open(TipoCertificadoDetailComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: tipoCertificado
    });
  }

  toggleEstado(tipoCertificado: TipoCertificado) {
    if (tipoCertificado.id) {
      const action = tipoCertificado.estado ? 'desactivar' : 'activar';
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: `¿Está seguro que desea ${action}?`,
          message: `Está a punto de ${action} el tipo de certificado <strong>${tipoCertificado.nombre}</strong>.`,
          confirmText: tipoCertificado.estado ? 'Desactivar' : 'Activar',
          type: 'warning'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && tipoCertificado.id) {
          this.tipoCertificadoService.toggleEstado(tipoCertificado.id).subscribe(newEstado => {
            tipoCertificado.estado = newEstado;
            this.messageSnackBar(`Tipo de Certificado '${tipoCertificado.nombre}' ${newEstado ? 'activado' : 'desactivado'}`);
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
