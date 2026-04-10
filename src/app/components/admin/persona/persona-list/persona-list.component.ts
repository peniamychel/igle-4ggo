import { Component, ElementRef, input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { PersonaService } from '../../../../core/services/persona.service';
import { Persona } from '../../../../core/models/persona.model';
import { PersonaDetailComponent } from '../persona-detail/persona-detail.component';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButtonToggle } from '@angular/material/button-toggle';
import { MatSlideToggle, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioGroup, MatRadioModule } from '@angular/material/radio';
import { PersonaCreateComponent } from '../persona-create/persona-create.component';
import { PersonaEditComponent } from '../persona-edit/persona-edit.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-persona-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSort,
    MatSortModule,
    MatPaginator,
    MatFormField,
    MatInput,
    MatLabel,
    MatSuffix,
    MatButtonToggle,
    MatSlideToggle,
    MatSlideToggleModule,
    MatRadioGroup,
    MatRadioModule,
    MatTooltipModule,
    MatCardModule,
  ],
  templateUrl: './persona-list.component.html',
  styleUrls: ['./persona-list.component.css']
})
export class PersonaListComponent implements OnInit {
  // personas: Persona[] = [];
  personas = new MatTableDataSource<Persona>([]);
  displayedColumns: string[] = ['nombre', 'apellido', 'celular', 'fechaNac', 'sexo', 'acciones'];

  @ViewChild(MatSort) sort!: MatSort;
  // @ViewChild(MatTable) table!: MatTable<Persona>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  // @ViewChild('input') input!: ElementRef;

  constructor(
    private personaService: PersonaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
  }

  /**
   * Inicializa el componente.
   * Carga la lista inicial de personas.
   */
  ngOnInit() {
    this.loadPersonas();
  }

  /**
   * Obtiene la lista de personas desde el servicio y asigna los datos a la fuente de la tabla.
   * También configura el paginador y el ordenamiento de los datos.
   */
  loadPersonas() {
    this.personaService.getPersonas().subscribe(response => {
      this.personas.data = response.datos;
      this.personas.paginator = this.paginator;
      this.personas.sort = this.sort;
    });
  }

  /**
   * Formatea un objeto Date al formato de fecha en español (ej. "1 de enero de 2023").
   * @param date La fecha que será formateada.
   * @returns Un string con la fecha elegible para visualización.
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Abre un cuadro de diálogo ('MatDialog') para registrar una nueva persona.
   * Al cerrar, recarga las personas si la operación fue exitosa y notifica al usuario.
   */
  openCreateDialog() {
    const dialogRef = this.dialog.open(PersonaCreateComponent, {
      width: '900px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPersonas();
        this.messageSnackBar(`Persona '${result.nombre}' Creado`)
      }
    });
  }

  /**
   * Abre un cuadro de diálogo para editar la información de una persona.
   * @param persona El objeto Persona que se va a editar.
   * Si se guardan cambios, recarga la lista principal y notifica al usuario.
   */
  openEditDialog(persona: Persona) {
    const dialogRef = this.dialog.open(PersonaEditComponent, {
      width: '900px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: persona
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPersonas();
        this.messageSnackBar(`Persona '${persona.nombre}' Modificad@`)
      }
    });
  }

  /**
   * Abre un cuadro de diálogo de detalle para ver la información completa de la persona de solo lectura.
   * @param persona El objeto Persona a visualizar.
   */
  openDetailDialog(persona: Persona) {
    this.dialog.open(PersonaDetailComponent, {
      width: '700px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: persona
    });
  }

  /**
   * Modifica el estado activo o inactivo de la persona seleccionada mediante el servicio.
   * @param persona El objeto Persona cuyo estado se modificará.
   */
  toggleEstado(persona: Persona) {
    if (persona.id) {
      const action = persona.estado ? 'desactivar' : 'activar';

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          message: `¿Está seguro que desea ${action} la persona <br><strong style="font-size: 1.25em; color: #1976d2; display: block; margin-top: 8px;">${persona.nombre} ${persona.apellido}</strong>?`
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && persona.id) {
          this.personaService.toggleEstado(persona).subscribe(() => {
            this.loadPersonas();
            this.messageSnackBar(`Persona '${persona.nombre}' ${persona.estado ? 'desactivada' : 'activada'}`);
          });
        }
      });
    }
  }

  /**
   * Aplica un filtro de texto ingresado por el usuario sobre la tabla de personas.
   * Si hay paginación activa, la regresa a la página inicial automáticamente.
   * @param event Evento del DOM que captura el texto del input de búsqueda.
   */
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.personas.filter = filterValue.trim().toLowerCase();

    if (this.personas.paginator) {
      this.personas.paginator.firstPage();
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
