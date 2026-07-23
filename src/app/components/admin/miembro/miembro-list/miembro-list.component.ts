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
import { MatFormField } from '@angular/material/form-field';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { HasPrivilegioDirective } from '../../../../core/directives/has-privilegio.directive';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { MiembroIglesiaFormTraspasoComponent } from '../../miembro-iglesia/modals/miembro-iglesia-form-traspaso/miembro-iglesia-form.component';
import { AuthService } from '../../../../core/services/security/auth.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generarDirectorioMiembrosPdf } from '../../../../shared/utils/directorio-pdf.util';
import { MiembroImportReportDialogComponent } from '../miembro-import-report-dialog/miembro-import-report-dialog.component';

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
    MatPaginator,
    MatSort,
    MatSortHeader,
    MatTooltipModule,
    MatSelectModule,
    MatMenuModule,
    MatDividerModule,
    ImageUrlPipe,
    HasPrivilegioDirective,
    LoadingSpinnerComponent
  ],
  templateUrl: './miembro-list.component.html',
  styleUrls: ['./miembro-list.component.css']
})
export class MiembroListComponent implements OnInit {
  miembros = new MatTableDataSource<Miembro>([]);
  iglesias: Iglesia[] = [];
  
  // Columnas actualizadas segun el mockup
  displayedColumns: string[] = ['miembro', 'contacto', 'iglesia', 'bautismo', 'estado', 'acciones'];

  isAdmin = false;
  isLoading = true;
  selectedIglesiaId: string = 'all';
  selectedEstado: string = 'all';
  searchText: string = '';

