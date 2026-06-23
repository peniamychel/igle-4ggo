import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  getMiembrosIglesia(): Observable<MiembroIglesiaResponse> {
    return this.http.get<MiembroIglesiaResponse>(`${this.apiUrl}/findall`);
  }

  getMiembroIglesiaById(id: number): Observable<MiembroIglesiaDetail> {
    return this.http.get<MiembroIglesiaDetail>(`${this.apiUrl}/showbyid/${id}`);
  }

  createMiembroIglesia(miembroIglesia: Partial<MiembroIglesia>): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, miembroIglesia);
  }

  updateMiembroIglesia(miembroIglesia: Partial<MiembroIglesia>): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, miembroIglesia);
  }

  toggleEstado(id: number): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/estado/${id}`, {});
  }

  deleteMiembroIglesia(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }

  traspaso(data: Partial<MiembroIglesia>): Observable<any> {
    return this.http.put(`${this.apiUrl}/traspaso`, data);
  }

  aceptarTraspaso(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/traspaso/${id}/aceptar`, {});
  }

  rechazarTraspaso(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/traspaso/${id}/rechazar`, {});
  }

  getSolicitudesPendientes(iglesiaId: number): Observable<MiembroIglesiaResponse> {
    return this.http.get<MiembroIglesiaResponse>(`${this.apiUrl}/traspaso/pendientes/${iglesiaId}`);
  }

  getHistorialMiembro(miembroId: number): Observable<MiembroIglesiaResponse> {
    return this.http.get<MiembroIglesiaResponse>(`${this.apiUrl}/historial/${miembroId}`);
  }

  uploadCartaTraspaso(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/${id}/carta-traspaso`, formData);
  }

  datosGrafico(cant: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/graficomiembrosiglesia/${cant}`);
  }

  getMiembrosPorIglesia(iglesiaId: number): Observable<MiembroResponse> {
    return this.http.get<MiembroResponse>(`${this.apiUrl}/listmiembrosiglesia/${iglesiaId}`);
  }

  getMisMiembros(): Observable<MiembroResponse> {
    return this.http.get<MiembroResponse>(`${this.apiUrl}/mis-miembros`);
  }

}
