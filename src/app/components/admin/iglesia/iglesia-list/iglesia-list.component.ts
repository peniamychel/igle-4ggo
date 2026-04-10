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
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { IglesiaCreateComponent } from '../iglesia-create/iglesia-create.component';
import { IglesiaDetailComponent } from '../iglesia-detail/iglesia-detail.component';
import { IglesiaEditComponent } from '../iglesia-edit/iglesia-edit.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { ApiResponse } from '../../../../core/models/interfaces/api.response';

@Component({
  selector: 'app-iglesia-list',
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
    MatDialogModule,
    MatSnackBarModule,
    MatCardModule,
    MatTooltipModule,
  ],
  templateUrl: './iglesia-list.component.html',
  styleUrls: ['./iglesia-list.component.css']
})
export class IglesiaListComponent implements OnInit {
  displayedColumns: string[] = ['nombre', 'direccion', 'telefono', 'fechaFundacion', 'acciones'];
  dataSource: MatTableDataSource<Iglesia>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private iglesiaService: IglesiaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Iglesia>([]);
  }

  /**
   * Inicializa el componente.
   * Carga la lista inicial de iglesias desde el backend.
   */
  ngOnInit() {
    this.loadIglesias();
  }

  /**
   * Configura el paginador y el ordenamiento de la tabla una vez que la vista ha sido inicializada.
   */
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /**
   * Obtiene la lista de iglesias a través del servicio y asigna los datos a la fuente de la tabla.
   */
  loadIglesias() {
    this.iglesiaService.getIglesias().subscribe(response => {
      this.dataSource.data = response.datos;
    });
  }

  /**
   * Aplica un filtro de texto sobre la tabla de iglesias para búsqueda.
   * Si la paginación está activa, reinicia a la primera página.
   * @param event El evento del input de búsqueda.
   */
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  /**
   * Formatea un objeto Date al formato de fecha en español (ej. "1 de enero de 2023").
   * @param date La fecha que será formateada.
   * @returns Un string con la fecha legible.
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Abre un cuadro de diálogo ('MatDialog') para registrar una nueva iglesia.
   * Al cerrar, recarga las iglesias si hubo éxito y notifica al usuario.
   */
  openCreateDialog() {
    const dialogRef = this.dialog.open(IglesiaCreateComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadIglesias();
        this.messageSnackBar(`Iglesia '${result.nombre}' Creada`);
      }
    });
  }

  /**
   * Abre un cuadro de diálogo para editar una iglesia seleccionada.
   * @param iglesia Objeto Iglesia que se va a editar.
   * Actualiza la lista principal y emite un mensaje en caso de guardar correctamente.
   */
  openEditDialog(iglesia: Iglesia) {
    const dialogRef = this.dialog.open(IglesiaEditComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: iglesia
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadIglesias();
        this.messageSnackBar(`Iglesia '${iglesia.nombre}' Modificada`);
      }
    });
  }

  /**
   * Muestra un cuadro de diálogo con los detalles completos de una iglesia.
   * @param iglesia Objeto Iglesia a visualizar.
   */
  openDetailDialog(iglesia: Iglesia) {
    this.dialog.open(IglesiaDetailComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: iglesia
    });
  }

  /**
   * Alterna el estado activo o inactivo de la iglesia correspondiente previa confirmación.
   * @param iglesia Objeto Iglesia a la cual se le cambiará su estado.
   */
  toggleEstado(iglesia: Iglesia) {
    if (iglesia.id) {
      const action = iglesia.estado ? 'desactivar' : 'activar';

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          message: `¿Está seguro que desea ${action} la iglesia <br><strong style="font-size: 1.25em; color: #1976d2; display: block; margin-top: 8px;">${iglesia.nombre}</strong>?`
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && iglesia.id) {
          // this.iglesiaService.updateIglesia(iglesia).subscribe({
          //   next: (response: ApiResponse<Iglesia>) => {
          //     // Aquí recibes tu objeto con success, message y datos
          //     console.log("Éxito:", response.message);
          //     this.messageSnackBar(response.message);
          //   },
          //   error: (err) => {
          //     // Aquí atrapas el 400, 404, 500, etc.
          //     // 'err' es un objeto HttpErrorResponse
          //     const mensajeError = err.error?.message || "Error desconocido al actualizar";
          //     console.error("Error desde Spring Boot:", mensajeError);
          //     this.messageSnackBar(mensajeError);
          //   }
          // });

          this.iglesiaService.toggleEstado(iglesia.id).subscribe(newEstado => {
            iglesia.estado = newEstado;
            this.messageSnackBar(`Iglesia '${iglesia.nombre}' ${newEstado ? 'activada' : 'desactivada'}`);
          });
        }
      });
    }
  }

  /**
   * Muestra un pequeño mensaje de notificación ('SnackBar') temporal en la parte inferior de la pantalla.
   * @param message El texto que se va a desplegar en la notificación.
   */
  messageSnackBar(message: string) {
    this.snackBar.open(
      message, 'Cerrar',
      {
        duration: 3000,
        panelClass: ['alerta-verde']
      }
    );
  }
}
