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
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { CertificadoService } from '../../../../core/services/certificado.service';
import { EventoService } from '../../../../core/services/evento.service';
import { TipoCertificadoService } from '../../../../core/services/tipo-certificado.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { AuthService } from '../../../../core/services/security/auth.service';
import { Certificado } from '../../../../core/models/certificado.model';
import { Evento } from '../../../../core/models/evento.model';
import { TipoCertificado } from '../../../../core/models/tipo-certificado.model';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { CertificadoCreateComponent } from '../certificado-create/certificado-create.component';
import { CertificadoDetailComponent } from '../certificado-detail/certificado-detail.component';
import { CertificadoEditComponent } from '../certificado-edit/certificado-edit.component';
import { CertificadoPrintDialogComponent } from '../certificado-print-dialog/certificado-print-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { forkJoin } from 'rxjs';
import { CertificadoDesignerComponent } from '../certificado-designer/certificado-designer.component';
import { TipoCertificadoListComponent } from '../../tipo-certificado/tipo-certificado-list/tipo-certificado-list.component';
import { HasPrivilegioDirective } from '../../../../core/directives/has-privilegio.directive';
import { CertificadoVerificarDialogComponent } from '../certificado-verificar-dialog/certificado-verificar-dialog.component';

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
    MatTabsModule,
    MatSelectModule,
    MatMenuModule,
    TipoCertificadoListComponent,
    HasPrivilegioDirective,
    CertificadoPrintDialogComponent,
    CertificadoVerificarDialogComponent
  ],
  templateUrl: './certificado-list.component.html',
  styleUrls: ['./certificado-list.component.css']
})
export class CertificadoListComponent implements OnInit {
  displayedColumns: string[] = ['evento', 'tipoCertificado', 'motivo', 'estado', 'acciones'];
  dataSource: MatTableDataSource<Certificado>;
  eventos: Evento[] = [];
  tiposCertificado: TipoCertificado[] = [];
  iglesias: Iglesia[] = [];

  selectedTipoId: string = 'all';
  selectedEstado: string = 'all';
  selectedIglesiaId: any = 'all';
  searchText: string = '';

