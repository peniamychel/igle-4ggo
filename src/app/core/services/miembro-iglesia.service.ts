import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MiembroIglesia, MiembroIglesiaResponse, MiembroIglesiaDetail } from '../models/miembro-iglesia.model';
import { MiembroResponse } from '../models/miembro.model';

@Injectable({
  providedIn: 'root'
})
export class MiembroIglesiaService {
  private apiUrl = `${environment.apiUrl}/api/miembroiglesia/v1`;

  constructor(private http: HttpClient) {
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getMiembrosIglesia(): Observable<MiembroIglesiaResponse> {
    return this.http.get<MiembroIglesiaResponse>(
      `${this.apiUrl}/findall`,
      { headers: this.getHeaders() }
    );
  }

  getMiembroIglesiaById(id: number): Observable<MiembroIglesiaDetail> {
    return this.http.get<MiembroIglesiaDetail>(
      `${this.apiUrl}/showbyid/${id}`,
      { headers: this.getHeaders() }
    );
  }

  createMiembroIglesia(miembroIglesia: Partial<MiembroIglesia>): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/create`,
      miembroIglesia,
      { headers: this.getHeaders() }
    );
  }

  updateMiembroIglesia(miembroIglesia: Partial<MiembroIglesia>): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/update`,
      miembroIglesia,
      { headers: this.getHeaders() }
    );
  }

  toggleEstado(id: number): Observable<boolean> {
    return this.http.put<boolean>(
      `${this.apiUrl}/estado/${id}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  deleteMiembroIglesia(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/delete/${id}`,
      { headers: this.getHeaders() }
    );
  }

  traspaso(data: Partial<MiembroIglesia>): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/traspaso`,
      data,
      { headers: this.getHeaders() }
    );
  }

  aceptarTraspaso(id: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/traspaso/${id}/aceptar`,
      {},
      { headers: this.getHeaders() }
    );
  }

  rechazarTraspaso(id: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/traspaso/${id}/rechazar`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getSolicitudesPendientes(iglesiaId: number): Observable<MiembroIglesiaResponse> {
    return this.http.get<MiembroIglesiaResponse>(
      `${this.apiUrl}/traspaso/pendientes/${iglesiaId}`,
      { headers: this.getHeaders() }
    );
  }

  getHistorialMiembro(miembroId: number): Observable<MiembroIglesiaResponse> {
    return this.http.get<MiembroIglesiaResponse>(
      `${this.apiUrl}/historial/${miembroId}`,
      { headers: this.getHeaders() }
    );
  }

  uploadCartaTraspaso(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/${id}/carta-traspaso`, formData, { headers: this.getHeaders() });
  }

  datosGrafico(cant: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/graficomiembrosiglesia/${cant}`,
      { headers: this.getHeaders() }
    );
  }

  getMiembrosPorIglesia(iglesiaId: number): Observable<MiembroResponse> {
    return this.http.get<MiembroResponse>(
      `${this.apiUrl}/listmiembrosiglesia/${iglesiaId}`,
      { headers: this.getHeaders() }
    );
  }

}
