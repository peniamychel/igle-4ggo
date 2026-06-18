import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { catchError, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-iglesia-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './iglesia-edit.component.html',
  styleUrls: ['./iglesia-edit.component.css']
})
export class IglesiaEditComponent implements OnInit {
  iglesiaForm: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploadingFoto = false;
  deletingFoto = false;

  constructor(
    private fb: FormBuilder,
    private iglesiaService: IglesiaService,
    private dialogRef: MatDialogRef<IglesiaEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Iglesia
  ) {
    this.iglesiaForm = this.fb.group({
      nombre: ['', { validators: [Validators.required], asyncValidators: [this.nombreValidator], updateOn: 'blur' }],
      direccion: ['', [Validators.required]],
      telefono: ['', [Validators.pattern('^[0-9]*$')]],
      fechaFundacion: [null],
      latitud: [null],
      longitud: [null]
    });
  }

  map: any;
  marker: any;
  defaultLat = -17.288672;
  defaultLng = -65.918849;

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

  initMap(L: any, lat: number, lng: number, hasMarker: boolean) {
    const coords: [number, number] = [lat, lng];
    this.map = L.map('map-container').setView(coords, 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    if (hasMarker) {
      this.createMarker(L, lat, lng);
    }

    this.map.on('click', (e: any) => {
      const position = e.latlng;
      if (!this.marker) {
        this.createMarker(L, position.lat, position.lng);
      } else {
        this.marker.setLatLng(position);
      }
      this.updateCoords(position.lat, position.lng);
    });
  }

  createMarker(L: any, lat: number, lng: number) {
    const coords: [number, number] = [lat, lng];
    this.marker = L.marker(coords, { draggable: true }).addTo(this.map);
    this.marker.on('dragend', () => {
      const position = this.marker.getLatLng();
      this.updateCoords(position.lat, position.lng);
    });
  }

  updateCoords(lat: number, lng: number) {
    this.iglesiaForm.patchValue({
      latitud: lat,
      longitud: lng
    });
  }

  clearLocation() {
    if (this.marker) {
      this.map.removeLayer(this.marker);
      this.marker = null;
    }
    this.iglesiaForm.patchValue({
      latitud: null,
      longitud: null
    });
  }

  ngOnInit() {
    if (this.data) {
      this.iglesiaForm.patchValue(this.data);
      if (this.data.uriFoto) {
        this.previewUrl = this.data.uriFoto;
      }
    }
    setTimeout(() => {
      this.loadLeaflet().then(L => {
        const hasMarker = !!(this.iglesiaForm.value.latitud && this.iglesiaForm.value.longitud);
        const lat = this.iglesiaForm.value.latitud || this.defaultLat;
        const lng = this.iglesiaForm.value.longitud || this.defaultLng;
        this.initMap(L, lat, lng, hasMarker);
      }).catch(err => {
        console.error('Error al cargar Leaflet:', err);
      });
    }, 150);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  clearFile() {
    this.selectedFile = null;
    this.previewUrl = this.data.uriFoto || null;
  }

  deleteFoto() {
    if (!this.data.id) return;
    this.deletingFoto = true;
    this.iglesiaService.deleteFoto(this.data.id).subscribe({
      next: () => {
        this.data.uriFoto = undefined;
        this.previewUrl = null;
        this.selectedFile = null;
        this.deletingFoto = false;
      },
      error: () => { this.deletingFoto = false; }
    });
  }

  onSubmit() {
    if (this.iglesiaForm.valid) {
      const iglesiaData: Iglesia = { ...this.data, ...this.iglesiaForm.value };

      this.iglesiaService.updateIglesia(iglesiaData).subscribe(() => {
        if (this.selectedFile && this.data.id) {
          this.uploadingFoto = true;
          this.iglesiaService.uploadFoto(this.data.id, this.selectedFile).subscribe({
            next: (res) => {
              iglesiaData.uriFoto = res.datos;
              this.uploadingFoto = false;
              this.dialogRef.close(iglesiaData);
            },
            error: () => {
              this.uploadingFoto = false;
              this.dialogRef.close(iglesiaData);
            }
          });
        } else {
          this.dialogRef.close(iglesiaData);
        }
      });
    }
  }

  /*valida nombre de iglesia si ya existe*/
  nombreValidator = (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (this.data && this.data.nombre === control.value) {
      return of(null);
    }
    const id = this.data?.id;
    if (id) {
      return this.iglesiaService.buscarNombreIglesiaExeptoId(control.value, id).pipe(
        map(iglesia => iglesia ? { nameExists: true } : null),
        catchError(() => of(null))
      );
    }
    return of(null);
  }

  getErrorMessageNombre(controlName: string): string {
    const control = this.iglesiaForm.get(controlName);
    if (control?.hasError('required')) return 'El nombre de la iglesia es requerido';
    if (control?.hasError('nameExists')) return 'El nombre de la iglesia ya se encuentra registrado';
    return '';
  }

  getErrorMessageDireccion(controlName: string): string {
    const control = this.iglesiaForm.get(controlName);
    if (control?.hasError('required')) return 'La direccion es requerida';
    return '';
  }

  getErrorMessageTelefono(controlName: string): string {
    const control = this.iglesiaForm.get(controlName);
    if (control?.hasError('pattern')) return 'Solo se permiten números';
    return '';
  }
}