  isAdmin = false;
  currentChurchId: number | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private certificadoService: CertificadoService,
    private eventoService: EventoService,
    private tipoCertificadoService: TipoCertificadoService,
    private iglesiaService: IglesiaService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Certificado>([]);
  }

  ngOnInit() {
    this.isAdmin = this.authService.isLoggedRolAdmin();
    if (this.isAdmin) {
      this.displayedColumns = ['evento', 'iglesia', 'tipoCertificado', 'motivo', 'estado', 'acciones'];
      this.loadIglesias();
    } else {
      this.currentChurchId = this.authService.getCurrentIglesiaId();
    }
    this.setupTableModifiers();
    this.loadInitialData();
  }

  private setupTableModifiers() {
    this.dataSource.filterPredicate = (data: Certificado, filter: string) => {
      const textQuery = this.searchText.trim().toLowerCase();
      
      const matchesText = !textQuery || (
        (data.motivoCertificado || '') + ' ' +
        (data.eventoDto?.nombre || '') + ' ' +
        (data.tipoCertificadoDto?.nombre || '')
      ).toLowerCase().includes(textQuery);
      
      const matchesTipo = this.selectedTipoId === 'all' || 
        (data.tipoCertificadoId !== undefined && data.tipoCertificadoId.toString() === this.selectedTipoId);
      
      const matchesEstado = this.selectedEstado === 'all' || 
        (this.selectedEstado === 'active' && data.estado) ||
        (this.selectedEstado === 'inactive' && !data.estado);

      let matchesIglesia = true;
      const certIglesiaId = data.eventoDto?.iglesiaId;
      if (this.isAdmin) {
        matchesIglesia = this.selectedIglesiaId === 'all' || 
          (certIglesiaId !== undefined && certIglesiaId === this.selectedIglesiaId);
      } else if (this.currentChurchId) {
        matchesIglesia = certIglesiaId !== undefined && certIglesiaId === this.currentChurchId;
      }
        
      return matchesText && matchesTipo && matchesEstado && matchesIglesia;
    };
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadIglesias() {
    this.iglesiaService.getIglesias().subscribe(res => {
      this.iglesias = (res.datos || []).filter(i => i.estado);
    });
  }

  getIglesiaNombre(id?: number): string {
    if (!id) return 'General';
    const ig = this.iglesias.find(i => i.id === id);
    return ig ? ig.nombre : `Iglesia #${id}`;
  }

  loadInitialData() {
    forkJoin({
      eventos: this.eventoService.getEventos(),
      tiposCertificado: this.tipoCertificadoService.getTipoCertificados()
    }).subscribe(results => {
      this.eventos = results.eventos.datos || [];
      this.tiposCertificado = (results.tiposCertificado.datos || []).filter(tc => tc.estado);
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
      const eventosMap = new Map<number, Evento>();
      this.eventos.forEach(e => { if (e.id !== undefined) eventosMap.set(e.id, e); });

      const tiposMap = new Map<number, any>();
      this.tiposCertificado.forEach(t => { if (t.id !== undefined) tiposMap.set(t.id, t); });

      certificados.forEach(cert => {
        cert.eventoDto = cert.eventoId !== undefined ? eventosMap.get(cert.eventoId) : undefined;
        cert.tipoCertificadoDto = cert.tipoCertificadoId !== undefined ? tiposMap.get(cert.tipoCertificadoId) : undefined;
      });
      this.dataSource.data = certificados;
      this.applyFilters();
    });
  }

  applyFilters() {
    this.dataSource.filter = '' + Math.random();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onSearchChange(event: Event) {
    this.searchText = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  openVerifyDialog() {
    this.dialog.open(CertificadoVerificarDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile'
    });
  }

  openCreateDialog() {
    let availableEvents = this.eventos;
    if (!this.isAdmin && this.currentChurchId) {
      availableEvents = this.eventos.filter(e => !e.iglesiaId || e.iglesiaId === this.currentChurchId);
    }

    // Excluir eventos que ya tienen un certificado
    const certEventIds = this.dataSource.data
      .map(c => c.eventoId)
      .filter((id): id is number => id !== undefined);
    availableEvents = availableEvents.filter(e => e.id !== undefined && !certEventIds.includes(e.id));

    const dialogRef = this.dialog.open(CertificadoCreateComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: {
        eventos: availableEvents,
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
    let availableEvents = this.eventos;
    if (!this.isAdmin && this.currentChurchId) {
      availableEvents = this.eventos.filter(e => !e.iglesiaId || e.iglesiaId === this.currentChurchId);
    }

    // Excluir eventos que ya tienen un certificado (excepto el actual de este certificado)
    const certEventIds = this.dataSource.data
      .filter(c => c.id !== certificado.id)
      .map(c => c.eventoId)
      .filter((id): id is number => id !== undefined);
    availableEvents = availableEvents.filter(e => e.id !== undefined && !certEventIds.includes(e.id));

    const dialogRef = this.dialog.open(CertificadoEditComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: {
        certificado,
        eventos: availableEvents,
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

  openDesignerDialog(certificado: Certificado) {
    const dialogRef = this.dialog.open(CertificadoDesignerComponent, {
      width: '100vw',
      maxWidth: '100vw',
      height: '100vh',
      panelClass: 'dialog-fullscreen-mobile',
      data: { plantillaId: certificado.plantillaCertificadoId }
    });

    dialogRef.afterClosed().subscribe((savedPlantillaId: number) => {
      console.log('Dialog closed. savedPlantillaId:', savedPlantillaId, 'current:', certificado.plantillaCertificadoId, 'certId:', certificado.id);
      if (savedPlantillaId && savedPlantillaId !== certificado.plantillaCertificadoId && certificado.id) {
        // Link the new/updated template to this certificate
        certificado.plantillaCertificadoId = savedPlantillaId;
        console.log('Updating certificado:', certificado);
        this.certificadoService.updateCertificado(certificado).subscribe({
          next: (res) => {
            console.log('Update success:', res);
            this.loadCertificados();
            this.messageSnackBar('Diseño guardado y vinculado exitosamente');
          },
          error: (err) => {
            console.error('Update error:', err);
            this.messageSnackBar('Error al vincular el diseño al certificado', 'error');
          }
        });
      } else if (savedPlantillaId) {
        console.log('No update needed, or already linked.');
        this.loadCertificados();
        this.messageSnackBar('Diseño actualizado exitosamente');
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

  openPrintDialog(certificado: Certificado) {
    this.dialog.open(CertificadoPrintDialogComponent, {
      width: '800px',
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
          message: `Está a punto de ${action} el certificado del evento <strong>${certificado.eventoDto?.nombre || 'N/A'}</strong>.`,
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

  deleteCertificado(certificado: Certificado) {
    if (certificado.id) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: `¿Está seguro que desea eliminar este certificado?`,
          message: `Está a punto de eliminar el certificado del evento <strong>${certificado.eventoDto?.nombre || 'N/A'}</strong>.<br><br>Esta acción también eliminará permanentemente la plantilla de diseño y sus imágenes asociadas. No se puede deshacer.`,
          confirmText: 'Eliminar',
          type: 'danger'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && certificado.id) {
          this.certificadoService.deleteCertificado(certificado.id).subscribe({
            next: () => {
              this.loadCertificados();
              this.messageSnackBar('Certificado y plantilla eliminados exitosamente');
            },
            error: (err) => {
              console.error('Error al eliminar certificado', err);
              this.messageSnackBar('Error al eliminar el certificado', 'error');
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
