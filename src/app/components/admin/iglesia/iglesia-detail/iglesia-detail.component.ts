import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Iglesia } from '../../../../core/models/iglesia.model';

@Component({
  selector: 'app-iglesia-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './iglesia-detail.component.html',
  styleUrls: ['./iglesia-detail.component.css']
})
export class IglesiaDetailComponent implements OnInit {
  map: any;

  constructor(
    public dialogRef: MatDialogRef<IglesiaDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Iglesia
  ) {}

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

  ngOnInit() {
    if (this.data && this.data.latitud && this.data.longitud) {
      setTimeout(() => {
        this.loadLeaflet().then(L => {
          this.initMap(L, this.data.latitud!, this.data.longitud!);
        }).catch(err => {
          console.error('Error al cargar Leaflet:', err);
        });
      }, 150);
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
