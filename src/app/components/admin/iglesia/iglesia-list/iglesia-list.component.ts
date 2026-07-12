import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { MiembroService } from '../../../../core/services/miembro.service';
import { EventoService } from '../../../../core/services/evento.service';
import { CertificadoService } from '../../../../core/services/certificado.service';
import { IglesiaCreateComponent } from '../iglesia-create/iglesia-create.component';
import { IglesiaDetailComponent } from '../iglesia-detail/iglesia-detail.component';
import { IglesiaEditComponent } from '../iglesia-edit/iglesia-edit.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { HasPrivilegioDirective } from '../../../../core/directives/has-privilegio.directive';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { MatSelectModule } from '@angular/material/select';

import * as L from 'leaflet';

@Component({
  selector: 'app-iglesia-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSnackBarModule,
    MatCardModule,
    MatTooltipModule,
    MatMenuModule,
    MatSelectModule,
    ImageUrlPipe,
    HasPrivilegioDirective,
    DragDropModule,
    IglesiaDetailComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './iglesia-list.component.html',
  styleUrls: ['./iglesia-list.component.css']
})
export class IglesiaListComponent implements OnInit, AfterViewInit, OnDestroy {
  iglesias: any[] = [];
  filteredIglesias: any[] = [];
  seleccionada: any = null;
  detalleIglesia: any = null;
  isLoading = true;

  // Filter models
  search = '';
  estado = 'all';
  departamento = 'Todos los departamentos';

  departamentos = [
    'Todos los departamentos',
    'Cochabamba',
    'La Paz',
    'Chuquisaca',
    'Tarija',
    'Oruro',
    'Santa Cruz',
    'Potosí',
    'Beni',
    'Pando'
  ];

  // Stats
  totalCount = 0;
  activasCount = 0;
  inactivasCount = 0;
  totalMembersCount = 0;
  totalEventsCount = 0;
  totalCertificatesCount = 0;

  // Leaflet Map fields
  private map!: L.Map;
  private markersGroup!: L.FeatureGroup;

  constructor(
    private iglesiaService: IglesiaService,
    private miembroService: MiembroService,
    private eventoService: EventoService,
    private certificadoService: CertificadoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadIglesias();
  }

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  loadIglesias() {
    this.isLoading = true;
    forkJoin({
      iglesias: this.iglesiaService.getIglesias(),
      miembros: this.miembroService.getMiembros().pipe(catchError(() => of({ datos: [] }))),
      eventos: this.eventoService.getEventos().pipe(catchError(() => of({ datos: [] }))),
      certificados: this.certificadoService.getCertificados().pipe(catchError(() => of({ datos: [] })))
    }).subscribe({
      next: (res) => {
        const allMembers = res.miembros.datos || [];
        const allEvents = res.eventos.datos || [];
        const allCertificates = res.certificados.datos || [];

        this.totalEventsCount = allEvents.length;
        this.totalCertificatesCount = allCertificates.length;

        this.iglesias = res.iglesias.datos.map((item: Iglesia) => {
          const enriched = { ...item } as any;
          
          // Count members belonging to this specific church (by name matching)
          const churchMembers = allMembers.filter((m: any) => m.iglesiaNombre === item.nombre);
          enriched.miembrosActivos = churchMembers.length;

          // Count events belonging to this church ID
          const churchEvents = allEvents.filter((e: any) => e.iglesiaId === item.id);
          enriched.eventosMes = churchEvents.length;

          // Count certificates belonging to this church (by event's church association)
          const churchCertificates = allCertificates.filter((c: any) => c.eventoDto?.iglesiaId === item.id);
          enriched.certificadosEmitidos = churchCertificates.length;

          // Set coordinate defaults if null
          if (!enriched.latitud || !enriched.longitud) {
            const coords = this.getDefaultCoords(enriched.nombre);
            enriched.latitud = coords.lat;
            enriched.longitud = coords.lng;
          }

          // Deduce department
          enriched.departamento = this.deduceDepartamento(enriched.nombre, enriched.direccion);
          enriched.ciudad = this.deduceCiudad(enriched.nombre, enriched.direccion);

          return enriched;
        });

        this.calculateStats();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching data from API services', err);
        this.isLoading = false;
      }
    });
  }

