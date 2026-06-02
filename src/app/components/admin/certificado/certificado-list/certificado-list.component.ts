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
import { CertificadoService } from '../../../../core/services/certificado.service';
import { EventoService } from '../../../../core/services/evento.service';
import { TipoCertificadoService } from '../../../../core/services/tipo-certificado.service';
import { Certificado } from '../../../../core/models/certificado.model';
import { Evento } from '../../../../core/models/evento.model';
import { TipoCertificado } from '../../../../core/models/tipo-certificado.model';
import { CertificadoCreateComponent } from '../certificado-create/certificado-create.component';
import { CertificadoDetailComponent } from '../certificado-detail/certificado-detail.component';
import { CertificadoEditComponent } from '../certificado-edit/certificado-edit.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-certificado-list',
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
  templateUrl: './certificado-list.component.html',
  styleUrls: ['./certificado-list.component.css']
})
export class CertificadoListComponent implements OnInit {
  displayedColumns: string[] = ['codigo', 'evento', 'tipoCertificado', 'motivo', 'estado', 'acciones'];
  dataSource: MatTableDataSource<Certificado>;
  eventos: Evento[] = [];
  tiposCertificado: TipoCertificado[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private certificadoService: CertificadoService,
    private eventoService: EventoService,
    private tipoCertificadoService: TipoCertificadoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Certificado>([]);
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
      tiposCertificado: this.tipoCertificadoService.getTipoCertificados()
    }).subscribe(results => {
      this.eventos = results.eventos.datos || [];
      this.tiposCertificado = results.tiposCertificado.datos || [];
      this.loadCertificados();
    });
  }

  loadCertificados() {
    this.certificadoService.getCertificados().subscribe(response => {
      let certificados = Array.isArray(response.datos) ? response.datos : [];
      certificados.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
      certificados.forEach(cert => {
        cert.eventoDto = this.eventos.find(e => e.id === cert.eventoId);
        cert.tipoCertificadoDto = this.tiposCertificado.find(tc => tc.id === cert.tipoCertificadoId);
      });
      this.dataSource.data = certificados;
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filterPredicate = (data: Certificado, filter: string) => {
      const searchTerms = [
        data.codigoCertificado,
        data.motivoCertificado,
        data.eventoDto?.nombre,
        data.tipoCertificadoDto?.nombre
      ].map(v => (v || '').toLowerCase()).join(' ');
      return searchTerms.includes(filter);
    };
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(CertificadoCreateComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: {
        eventos: this.eventos,
        tiposCertificado: this.tiposCertificado
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCertificados();
        this.messageSnackBar('Certificado creado exitosamente');
      }
    });
  }

  openEditDialog(certificado: Certificado) {
    const dialogRef = this.dialog.open(CertificadoEditComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: {
        certificado,
        eventos: this.eventos,
        tiposCertificado: this.tiposCertificado
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCertificados();
        this.messageSnackBar('Certificado modificado exitosamente');
      }
    });
  }

  openDetailDialog(certificado: Certificado) {
    this.dialog.open(CertificadoDetailComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: certificado
    });
  }

  toggleEstado(certificado: Certificado) {
    if (certificado.id) {
      const action = certificado.estado ? 'desactivar' : 'activar';
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: `¿Está seguro que desea ${action}?`,
          message: `Está a punto de ${action} el certificado <strong>${certificado.codigoCertificado}</strong>.`,
          confirmText: certificado.estado ? 'Desactivar' : 'Activar',
          type: 'warning'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && certificado.id) {
          this.certificadoService.toggleEstado(certificado.id).subscribe(newEstado => {
            certificado.estado = newEstado;
            this.messageSnackBar(`Certificado ${newEstado ? 'activado' : 'desactivado'}`);
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
