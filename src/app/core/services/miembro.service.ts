import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Miembro, MiembroResponse, MiembroDetail } from '../models/miembro.model';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MiembroService {
  private apiUrl = `${environment.apiUrl}/api/miembro/v1`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getMiembros(): Observable<MiembroResponse> {
    return this.http.get<MiembroResponse>(`${this.apiUrl}/findall`, { headers: this.getHeaders() });
  }

  getMiembrosSinIglesia(): Observable<MiembroResponse> {
    return this.http.get<MiembroResponse>(`${this.apiUrl}/sin-iglesia`, { headers: this.getHeaders() });
  }

  /** Obtiene miembros disponibles para asignar a una iglesia (excluye pastores, seguro en backend) */
  getMiembrosSinIglesiaParaAsignacion(): Observable<MiembroResponse> {
    return this.http.get<MiembroResponse>(`${this.apiUrl}/sin-iglesia-asignacion`, { headers: this.getHeaders() });
  }

  getMiembroById(id: number): Observable<MiembroDetail> {
    return this.http.get<MiembroDetail>(`${this.apiUrl}/showbyid/${id}`, { headers: this.getHeaders() });
  }

  createMiembro(miembro: Partial<Miembro>): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, miembro, { headers: this.getHeaders() });
  }

  updateMiembro(miembro: Partial<Miembro>): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, miembro, { headers: this.getHeaders() });
  }

  toggleEstado(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/estado/${id}`,{}, { headers: this.getHeaders() });
  }

  uploadPhoto(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/${id}/foto`, formData, { headers: this.getHeaders() });
  }

  deletePhoto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/foto`, { headers: this.getHeaders() });
  }

  buscarCi(ci: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/buscarci/${ci}`, { headers: this.getHeaders() });
  }

  deleteMiembro(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`, { headers: this.getHeaders() });
  }
}
