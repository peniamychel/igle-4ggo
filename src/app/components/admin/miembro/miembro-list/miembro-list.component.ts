import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MiembroService } from '../../../../core/services/miembro.service';
import { Miembro } from '../../../../core/models/miembro.model';
import { MiembroCreateComponent } from '../miembro-create/miembro-create.component';
import { MiembroDetailComponent } from '../miembro-detail/miembro-detail.component';
import { MiembroFormEditarComponent } from '../miembro-edit/miembro-edit.component';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-miembro-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatSuffix,
    MatPaginator,
    MatSort,
    MatSortHeader,
    MatTooltipModule,
    ImageUrlPipe
  ],
  templateUrl: './miembro-list.component.html',
  styleUrls: ['./miembro-list.component.css']
})
export class MiembroListComponent implements OnInit {
  miembros = new MatTableDataSource<Miembro>([]);
  displayedColumns: string[] = ['foto', 'nombreCompleto', 'celular', 'direccion', 'fechaConvercion', 'sexo', 'acciones'];

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private miembroService: MiembroService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.setupTableModifiers();
    this.loadMiembros();
  }

  private setupTableModifiers() {
    this.miembros.sortingDataAccessor = (item: Miembro, property: string) => {
      switch (property) {
        case 'nombreCompleto':
          return (item.nombre || '').toLowerCase() + ' ' + (item.apellido || '').toLowerCase();
        case 'celular':
          return item.celular || '';
        case 'direccion':
          return (item.direccion || '').toLowerCase();
        case 'fechaConvercion':
          return item.fechaConvercion ? new Date(item.fechaConvercion).getTime() : 0;
        case 'sexo':
          return (item.sexo || '').toLowerCase();
        default:
          return (item as any)[property];
      }
    };

    this.miembros.filterPredicate = (data: Miembro, filter: string) => {
      const searchString = (
        (data.nombre || '') + ' ' +
        (data.apellido || '') + ' ' +
        (data.celular || '') + ' ' +
        (data.direccion || '') + ' ' +
        (data.sexo || '')
      ).toLowerCase();
      return searchString.indexOf(filter) !== -1;
    };
  }

  loadMiembros() {
    this.miembroService.getMiembros().subscribe(response => {
      const data = [...response.datos];
      data.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
      this.miembros.data = data;
    });
  }

  ngAfterViewInit() {
    this.miembros.paginator = this.paginator;
    this.miembros.sort = this.sort;
  }

  formatDate(date: Date | null | undefined): string {
    if (!date) return 'No definido';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(MiembroCreateComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMiembros();
      }
    });
  }

  openEditDialog(miembro: Miembro) {
    const dialogRef = this.dialog.open(MiembroFormEditarComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: miembro,
      panelClass: 'dialog-fullscreen-mobile'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMiembros();
        this.messageSnackBar('Miembro actualizado exitosamente');
      }
    });
  }

  openDetailDialog(miembro: Miembro) {
    this.dialog.open(MiembroDetailComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: miembro,
      panelClass: 'dialog-fullscreen-mobile'
    });
  }

  toggleEstado(miembro: Miembro) {
    if (miembro.id) {
      const action = miembro.estado ? 'desactivar' : 'activar';

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: `¿Está seguro que desea ${action}?`,
          message: `Está a punto de ${action} al miembro <strong>${miembro.nombre} ${miembro.apellido}</strong>.`,
          confirmText: miembro.estado ? 'Desactivar' : 'Activar',
          type: 'warning'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && miembro.id) {
          this.miembroService.toggleEstado(miembro.id).subscribe(() => {
            this.loadMiembros();
            this.messageSnackBar(`Miembro '${miembro.nombre}' ${miembro.estado ? 'desactivado' : 'activado'}`);
          });
        }
      });
    }
  }

  deleteMiembro(miembro: Miembro) {
    if (miembro.id) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: '¿Está seguro que desea eliminar?',
          message: `Está a punto de eliminar permanentemente al miembro <strong>${miembro.nombre} ${miembro.apellido}</strong>. Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          type: 'danger'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && miembro.id) {
          this.miembroService.deleteMiembro(miembro.id).subscribe({
            next: () => {
              this.loadMiembros();
              this.messageSnackBar(`Miembro '${miembro.nombre} ${miembro.apellido}' eliminado exitosamente.`);
            },
            error: (err) => {
              this.messageSnackBar('No se pudo eliminar al miembro. Verifique si tiene cargos, registros o participaciones asociadas.', 'error');
            }
          });
        }
      });
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.miembros.filter = filterValue.trim().toLowerCase();

    if (this.miembros.paginator) {
      this.miembros.paginator.firstPage();
    }
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const placeholder = img.nextElementSibling as HTMLElement;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

  messageSnackBar(message: string, type: 'success' | 'warning' | 'error' = 'success') {
    const panelClass = type === 'success' ? 'success-snackbar' : type === 'warning' ? 'warning-snackbar' : 'error-snackbar';
    this.snackBar.open(
      message, 'Cerrar', { duration: 3000, panelClass: [panelClass] }
    );
  }
}
