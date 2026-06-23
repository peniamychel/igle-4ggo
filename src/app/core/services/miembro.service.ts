import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Miembro, MiembroResponse, MiembroDetail } from '../models/miembro.model';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MiembroService {
  private apiUrl = `${environment.apiUrl}/api/miembro/v1`;

  constructor(private http: HttpClient) {}

  getMiembros(): Observable<MiembroResponse> {
    return this.http.get<MiembroResponse>(`${this.apiUrl}/findall`);
  }

  getMiembrosSinIglesia(): Observable<MiembroResponse> {
    return this.http.get<MiembroResponse>(`${this.apiUrl}/sin-iglesia`);
  }

  /** Obtiene miembros disponibles para asignar a una iglesia (excluye pastores, seguro en backend) */
  getMiembrosSinIglesiaParaAsignacion(): Observable<MiembroResponse> {
    return this.http.get<MiembroResponse>(`${this.apiUrl}/sin-iglesia-asignacion`);
  }

  getMiembroById(id: number): Observable<MiembroDetail> {
    return this.http.get<MiembroDetail>(`${this.apiUrl}/showbyid/${id}`);
  }

  createMiembro(miembro: Partial<Miembro>): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, miembro);
  }

  updateMiembro(miembro: Partial<Miembro>): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, miembro);
  }

  toggleEstado(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/estado/${id}`,{});
  }

  uploadPhoto(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/${id}/foto`, formData);
  }

  deletePhoto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/foto`);
  }

  buscarCi(ci: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/buscarci/${ci}`);
  }

  deleteMiembro(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