  private initMap() {
    // Default center in Bolivia
    this.map = L.map('map', {
      center: [-17.0, -65.0],
      zoom: 6,
      zoomControl: true
    });

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    });

    const satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      attribution: '© Google',
      maxZoom: 20
    });

    streetLayer.addTo(this.map);

    const baseMaps = {
      "Mapa (Calles)": streetLayer,
      "Satélite": satelliteLayer
    };

    L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(this.map);

    this.markersGroup = L.featureGroup().addTo(this.map);
  }

  private calculateStats() {
    this.totalCount = this.iglesias.length;
    this.activasCount = this.iglesias.filter(i => i.estado).length;
    this.inactivasCount = this.totalCount - this.activasCount;
    this.totalMembersCount = this.iglesias.reduce((acc, curr: any) => acc + (curr.miembrosActivos || 0), 0);
  }

  applyFilters() {
    this.filteredIglesias = this.iglesias.filter((iglesia: any) => {
      const matchSearch = !this.search || 
        iglesia.nombre.toLowerCase().includes(this.search.toLowerCase()) ||
        (iglesia.direccion && iglesia.direccion.toLowerCase().includes(this.search.toLowerCase())) ||
        (iglesia.ciudad && iglesia.ciudad.toLowerCase().includes(this.search.toLowerCase()));

      const matchEstado = this.estado === 'all' || 
        (this.estado === 'true' && iglesia.estado === true) || 
        (this.estado === 'false' && iglesia.estado === false);

      const matchDepto = this.departamento === 'Todos los departamentos' || 
        iglesia.departamento === this.departamento;

      return matchSearch && matchEstado && matchDepto;
    });

    this.updateMapMarkers();
  }

  private updateMapMarkers() {
    if (!this.map || !this.markersGroup) return;

    // Clear existing markers
    this.markersGroup.clearLayers();

    // Set custom icon
    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28]
    });

    this.filteredIglesias.forEach((iglesia: any) => {
      if (iglesia.latitud && iglesia.longitud) {
        const marker = L.marker([iglesia.latitud, iglesia.longitud], { icon: customIcon });
        
        // Tooltip showing name
        marker.bindTooltip(iglesia.nombre, { permanent: false, direction: 'top' });
        
        // Event click
        marker.on('click', () => {
          this.seleccionarIglesia(iglesia);
          this.verDetalles(iglesia);
        });

        this.markersGroup.addLayer(marker);
      }
    });

    // Auto-fit map to show all markers if any
    if (this.filteredIglesias.length > 0) {
      this.map.fitBounds(this.markersGroup.getBounds(), { padding: [30, 30] });
    }
  }

  seleccionarIglesia(iglesia: any) {
    this.seleccionada = iglesia;
    
    // Pan map to marker center
    if (iglesia.latitud && iglesia.longitud && this.map) {
      this.map.setView([iglesia.latitud, iglesia.longitud], 13);
    }
  }

  verDetalles(iglesia: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const dialogRef = this.dialog.open(IglesiaDetailComponent, {
      width: '750px',
      maxWidth: '95vw',
      data: iglesia,
      panelClass: 'dialog-fullscreen-mobile'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadIglesias();
        if (result.edited) {
          this.messageSnackBar(`Iglesia '${iglesia.nombre}' Modificada`);
        }
        this.seleccionada = null;
      }
    });
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.filteredIglesias, event.previousIndex, event.currentIndex);
    const orderedIds = this.filteredIglesias.map(ig => ig.id);
    this.iglesiaService.updateOrden(orderedIds).subscribe({
      next: () => {
        this.snackBar.open('Orden de iglesias guardado', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (err) => {
        console.error('Error al guardar el orden:', err);
        this.snackBar.open('Error al guardar el nuevo orden', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(IglesiaCreateComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadIglesias();
        this.messageSnackBar(`Iglesia '${result.nombre}' Creada`);
      }
    });
  }

  openEditDialog(iglesia: Iglesia, event?: Event) {
    if (event) event.stopPropagation();
    const dialogRef = this.dialog.open(IglesiaEditComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: iglesia
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadIglesias();
        this.messageSnackBar(`Iglesia '${iglesia.nombre}' Modificada`);
        this.seleccionada = null;
      }
    });
  }

  toggleEstado(iglesia: Iglesia, event?: Event) {
    if (event) event.stopPropagation();
    if (iglesia.id) {
      const action = iglesia.estado ? 'desactivar' : 'activar';

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: `¿Está seguro que desea ${action}?`,
          message: `Está a punto de ${action} la iglesia <strong>${iglesia.nombre}</strong>.`,
          confirmText: iglesia.estado ? 'Desactivar' : 'Activar',
          type: 'warning'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && iglesia.id) {
          this.iglesiaService.toggleEstado(iglesia.id).subscribe(newEstado => {
            iglesia.estado = newEstado;
            this.messageSnackBar(`Iglesia '${iglesia.nombre}' ${newEstado ? 'activada' : 'desactivada'}`);
            this.loadIglesias();
            this.seleccionada = null;
          });
        }
      });
    }
  }

  formatDate(date: any): string {
    if (!date) return 'Sin fecha';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getChurchAge(fechaFundacion: any): string {
    if (!fechaFundacion) return 'Fecha no definida';
    const birth = new Date(fechaFundacion);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} años de fundación`;
  }

  messageSnackBar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  // Deduce department based on fields
  private deduceDepartamento(nombre: string, direccion: string): string {
    const text = (nombre + ' ' + (direccion || '')).toLowerCase();
    if (text.includes('lapaz') || text.includes('la paz')) return 'La Paz';
    if (text.includes('cochabamba')) return 'Cochabamba';
    if (text.includes('sucre') || text.includes('chuquisaca')) return 'Chuquisaca';
    if (text.includes('tarija')) return 'Tarija';
    if (text.includes('oruro')) return 'Oruro';
    if (text.includes('santa cruz')) return 'Santa Cruz';
    if (text.includes('potosi') || text.includes('potosí')) return 'Potosí';
    if (text.includes('beni')) return 'Beni';
    if (text.includes('pando')) return 'Pando';
    return 'Cochabamba'; // Default
  }

  private deduceCiudad(nombre: string, direccion: string): string {
    const text = (nombre + ' ' + (direccion || '')).toLowerCase();
    if (text.includes('el alto') || text.includes('elalto')) return 'El Alto';
    if (text.includes('la paz') || text.includes('lapaz')) return 'La Paz';
    if (text.includes('sucre')) return 'Sucre';
    if (text.includes('tarija')) return 'Tarija';
    if (text.includes('oruro')) return 'Oruro';
    return 'Cochabamba'; // Default
  }

  private getDefaultCoords(nombre: string): { lat: number, lng: number } {
    const n = nombre.toLowerCase();
    if (n.includes('libertad')) return { lat: -17.3935, lng: -66.157 };
    if (n.includes('santa fe')) return { lat: -16.4896, lng: -68.1192 };
    if (n.includes('valle tunari')) return { lat: -17.4107, lng: -66.0944 };
    if (n.includes('el alto')) return { lat: -16.5009, lng: -68.1872 };
    if (n.includes('sucre')) return { lat: -19.0196, lng: -65.2619 };
    if (n.includes('tarija')) return { lat: -21.5354, lng: -64.7295 };
    if (n.includes('oruro')) return { lat: -17.9833, lng: -67.15 };
    return { lat: -17.0, lng: -65.0 }; // Default Bolivia Center
  }
}
