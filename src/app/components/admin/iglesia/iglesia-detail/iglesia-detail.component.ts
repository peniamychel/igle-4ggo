import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { forkJoin } from 'rxjs';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { Miembro } from '../../../../core/models/miembro.model';
import { Cargo } from '../../../../core/models/cargo.model';
import { TipoCargo } from '../../../../core/models/tipo-cargo.model';
import { MiembroService } from '../../../../core/services/miembro.service';
import { CargoService } from '../../../../core/services/cargo.service';
import { TipoCargoService } from '../../../../core/services/tipo-cargo.service';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-iglesia-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTabsModule, ImageUrlPipe],
  templateUrl: './iglesia-detail.component.html',
  styleUrls: ['./iglesia-detail.component.css']
})
export class IglesiaDetailComponent implements OnInit {
  map: any;
  loadingHistory = true;
  miembros: Miembro[] = [];
  cargosHistory: Cargo[] = [];
  tiposCargo: TipoCargo[] = [];

  constructor(
    public dialogRef: MatDialogRef<IglesiaDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Iglesia,
    private miembroService: MiembroService,
    private cargoService: CargoService,
    private tipoCargoService: TipoCargoService
  ) {}

  ngOnInit() {
    this.loadHistory();
  }

  onTabChange(event: any) {
    // Tab index 1 is 'Ubicación'
    if (event.index === 1 && this.data.latitud && this.data.longitud) {
      if (!this.map) {
        this.loadMap();
      } else {
        setTimeout(() => {
          this.map.invalidateSize();
        }, 50);
      }
    }
  }

  loadMap() {
    if (this.data && this.data.latitud && this.data.longitud) {
      setTimeout(() => {
        this.loadLeaflet().then(L => {
          this.initMap(L, this.data.latitud!, this.data.longitud!);
        }).catch(err => {
          console.error('Error al cargar Leaflet:', err);
        });
      }, 50);
    }
  }

  loadHistory() {
    if (!this.data.id) {
      this.loadingHistory = false;
      return;
    }

    this.loadingHistory = true;

    forkJoin({
      miembros: this.miembroService.getMiembros(),
      tiposCargo: this.tipoCargoService.getTipoCargos(),
      cargos: this.cargoService.getCargos()
    }).subscribe({
      next: (res) => {
        this.tiposCargo = res.tiposCargo.datos || [];
        
        // Filtrar miembros pertenecientes a esta iglesia
        const allMiembros = res.miembros.datos || [];
        this.miembros = allMiembros.filter((m: Miembro) => m.iglesiaNombre === this.data.nombre);

        // Filtrar cargos pertenecientes a esta iglesia
        const allCargos = res.cargos.datos || [];
        this.cargosHistory = allCargos
          .filter((c: Cargo) => c.iglesiaId === this.data.id)
          .map((c: Cargo) => {
            return {
              ...c,
              tipoCargoDto: this.tiposCargo.find(tc => tc.id === c.rolCargoId),
              miembroDto: allMiembros.find((m: Miembro) => m.id === c.idMiembro)
            };
          })
          .sort((a: Cargo, b: Cargo) => {
            // Vigentes primero, luego fechaInicio descendente
            if (a.estado && !b.estado) return -1;
            if (!a.estado && b.estado) return 1;
            return new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime();
          });

        this.loadingHistory = false;
      },
      error: () => {
        this.loadingHistory = false;
      }
    });
  }

  loadLeaflet(): Promise<any> {
    if ((window as any).L) {
      return Promise.resolve((window as any).L);
    }
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve((window as any).L);
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  initMap(L: any, lat: number, lng: number) {
    const coords: [number, number] = [lat, lng];
    this.map = L.map('map-container-detail').setView(coords, 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    L.marker(coords).addTo(this.map);
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'No definido';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getMiembroNombreCompleto(miembro?: Miembro): string {
    if (!miembro) return 'N/A';
    return `${miembro.nombre} ${miembro.apellido}`;
  }
}
