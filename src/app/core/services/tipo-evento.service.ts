import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TipoEvento, TipoEventoResponse, TipoEventosResponse } from '../models/tipo-evento.model';
import { ApiResponse } from '../models/interfaces/api.response';

@Injectable({
  providedIn: 'root'
})
export class TipoEventoService {
  private apiUrl = `${environment.apiUrl}/api/tipo-evento/v1`;

  constructor(private http: HttpClient) { }

  getTipoEventos(): Observable<ApiResponse<TipoEvento[]>> {
    return this.http.get<ApiResponse<TipoEvento[]>>(`${this.apiUrl}/findall`);
  }

  getTipoEventoById(id: number): Observable<TipoEventoResponse> {
    return this.http.get<TipoEventoResponse>(`${this.apiUrl}/showbyid/${id}`);
  }

  createTipoEvento(tipoEvento: TipoEvento): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, tipoEvento);
  }

  updateTipoEvento(tipoEvento: TipoEvento): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, tipoEvento);
  }

  toggleEstado(id: number): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/estado/${id}`, {});
  }

  deleteTipoEvento(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
