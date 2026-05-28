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
import { CargoService } from '../../../../core/services/cargo.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { TipoCargoService } from '../../../../core/services/tipo-cargo.service';
import { MiembroService } from '../../../../core/services/miembro.service';
import { Cargo } from '../../../../core/models/cargo.model';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { TipoCargo } from '../../../../core/models/tipo-cargo.model';
import { Miembro } from '../../../../core/models/miembro.model';
import { CargoCreateComponent } from '../cargo-create/cargo-create.component';
import { CargoDetailComponent } from '../cargo-detail/cargo-detail.component';
import { CargoEditComponent } from '../cargo-edit/cargo-edit.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-cargo-list',
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
  templateUrl: './cargo-list.component.html',
  styleUrls: ['./cargo-list.component.css']
})
export class CargoListComponent implements OnInit {
  displayedColumns: string[] = ['iglesia', 'tipoCargo', 'miembro', 'fechaInicio', 'fechaFin', 'estado', 'acciones'];
  dataSource: MatTableDataSource<Cargo>;

  iglesias: Iglesia[] = [];
  tiposCargo: TipoCargo[] = [];
  miembros: Miembro[] = [];
  filterRole: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private cargoService: CargoService,
    private iglesiaService: IglesiaService,
    private tipoCargoService: TipoCargoService,
    private miembroService: MiembroService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {
    this.dataSource = new MatTableDataSource<Cargo>([]);
  }

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.filterRole = data['filterRole'] || '';
    });
    this.loadInitialData();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadInitialData() {
    forkJoin({
      iglesias: this.iglesiaService.getIglesias(),
      tiposCargo: this.tipoCargoService.getTipoCargos(),
      miembros: this.miembroService.getMiembros()
    }).subscribe(results => {
      this.iglesias = results.iglesias.datos || [];
      this.tiposCargo = results.tiposCargo.datos || [];
      this.miembros = results.miembros.datos || [];
      this.loadCargos();
    });
  }

  get displayedColumnsForView(): string[] {
    if (this.filterRole) {
      return this.displayedColumns.filter(col => col !== 'tipoCargo' && col !== 'fechaFin');
    }
    return this.displayedColumns.filter(col => col !== 'fechaFin');
  }

  loadCargos() {
    this.cargoService.getCargos().subscribe(response => {
      let cargos = Array.isArray(response.datos) ? response.datos : [];
      cargos.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
      cargos.forEach(cargo => {
        cargo.iglesiaDto = this.iglesias.find(i => i.id === cargo.iglesiaId);
        cargo.tipoCargoDto = this.tiposCargo.find(tc => tc.id === cargo.tipoCargoId);
        cargo.miembroDto = this.miembros.find(m => m.id === cargo.idMiembro);
      });
      
      this.route.data.subscribe(data => {
        const filterRole = data['filterRole'];
        if (filterRole) {
          const normalize = (str: string) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
          this.dataSource.data = cargos.filter(cargo => 
            cargo.tipoCargoDto && normalize(cargo.tipoCargoDto.nombre).includes(normalize(filterRole))
          );
        } else {
          this.dataSource.data = cargos;
        }
      });
    });
  }

  getMiembroNombreCompleto(miembro?: Miembro): string {
    if (!miembro || !miembro.personaDto) return 'N/A';
    return `${miembro.personaDto.nombre} ${miembro.personaDto.apellido}`;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filterPredicate = (data: Cargo, filter: string) => {
      const searchTerms = [
        data.iglesiaDto?.nombre,
        data.tipoCargoDto?.nombre,
        this.getMiembroNombreCompleto(data.miembroDto),
        data.detalle
      ].map(v => (v || '').toLowerCase()).join(' ');
      return searchTerms.includes(filter);
    };
    this.dataSource.filter = filterValue.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(CargoCreateComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: {
        iglesias: this.iglesias,
        tiposCargo: this.tiposCargo,
        miembros: this.miembros,
        filterRole: this.filterRole
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCargos();
        this.messageSnackBar('Cargo creado exitosamente');
      }
    });
  }

  openEditDialog(cargo: Cargo) {
    const dialogRef = this.dialog.open(CargoEditComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: {
        cargo,
        iglesias: this.iglesias,
        tiposCargo: this.tiposCargo,
        miembros: this.miembros
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCargos();
        this.messageSnackBar('Cargo modificado exitosamente');
      }
    });
  }

  openDetailDialog(cargo: Cargo) {
    this.dialog.open(CargoDetailComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: cargo
    });
  }

  toggleEstado(cargo: Cargo) {
    if (cargo.id) {
      const action = cargo.estado ? 'desactivar' : 'activar';
      const cargoName = cargo.tipoCargoDto?.nombre || 'este cargo';
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          message: `¿Está seguro que desea ${action} <br><strong style="font-size: 1.25em; color: #1976d2; display: block; margin-top: 8px;">${cargoName}</strong>?`
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && cargo.id) {
          this.cargoService.toggleEstado(cargo.id).subscribe(newEstado => {
            cargo.estado = newEstado;
            this.messageSnackBar(`Cargo ${newEstado ? 'activado' : 'desactivado'}`);
          });
        }
      });
    }
  }

  deleteCargo(cargo: Cargo) {
    if (cargo.id) {
      const cargoName = cargo.tipoCargoDto?.nombre || 'este cargo';
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          message: `¿Está seguro que desea eliminar <br><strong style="font-size: 1.25em; color: #d32f2f; display: block; margin-top: 8px;">${cargoName}</strong>?<br><br>Esta acción no se puede deshacer.`
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && cargo.id) {
          this.cargoService.deleteCargo(cargo.id).subscribe({
            next: () => {
              this.messageSnackBar('Cargo eliminado exitosamente');
              this.loadCargos();
            },
            error: (err) => {
              const msg = err.status === 409
                ? 'No se puede eliminar el cargo porque tiene registros asociados (eventos, etc).'
                : 'Error al eliminar el cargo.';
              this.snackBar.open(msg, 'Cerrar', { duration: 5000, panelClass: ['alerta-roja'] });
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
