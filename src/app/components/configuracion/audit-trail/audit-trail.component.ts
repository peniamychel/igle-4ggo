import { AfterViewInit, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuditLog, AuditLogService } from '../../../core/services/audit-log.service';
import { AuditDetailComponent } from '../audit-detail/audit-detail.component';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatChipsModule,
    MatDialogModule
  ],
  templateUrl: './audit-trail.component.html',
  styleUrls: ['./audit-trail.component.css']
})
export class AuditTrailComponent implements OnInit, AfterViewInit {

  // Estadísticas
  totalEventos = 0;
  iniciosSesion = 0;
  advertencias = 0;

  // Filtros
  searchQuery = '';
  selectedAccion = 'TODOS';
  selectedDias = 30;

  acciones = ['TODOS', 'Acceso', 'Creación', 'Modificación', 'Eliminación', 'Exportación', 'Advertencia'];
  periodos = [
    { label: 'Últimos 7 días', value: 7 },
    { label: 'Últimos 30 días', value: 30 },
    { label: 'Últimos 90 días', value: 90 },
    { label: 'Todo el historial', value: 0 }
  ];

  // Tabla
  allColumns: string[] = ['accion', 'usuario', 'fecha', 'estado', 'acciones'];
  displayedColumns: string[] = [...this.allColumns];
  dataSource: MatTableDataSource<AuditLog>;
  isSmallScreen = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private auditLogService: AuditLogService,
    private dialog: MatDialog
  ) {
    this.dataSource = new MatTableDataSource<AuditLog>([]);
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isSmallScreen = window.innerWidth < 768;
    this.updateDisplayedColumns();
  }

  private updateDisplayedColumns() {
    if (this.isSmallScreen) {
      this.displayedColumns = ['accion', 'fecha', 'acciones'];
    } else {
      this.displayedColumns = [...this.allColumns];
    }
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadLogs();

    // Configurar sorting personalizado
    this.dataSource.sortingDataAccessor = (item: AuditLog, property: string) => {
      switch (property) {
        case 'fecha': return new Date(item.fecha).getTime();
        case 'usuario': return item.usuario.toLowerCase();
        case 'accion': return item.accion.toLowerCase();
        case 'estado': return item.estado;
        default: return (item as any)[property];
      }
    };
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadStats(): void {
    this.auditLogService.getStats().subscribe(stats => {
      this.totalEventos = stats.totalEventos;
      this.iniciosSesion = stats.iniciosSesion;
      this.advertencias = stats.advertencias;
    });
  }

  loadLogs(): void {
    this.auditLogService.getFilteredLogs(
      this.searchQuery,
      this.selectedAccion,
      this.selectedDias
    ).subscribe(logs => {
      this.dataSource.data = logs;
    });
  }

  onFilterChange(): void {
    this.loadLogs();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onSearchKeyup(): void {
    this.loadLogs();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearchKeyup();
  }

  openDetail(log: AuditLog): void {
    this.dialog.open(AuditDetailComponent, {
      width: '750px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: log
    });
  }

  // Devuelve un icono Material según la acción
  getActionIcon(accion: string): string {
    switch (accion) {
      case 'Acceso': return 'key';
      case 'Creación': return 'add_circle_outline';
      case 'Modificación': return 'edit';
      case 'Eliminación': return 'delete_outline';
      case 'Exportación': return 'download';
      case 'Advertencia': return 'warning_amber';
      default: return 'info';
    }
  }

  // Devuelve un ícono Material según el estado
  getStatusIcon(estado: string): string {
    switch (estado) {
      case 'SUCCESS': return 'check_circle';
      case 'WARNING': return 'warning';
      case 'FAILED': return 'cancel';
      default: return 'help';
    }
  }

  // Devuelve el label en español del estado
  getStatusLabel(estado: string): string {
    switch (estado) {
      case 'SUCCESS': return 'Exitoso';
      case 'WARNING': return 'Advertencia';
      case 'FAILED': return 'Fallido';
      default: return estado;
    }
  }

  // Genera tiempo relativo humanizado (ej: "Hace 10 min")
  getRelativeTime(fecha: Date): string {
    const now = new Date().getTime();
    const then = new Date(fecha).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMin < 1) return 'Ahora mismo';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHrs < 24) return `Hace ${diffHrs}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }

  // Devuelve las iniciales del nombre de usuario
  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Genera un color armónico basado en el nombre
  getAvatarColor(name: string): string {
    const colors = [
      '#7c4dff', '#00bfa5', '#ff6d00', '#2979ff',
      '#d500f9', '#00c853', '#ff3d00', '#651fff',
      '#1de9b6', '#f50057', '#304ffe', '#00b0ff'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
