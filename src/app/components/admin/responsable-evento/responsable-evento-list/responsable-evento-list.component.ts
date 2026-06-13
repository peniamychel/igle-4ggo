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
import { ResponsableEventoService } from '../../../../core/services/responsable-evento.service';
import { EventoService } from '../../../../core/services/evento.service';
import { CargoService } from '../../../../core/services/cargo.service';
import { TipoCargoService } from '../../../../core/services/tipo-cargo.service';
import { MiembroService } from '../../../../core/services/miembro.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { ResponsableEvento } from '../../../../core/models/responsable-evento.model';
import { Evento } from '../../../../core/models/evento.model';
import { Cargo } from '../../../../core/models/cargo.model';
import { TipoCargo } from '../../../../core/models/tipo-cargo.model';
import { Miembro } from '../../../../core/models/miembro.model';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { ResponsableEventoCreateComponent } from '../responsable-evento-create/responsable-evento-create.component';
import { ResponsableEventoDetailComponent } from '../responsable-evento-detail/responsable-evento-detail.component';
import { ResponsableEventoEditComponent } from '../responsable-evento-edit/responsable-evento-edit.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-responsable-evento-list',
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
  templateUrl: './responsable-evento-list.component.html',
  styleUrls: ['./responsable-evento-list.component.css']
})
export class ResponsableEventoListComponent implements OnInit {
  displayedColumns: string[] = ['evento', 'responsable', 'estado', 'acciones'];
  dataSource: MatTableDataSource<ResponsableEvento>;
  eventos: Evento[] = [];
  cargos: Cargo[] = [];
  tiposCargo: TipoCargo[] = [];
  miembros: Miembro[] = [];
  iglesias: Iglesia[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private responsableService: ResponsableEventoService,
    private eventoService: EventoService,
    private cargoService: CargoService,
    private tipoCargoService: TipoCargoService,
    private miembroService: MiembroService,
    private iglesiaService: IglesiaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<ResponsableEvento>([]);
  }

  ngOnInit() {
    this.loadInitialData();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadInitialData() {
    forkJoin({
      eventos: this.eventoService.getEventos(),
      cargos: this.cargoService.getCargos(),
      tiposCargo: this.tipoCargoService.getTipoCargos(),
      miembros: this.miembroService.getMiembros(),
      iglesias: this.iglesiaService.getIglesias()
    }).subscribe(results => {
      this.eventos = results.eventos.datos || [];
      this.cargos = results.cargos.datos || [];
      this.tiposCargo = results.tiposCargo.datos || [];
      this.miembros = results.miembros.datos || [];
      this.iglesias = results.iglesias.datos || [];
      this.resolveCargos();
      this.loadResponsables();
    });
  }

  private resolveCargos() {
    this.cargos.forEach(cargo => {
      cargo.tipoCargoDto = this.tiposCargo.find(tc => tc.id === cargo.tipoCargoId);
      cargo.miembroDto = this.miembros.find(m => m.id === cargo.idMiembro);
      cargo.iglesiaDto = this.iglesias.find(i => i.id === cargo.iglesiaId);
    });
  }

  loadResponsables() {
    this.responsableService.getResponsables().subscribe(response => {
      let responsables = Array.isArray(response.datos) ? response.datos : [];
      responsables.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
      responsables.forEach(r => {
        r.eventoDto = this.eventos.find(e => e.id === r.eventoId);
        r.cargoDto = this.cargos.find(c => c.id === r.cargoId);
      });
      this.dataSource.data = responsables;
    });
  }

  getResponsableNombre(item: ResponsableEvento): string {
    if (!item.cargoDto || !item.cargoDto.miembroDto) return 'N/A';
    const p = item.cargoDto.miembroDto;
    const tipo = item.cargoDto.tipoCargoDto?.nombre || '';
    const iglesia = item.cargoDto.iglesiaDto?.nombre || '';
    const nombreBase = `${p.nombre} ${p.apellido}${tipo ? ` (${tipo})` : ''}`;
    return iglesia ? `${nombreBase} - ${iglesia}` : nombreBase;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filterPredicate = (data: ResponsableEvento, filter: string) => {
      const searchTerms = [
        data.eventoDto?.nombre,
        this.getResponsableNombre(data)
      ].map(v => (v || '').toLowerCase()).join(' ');
      return searchTerms.includes(filter);
    };
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(ResponsableEventoCreateComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: {
        eventos: this.eventos,
        cargos: this.cargos
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadResponsables();
        this.messageSnackBar('Responsable asignado exitosamente');
      }
    });
  }

  openEditDialog(responsable: ResponsableEvento) {
    const dialogRef = this.dialog.open(ResponsableEventoEditComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: {
        responsable,
        eventos: this.eventos,
        cargos: this.cargos
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadResponsables();
        this.messageSnackBar('Responsable modificado exitosamente');
      }
    });
  }

  openDetailDialog(responsable: ResponsableEvento) {
    this.dialog.open(ResponsableEventoDetailComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: responsable
    });
  }

  toggleEstado(responsable: ResponsableEvento) {
    if (responsable.id) {
      const action = responsable.estado ? 'desactivar' : 'activar';
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: `¿Está seguro que desea ${action}?`,
          message: `Está a punto de ${action} este responsable de evento.`,
          confirmText: responsable.estado ? 'Desactivar' : 'Activar',
          type: 'warning'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && responsable.id) {
          this.responsableService.toggleEstado(responsable.id).subscribe(newEstado => {
            responsable.estado = newEstado;
            this.messageSnackBar(`Responsable ${newEstado ? 'activado' : 'desactivado'}`);
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
