import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { MiembroService } from '../../../../core/services/miembro.service';
import { MiembroIglesiaService } from '../../../../core/services/miembro-iglesia.service';
import { CargoService } from '../../../../core/services/cargo.service';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { Miembro } from '../../../../core/models/miembro.model';
import { Cargo } from '../../../../core/models/cargo.model';
import { AuthService } from '../../../../core/services/security/auth.service';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { HasPrivilegioDirective } from '../../../../core/directives/has-privilegio.directive';
import {
  MiembroIglesiaFormTraspasoComponent
} from '../modals/miembro-iglesia-form-traspaso/miembro-iglesia-form.component';

@Component({
  selector: 'app-iglesia-miembro-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    HasPrivilegioDirective
  ],
  templateUrl: './iglesia-miembro-list.component.html',
  styleUrls: ['./iglesia-miembro-list.component.css']
})
export class IglesiaMiembroListComponent implements OnInit {
  isLoading = true;
  
  allTransfers: any[] = [];
  filteredTransfers: any[] = [];
  searchQuery = '';
  activeTab: 'pendientes' | 'historial' | 'todas' = 'pendientes';
  
  currentUser: any;
  isAdmin = false;
  currentIglesiaId: number | null = null;
  
  cargos: Cargo[] = [];
  iglesias: Iglesia[] = [];
  miembros: Miembro[] = [];

  // KPIs
  totalRequests = 0;
  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;
  cancelledCount = 0;
  approvalRate = 0;

