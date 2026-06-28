import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Activo, ActivoResponse, ActivoDetailResponse } from '../models/activo.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ActivoService {
  private apiUrl = `${environment.apiUrl}/api/activo/v1`;

  constructor(private http: HttpClient) {}

  getActivos(): Observable<ActivoResponse> {
    return this.http.get<ActivoResponse>(`${this.apiUrl}/findall`);
  }

  getActivosByIglesia(iglesiaId: number): Observable<ActivoResponse> {
    return this.http.get<ActivoResponse>(`${this.apiUrl}/iglesia/${iglesiaId}`);
  }

  getActivoById(id: number): Observable<ActivoDetailResponse> {
    return this.http.get<ActivoDetailResponse>(`${this.apiUrl}/showbyid/${id}`);
  }

  createActivo(activo: Partial<Activo>): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, activo);
  }

  updateActivo(activo: Partial<Activo>): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, activo);
  }

  deleteActivo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
