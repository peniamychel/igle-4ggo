import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getTipoEventos(): Observable<ApiResponse<TipoEvento[]>> {
    return this.http.get<ApiResponse<TipoEvento[]>>(
      `${this.apiUrl}/findall`,
      { headers: this.getHeaders() }
    );
  }

  getTipoEventoById(id: number): Observable<TipoEventoResponse> {
    return this.http.get<TipoEventoResponse>(
      `${this.apiUrl}/showbyid/${id}`,
      { headers: this.getHeaders() }
    );
  }

  createTipoEvento(tipoEvento: TipoEvento): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/create`,
      tipoEvento,
      { headers: this.getHeaders() }
    );
  }

  updateTipoEvento(tipoEvento: TipoEvento): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/update`,
      tipoEvento,
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

  deleteTipoEvento(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`, { headers: this.getHeaders() });
  }
}