  constructor(
    private iglesiaService: IglesiaService,
    private miembroService: MiembroService,
    private miembroIglesiaService: MiembroIglesiaService,
    private cargoService: CargoService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.authService.isLoggedRolAdmin();
    this.currentIglesiaId = this.authService.getCurrentIglesiaId();
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    forkJoin({
      iglesias: this.iglesiaService.getIglesias(),
      miembros: this.miembroService.getMiembros(),
      cargos: this.cargoService.getCargos(),
      memberships: this.miembroIglesiaService.getMiembrosIglesia()
    }).subscribe({
      next: (res) => {
        this.iglesias = res.iglesias.datos || [];
        this.miembros = res.miembros.datos || [];
        this.cargos = res.cargos.datos || [];
        const rawMemberships = res.memberships.datos || [];

        // 1. Filtrar solo los registros que representen traspasos
        const transferRecords = rawMemberships.filter(m => m.iglesiaDestinoId || m.estadoTraspaso);

        // 2. Mapear y enriquecer los registros
        this.allTransfers = transferRecords.map(m => {
          const miembro = this.miembros.find(mb => mb.id === m.miembroId);
          const origen = this.iglesias.find(i => i.id === m.iglesiaId);
          const destino = this.iglesias.find(i => i.id === m.iglesiaDestinoId);
          
          return {
            ...m,
            miembroName: miembro ? `${miembro.nombre} ${miembro.apellido}` : 'Miembro Desconocido',
            miembroCi: miembro ? miembro.ci : 'Sin CI',
            miembroCargo: miembro?.cargoNombre || this.getMiembroCargo(m.miembroId),
            miembroInitials: miembro ? this.getInitials(miembro.nombre, miembro.apellido) : 'M',
            miembroFoto: miembro ? miembro.uriFoto : '',
            origenNombre: origen ? origen.nombre : 'Sin iglesia asignada',
            destinoNombre: destino ? destino.nombre : 'Sin iglesia asignada',
            pastorOrigen: this.getPastorName(m.iglesiaId),
            pastorDestino: this.getPastorName(m.iglesiaDestinoId),
            fechaRelativa: this.getRelativeTime(m.fechaTraspaso || m.createdAt || m.updatedAt)
          };
        });

        // 3. Ordenar por fecha del traspaso o de actualización descendente (los más recientes primero)
        this.allTransfers.sort((a, b) => {
          const dateA = a.fechaTraspaso ? new Date(a.fechaTraspaso).getTime() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
          const dateB = b.fechaTraspaso ? new Date(b.fechaTraspaso).getTime() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
          return dateB - dateA;
        });

        // 4. Si el usuario no es Admin y tiene iglesia asignada, filtrar para ver solo los traspasos de su iglesia (origen o destino)
        if (!this.isAdmin && this.currentIglesiaId) {
          this.allTransfers = this.allTransfers.filter(t => 
            t.iglesiaId === this.currentIglesiaId || t.iglesiaDestinoId === this.currentIglesiaId
          );
        }

        // 5. Calcular métricas y aplicar filtros de vista
        this.calculateKpis();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos del dashboard de traspasos', err);
        this.snackBar.open('Error al cargar los datos del dashboard', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  getMiembroCargo(miembroId: number): string {
    const cargo = this.cargos.find(c => c.idMiembro === miembroId && c.estado);
    return cargo?.tipoCargoDto?.nombre || 'Miembro';
  }

  getInitials(nombre: string, apellido: string): string {
    const n = nombre ? nombre.charAt(0) : '';
    const a = apellido ? apellido.charAt(0) : '';
    return (n + a).toUpperCase();
  }

  getPastorName(iglesiaId: number | undefined): string {
    if (!iglesiaId) return 'Por asignar';
    const pastorCargo = this.cargos.find(c => 
      c.iglesiaId === iglesiaId && 
      c.estado && 
      c.tipoCargoDto?.nombre?.toLowerCase().includes('pastor')
    );
    return pastorCargo && pastorCargo.miembroDto 
      ? `${pastorCargo.miembroDto.nombre} ${pastorCargo.miembroDto.apellido}`
      : 'Por asignar';
  }

  getRelativeTime(dateInput: any): string {
    if (!dateInput) return 'Fecha no disponible';
    const date = new Date(dateInput);
    const now = new Date();
    
    const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = dNow.getTime() - dDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const formattedDate = `${date.getDate()} ${meses[date.getMonth()]} ${date.getFullYear()}`;
    
    if (diffDays === 0) {
      return `${formattedDate} (Hoy)`;
    } else if (diffDays === 1) {
      return `${formattedDate} (Ayer)`;
    } else if (diffDays > 1) {
      return `${formattedDate} (Hace ${diffDays} días)`;
    } else {
      return formattedDate;
    }
  }

  calculateKpis() {
    this.totalRequests = this.allTransfers.length;
    this.pendingCount = this.allTransfers.filter(t => t.estadoTraspaso === 'PENDIENTE').length;
    this.approvedCount = this.allTransfers.filter(t => t.estadoTraspaso === 'ACEPTADO').length;
    this.rejectedCount = this.allTransfers.filter(t => t.estadoTraspaso === 'RECHAZADO').length;
    this.cancelledCount = this.allTransfers.filter(t => t.estadoTraspaso === 'CANCELADO').length;
    
    const decided = this.approvedCount + this.rejectedCount;
    this.approvalRate = decided > 0 ? Math.round((this.approvedCount / decided) * 100) : 0;
  }

  applyFilters() {
    let temp = [...this.allTransfers];

    // Filtrar por pestaña activa
    if (this.activeTab === 'pendientes') {
      temp = temp.filter(t => t.estadoTraspaso === 'PENDIENTE');
    } else if (this.activeTab === 'historial') {
      temp = temp.filter(t => t.estadoTraspaso === 'ACEPTADO' || t.estadoTraspaso === 'RECHAZADO' || t.estadoTraspaso === 'CANCELADO');
    }

    // Filtrar por consulta de búsqueda
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      temp = temp.filter(t => 
        t.miembroName.toLowerCase().includes(q) || 
        t.miembroCi?.toString().includes(q) ||
        t.origenNombre.toLowerCase().includes(q) ||
        t.destinoNombre.toLowerCase().includes(q)
      );
    }

    this.filteredTransfers = temp;
  }

  onTabChange(tab: 'pendientes' | 'historial' | 'todas') {
    this.activeTab = tab;
    this.applyFilters();
  }

  onSearchChange(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  canAction(solicitud: any, action: 'aprobar_rechazar' | 'cancelar'): boolean {
    if (solicitud.estadoTraspaso !== 'PENDIENTE') {
      return false;
    }
    if (this.isAdmin) {
      return true;
    }
    if (action === 'aprobar_rechazar') {
      return this.currentIglesiaId !== null && solicitud.iglesiaDestinoId === this.currentIglesiaId;
    }
    if (action === 'cancelar') {
      return this.currentIglesiaId !== null && solicitud.iglesiaId === this.currentIglesiaId;
    }
    return false;
  }

  aprobar(solicitud: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Confirmar Aprobación',
        message: `¿Está seguro que desea aprobar la solicitud de traspaso para <strong>${solicitud.miembroName}</strong> a la congregación de <strong>${solicitud.destinoNombre}</strong>?`,
        confirmText: 'Aprobar',
        type: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.miembroIglesiaService.aceptarTraspaso(solicitud.id).subscribe({
          next: () => {
            this.snackBar.open('Traspaso aprobado y membrecía actualizada con éxito', 'Cerrar', {
              duration: 4000,
              panelClass: ['success-snackbar']
            });
            this.loadData();
          },
          error: (err) => {
            const errorMsg = err.error?.message || 'Error al aprobar el traspaso';
            this.snackBar.open(errorMsg, 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  rechazar(solicitud: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Confirmar Rechazo',
        message: `¿Está seguro que desea rechazar la solicitud de traspaso para <strong>${solicitud.miembroName}</strong>? Esta acción no se puede deshacer.`,
        confirmText: 'Rechazar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.miembroIglesiaService.rechazarTraspaso(solicitud.id).subscribe({
          next: () => {
            this.snackBar.open('Traspaso rechazado con éxito', 'Cerrar', {
              duration: 4000,
              panelClass: ['success-snackbar']
            });
            this.loadData();
          },
          error: (err) => {
            const errorMsg = err.error?.message || 'Error al rechazar el traspaso';
            this.snackBar.open(errorMsg, 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  cancelar(solicitud: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Cancelar Solicitud de Traspaso',
        message: `¿Está seguro que desea cancelar la solicitud de traspaso para <strong>${solicitud.miembroName}</strong>?`,
        confirmText: 'Cancelar Solicitud',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const payload = {
          id: solicitud.id,
          miembroId: solicitud.miembroId,
          iglesiaId: solicitud.iglesiaId,
          iglesiaDestinoId: solicitud.iglesiaDestinoId,
          fecha: solicitud.fecha,
          motivoTraspaso: solicitud.motivoTraspaso,
          fechaTraspaso: solicitud.fechaTraspaso,
          uriCartaTraspaso: solicitud.uriCartaTraspaso,
          estado: solicitud.estado,
          estadoTraspaso: 'CANCELADO'
        };
        
        this.miembroIglesiaService.updateMiembroIglesia(payload).subscribe({
          next: () => {
            this.snackBar.open('Solicitud de traspaso cancelada con éxito', 'Cerrar', {
              duration: 4000,
              panelClass: ['success-snackbar']
            });
            this.loadData();
          },
          error: (err) => {
            const errorMsg = err.error?.message || 'Error al cancelar la solicitud';
            this.snackBar.open(errorMsg, 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  openNuevaSolicitud() {
    let iglesiaParam: Iglesia | undefined = undefined;
    if (!this.isAdmin && this.currentIglesiaId) {
      iglesiaParam = this.iglesias.find(i => i.id === this.currentIglesiaId);
    }

    const dialogRef = this.dialog.open(MiembroIglesiaFormTraspasoComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: { 
        iglesia: iglesiaParam 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }
}