  // Server-side pagination parameters
  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private miembroService: MiembroService,
    private iglesiaService: IglesiaService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.isAdmin = this.authService.isLoggedRolAdmin();
    this.loadMiembros();
    if (this.isAdmin) {
      this.loadIglesias();
    }
  }

  loadMiembros() {
    const estadoBool = this.selectedEstado === 'active' ? true : (this.selectedEstado === 'inactive' ? false : undefined);
    this.isLoading = true;

    this.miembroService.getMiembrosPaged(
      this.pageIndex,
      this.pageSize,
      this.searchText,
      estadoBool,
      this.selectedIglesiaId
    ).subscribe({
      next: (response) => {
        if (response && response.datos) {
          this.miembros.data = response.datos.content || [];
          this.totalElements = response.datos.totalElements || 0;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar miembros:', err);
        this.messageSnackBar('Error al cargar la lista de miembros', 'error');
        this.isLoading = false;
      }
    });
  }

  loadIglesias() {
    this.iglesiaService.getIglesias().subscribe(res => {
      this.iglesias = res.datos.filter(i => i.estado);
    });
  }

  ngAfterViewInit() {
    this.miembros.sort = this.sort;
  }

  applyFilters() {
    this.pageIndex = 0;
    this.loadMiembros();
  }

  onSearchChange(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchText = filterValue;
    this.applyFilters();
  }

  onPageChange(event: any) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadMiembros();
  }

  formatDate(date: Date | null | undefined): string {
    if (!date) return 'No definido';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getAge(fechaNac: Date | string | null | undefined): string {
    if (!fechaNac) return 'Edad desconocida';
    const birth = new Date(fechaNac);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} años`;
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
      width: '800px',
      maxWidth: '95vw',
      data: miembro,
      panelClass: 'dialog-fullscreen-mobile'
    });
  }

  openTraspasoDialog(miembro: Miembro) {
    const sourceIglesia = this.iglesias.find(i => i.nombre === miembro.iglesiaNombre);
    if (!sourceIglesia) {
      this.messageSnackBar('El miembro no pertenece a ninguna iglesia activa para realizar un traspaso.', 'warning');
      return;
    }

    const dialogRef = this.dialog.open(MiembroIglesiaFormTraspasoComponent, {
      width: '600px',
      data: { miembro, iglesia: sourceIglesia },
      panelClass: 'dialog-fullscreen-mobile'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMiembros();
        this.messageSnackBar('Traspaso de iglesia registrado exitosamente');
      }
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

  generateDirectorPdf() {
    // Traer TODOS los miembros que cumplen el filtro actual (no solo la página
    // visible), respetando la iglesia, el estado y la búsqueda seleccionados.
    const estadoBool = this.selectedEstado === 'active' ? true : (this.selectedEstado === 'inactive' ? false : undefined);
    const iglesiaFiltrada = this.selectedIglesiaId && this.selectedIglesiaId !== 'all' ? this.selectedIglesiaId : null;

    this.miembroService.getMiembrosPaged(0, 100000, this.searchText, estadoBool, this.selectedIglesiaId).subscribe({
      next: (response) => {
        try {
          const rows = response?.datos?.content || [];
          generarDirectorioMiembrosPdf(rows, {
            subtitulo: iglesiaFiltrada
              ? `Directorio de Miembros — ${iglesiaFiltrada}`
              : 'Directorio General de Miembros',
            fileName: iglesiaFiltrada
              ? `Directorio_Miembros_${iglesiaFiltrada}.pdf`
              : 'Directorio_Miembros.pdf'
          });
          this.messageSnackBar('Directorio PDF generado exitosamente');
        } catch (e) {
          console.error(e);
          this.messageSnackBar('Error al generar PDF', 'error');
        }
      },
      error: (e) => {
        console.error(e);
        this.messageSnackBar('Error al generar PDF', 'error');
      }
    });
  }

  generateCardsPdf() {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Movimiento Cristiano Misionero Maranatha', 14, 15);
      doc.setFontSize(14);
      doc.text('Listado para Carnets de Miembros', 14, 23);
      doc.setFontSize(10);
      doc.text(`Total Carnets: ${this.miembros.filteredData.length}`, 14, 30);
      doc.text(`Fecha de Impresión: ${new Date().toLocaleDateString()}`, 140, 30);

      const tableColumn = ['CI', 'Miembro', 'Iglesia', 'Rol/Cargo', 'Estado'];
      const tableRows = this.miembros.filteredData.map(m => [
        m.ci || 'N/A',
        `${m.nombre} ${m.apellido}`,
        m.iglesiaNombre || 'Sin Iglesia',
        m.cargoNombre || 'Miembro',
        m.estado ? 'Activo' : 'Inactivo'
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [11, 133, 127] }, // accent teal
        margin: { top: 35 }
      });

      doc.save('Carnets_Miembros.pdf');
      this.messageSnackBar('Carnets PDF generados exitosamente');
    } catch (e) {
      console.error(e);
      this.messageSnackBar('Error al generar Carnets PDF', 'error');
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

  descargarPlantilla() {
    this.miembroService.downloadTemplate().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Plantilla_Miembros.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.messageSnackBar('Plantilla descargada con éxito', 'success');
      },
      error: () => {
        this.messageSnackBar('Error al descargar la plantilla', 'error');
      }
    });
  }

  importarExcel(event: Event) {
    const element = event.target as HTMLInputElement; // use event.target instead of event.currentTarget to clear value afterwards
    let fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];

      // El backend enruta según el rol: el admin asigna la iglesia de cada miembro
      // desde la columna "Iglesia" de la plantilla; pastor/obrero usan su iglesia del token.
      this.miembroService.importExcel(file).subscribe({
        next: (res) => {
          this.loadMiembros();
          element.value = '';
          if (res?.datos?.importados) {
            this.dialog.open(MiembroImportReportDialogComponent, {
              width: '760px',
              maxWidth: '95vw',
              panelClass: 'dialog-fullscreen-mobile',
              data: res.datos
            });
          } else {
            this.messageSnackBar(res.message || 'Membresía importada con éxito.', 'success');
          }
        },
        error: (err) => {
          this.messageSnackBar('Error al importar archivo. Verifique el formato.', 'error');
          element.value = '';
        }
      });
    }
  }
}

