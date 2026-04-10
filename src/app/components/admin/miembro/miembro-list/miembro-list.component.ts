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
import { Persona } from '../../../../core/models/persona.model';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';

/**
 * Lista de todos los Miembros en una tabla
 */
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
    MatSort,
    MatSortHeader,
    MatTooltipModule
  ],

  templateUrl: './miembro-list.component.html',
  styleUrls: ['./miembro-list.component.css']

})

export class MiembroListComponent implements OnInit {
  miembros = new MatTableDataSource<Miembro>([]);
  miembros2: Miembro[] = [];
  displayedColumns: string[] = ['nombreCompleto', 'celular', 'direccion', 'fechaConvercion', 'sexo', 'acciones'];

  @ViewChild(MatSort) sort!: MatSort;
  // @ViewChild(MatTable) table!: MatTable<Persona>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  // @ViewChild('input') input!: ElementRef;

  constructor(
    private miembroService: MiembroService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  /**
   * Inicializa el componente.
   * Configura los filtros, el ordenamiento de la tabla y carga la lista de miembros inicial.
   */
  ngOnInit() {
    this.setupTableModifiers();
    this.loadMiembros();
  }

  /**
   * Configura las reglas de ordenamiento y filtrado personalizadas para la tabla.
   * Maneja correctamente los campos anidados dentro de `personaDto` y formatea la `fechaConvercion` para el ordenamiento.
   */
  private setupTableModifiers() {
    this.miembros.sortingDataAccessor = (item: Miembro, property: string) => {
      switch (property) {
        case 'nombreCompleto':
          return (item.personaDto?.nombre || '').toLowerCase() + ' ' + (item.personaDto?.apellido || '').toLowerCase();
        case 'celular':
          return item.personaDto?.celular || '';
        case 'direccion':
          return (item.personaDto?.direccion || '').toLowerCase();
        case 'fechaConvercion':
          return item.fechaConvercion ? new Date(item.fechaConvercion).getTime() : 0;
        case 'sexo':
          return (item.personaDto?.sexo || '').toLowerCase();
        default:
          return (item as any)[property];
      }
    };

    this.miembros.filterPredicate = (data: Miembro, filter: string) => {
      const searchString = (
        (data.personaDto?.nombre || '') + ' ' +
        (data.personaDto?.apellido || '') + ' ' +
        (data.personaDto?.celular || '') + ' ' +
        (data.personaDto?.direccion || '') + ' ' +
        (data.personaDto?.sexo || '')
      ).toLowerCase();
      return searchString.indexOf(filter) !== -1;
    };
  }

  /**
   * Carga la lista de miembros desde el servicio backend y la asigna al `dataSource` de la tabla.
   */
  loadMiembros() {
    this.miembroService.getMiembros().subscribe(response => {
      this.miembros.data = response.datos;

    });
  }

  /**
   * Configura el paginador y el ordenamiento de la tabla una vez que la vista ha sido inicializada.
   */
  ngAfterViewInit() {
    this.miembros.paginator = this.paginator;
    this.miembros.sort = this.sort;
  }

  /**
   * Formatea una fecha al formato local de España (ej. "1 de enero de 2023").
   * @param date La fecha a formatear. Puede ser nula o indefinida.
   * @returns Un string con la fecha formateada o 'No definido' si la fecha es nula.
   */
  formatDate(date: Date | null | undefined): string {
    if (!date) return 'No definido';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Abre un cuadro de diálogo para crear un nuevo miembro.
   * Al cerrar el diálogo, si hubo un resultado exitoso, recarga la lista de miembros.
   */
  openCreateDialog() {
    const dialogRef = this.dialog.open(MiembroCreateComponent, {
      width: '600px !important'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMiembros();
      }
    });
  }

  /**
   * Abre un cuadro de diálogo para editar un miembro existente.
   * @param miembro El objeto Miembro a editar.
   * Al cerrar el diálogo, recarga la lista si hubo cambios.
   */
  openEditDialog(miembro: Miembro) {
    const dialogRef = this.dialog.open(MiembroFormEditarComponent, {
      width: '600px !important',
      data: miembro
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMiembros();
      }
    });
  }

  /**
   * Abre un cuadro de diálogo mostrando los detalles completos de un miembro.
   * @param miembro El objeto Miembro a visualizar en detalle.
   */
  openDetailDialog(miembro: Miembro) {
    this.dialog.open(MiembroDetailComponent, {
      width: '600px !important',
      data: miembro
    });
  }

  /**
   * Modifica el estado activo o inactivo de un miembro mediante el servicio backend tras confirmación.
   * @param miembro El miembro cuyo estado se va a alternar.
   */
  toggleEstado(miembro: Miembro) {
    if (miembro.id) {
      const action = miembro.estado ? 'desactivar' : 'activar';

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          message: `¿Está seguro que desea ${action} al miembro <br><strong style="font-size: 1.25em; color: #1976d2; display: block; margin-top: 8px;">${miembro.personaDto?.nombre} ${miembro.personaDto?.apellido}</strong>?`
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && miembro.id) {
          this.miembroService.toggleEstado(miembro.id).subscribe(() => {
            this.loadMiembros();
            this.messageSnackBar(`Miembro '${miembro.personaDto?.nombre}' ${miembro.estado ? 'desactivado' : 'activado'}`);
          });
        }
      });
    }
  }

  /**
   * Aplica el texto ingresado por el usuario en el buscador como filtro sobre la tabla de miembros.
   * Si hay un paginador activo, lo regresa a la primera página.
   * @param event El evento desencadenado por el input de búsqueda.
   */
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.miembros.filter = filterValue.trim().toLowerCase();

    if (this.miembros.paginator) {
      this.miembros.paginator.firstPage();
    }
  }

  /**
   * Despliega un aviso ('SnackBar') persistente por un periodo corto de tiempo.
   * @param message El mensaje descriptivo a mostrar en la notificación.
   */
  messageSnackBar(message: string) {
    this.snackBar.open(
      message, 'Cerrar', { duration: 3000, panelClass: ['success-snackbar'] }
    );
  }

}
