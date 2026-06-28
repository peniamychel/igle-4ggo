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
import { MatMenuModule } from '@angular/material/menu';
import { CargoService } from '../../../core/services/cargo.service';
import { TipoCargoService } from '../../../core/services/tipo-cargo.service';
import { MiembroIglesiaService } from '../../../core/services/miembro-iglesia.service';
import { AuthService } from '../../../core/services/security/auth.service';
import { Cargo } from '../../../core/models/cargo.model';
import { CargoDetailComponent } from '../cargo/cargo-detail/cargo-detail.component';
import { CargoEditComponent } from '../cargo/cargo-edit/cargo-edit.component';
import { CargoBajaDialogComponent } from '../cargo/cargo-baja-dialog/cargo-baja-dialog.component';
import { DesignarColaboradorComponent } from './designar-colaborador/designar-colaborador.component';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-colaboradores',
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
    MatMenuModule,
    DesignarColaboradorComponent,
    ImageUrlPipe
  ],
  templateUrl: './colaboradores.component.html',
  styleUrls: ['./colaboradores.component.css']
})
export class ColaboradoresComponent implements OnInit {
  displayedColumns: string[] = ['miembro', 'tipoCargo', 'fechaInicio', 'fechaFin', 'estado', 'acciones'];
  dataSource: MatTableDataSource<Cargo>;

  currentChurchId: number | null = null;
  currentChurchNombre: string = '';
  loading = false;

  tiposCargo: any[] = [];
  allCargos: Cargo[] = [];

  // Metrics
  totalColaboradores = 0;
  activosColaboradores = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private authService: AuthService,
    private cargoService: CargoService,
    private tipoCargoService: TipoCargoService,
    private miembroIglesiaService: MiembroIglesiaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Cargo>([]);
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const placeholder = img.nextElementSibling as HTMLElement;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

  ngOnInit() {
    this.currentChurchId = this.authService.getCurrentIglesiaId();
    this.currentChurchNombre = this.authService.getCurrentIglesiaNombre() || 'Mi Iglesia';
    this.loadColaboradores();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.configureSorting();
  }

  configureSorting() {
    this.dataSource.sortingDataAccessor = (item: Cargo, property: string) => {
      const itemAny = item as any;
      switch (property) {
        case 'tipoCargo':
          return itemAny.rolCargo?.nombre ? itemAny.rolCargo.nombre.toLowerCase() : '';
        case 'miembro':
          return itemAny.miembro
            ? `${itemAny.miembro.nombre} ${itemAny.miembro.apellido}`.toLowerCase()
            : '';
        case 'fechaInicio':
          return item.fechaInicio ? new Date(item.fechaInicio).getTime() : 0;
        case 'fechaFin':
          return item.fechaFin ? new Date(item.fechaFin).getTime() : 0;
        case 'estado':
          return item.estado ? 1 : 0;
        default:
          const value = itemAny[property];
          return typeof value === 'string' ? value.toLowerCase() : value;
      }
    };
  }

  /**
   * Carga los colaboradores usando el endpoint /mis-colaboradores que devuelve
   * datos completos de miembro y rolCargo embebidos en una sola llamada.
   * No requiere privilegios adicionales — el pastor puede acceder directamente.
   */
  loadColaboradores() {
    this.loading = true;
    this.cargoService.getMisColaboradores().subscribe({
      next: (response) => {
        const cargos: any[] = Array.isArray(response.datos) ? response.datos : [];
        console.log('[Colaboradores] Cargos recibidos del backend:', cargos.length);

        // Si el backend ya filtró por iglesia (vía getCurrentIglesiaId), usamos todos.
        // Si hay currentChurchId, aplicamos filtro adicional por seguridad en el frontend.
        this.allCargos = this.currentChurchId
          ? cargos.filter(c => Number(c.iglesiaId) === Number(this.currentChurchId))
          : cargos;

        // Para compatibilidad con el template que usa miembroDto y tipoCargoDto,
        // mapeamos los campos embebidos a las propiedades del modelo.
        this.allCargos.forEach((cargo: any) => {
          if (cargo.miembro && !cargo.miembroDto) {
            cargo.miembroDto = cargo.miembro;
          }
          if (cargo.rolCargo && !cargo.tipoCargoDto) {
            cargo.tipoCargoDto = cargo.rolCargo;
          }
        });

        console.log('[Colaboradores] Total después de filtrar:', this.allCargos.length);

        // Ordenar por fecha de actualización descendente
        this.allCargos.sort((a: any, b: any) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA;
        });

        this.dataSource.data = this.allCargos;
        this.calculateMetrics();
        this.loading = false;
      },
      error: (err) => {
        console.error('[Colaboradores] Error cargando colaboradores:', err);
        this.loading = false;
      }
    });
  }

  calculateMetrics() {
    this.totalColaboradores = this.allCargos.length;
    this.activosColaboradores = this.allCargos.filter(c => c.estado).length;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  designarColaborador() {
    if (!this.currentChurchId) return;

    const dialogRef = this.dialog.open(DesignarColaboradorComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: {
        iglesiaId: this.currentChurchId,
        iglesiaNombre: this.currentChurchNombre
      }
    });

    dialogRef.afterClosed().subscribe(dialogRes => {
      if (dialogRes) {
        this.loadColaboradores();
        this.snackBar.open('Colaborador designado con éxito.', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  openDetail(cargo: Cargo) {
    this.dialog.open(CargoDetailComponent, {
      width: '600px',
      data: cargo
    });
  }

  openEdit(cargo: Cargo) {
    const dialogRef = this.dialog.open(CargoEditComponent, {
      width: '600px',
      data: cargo
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.loadColaboradores();
      }
    });
  }

  openDarBaja(cargo: Cargo) {
    const dialogRef = this.dialog.open(CargoBajaDialogComponent, {
      width: '450px',
      data: cargo
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.loadColaboradores();
      }
    });
  }
}
