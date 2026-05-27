import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResponsableEvento, ResponsableEventoResponse, ResponsablesEventoResponse } from '../models/responsable-evento.model';
import { ApiResponse } from '../models/interfaces/api.response';

@Injectable({
  providedIn: 'root'
})
export class ResponsableEventoService {
  private apiUrl = `${environment.apiUrl}/api/responsable-evento/v1`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getResponsables(): Observable<ApiResponse<ResponsableEvento[]>> {
    return this.http.get<ApiResponse<ResponsableEvento[]>>(
      `${this.apiUrl}/findall`,
      { headers: this.getHeaders() }
    );
  }

  getResponsableById(id: number): Observable<ResponsableEventoResponse> {
    return this.http.get<ResponsableEventoResponse>(
      `${this.apiUrl}/showbyid/${id}`,
      { headers: this.getHeaders() }
    );
  }

  createResponsable(responsable: ResponsableEvento): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/create`,
      responsable,
      { headers: this.getHeaders() }
    );
  }

  updateResponsable(responsable: ResponsableEvento): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/update`,
      responsable,
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
}
