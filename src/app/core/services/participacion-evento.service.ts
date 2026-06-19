import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ParticipacionEvento, ParticipacionEventoResponse, ParticipacionesEventoResponse } from '../models/participacion-evento.model';
import { ApiResponse } from '../models/interfaces/api.response';

@Injectable({
  providedIn: 'root'
})
export class ParticipacionEventoService {
  private apiUrl = `${environment.apiUrl}/api/participacion-evento/v1`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getParticipaciones(): Observable<ApiResponse<ParticipacionEvento[]>> {
    return this.http.get<ApiResponse<ParticipacionEvento[]>>(
      `${this.apiUrl}/findall`,
      { headers: this.getHeaders() }
    );
  }

  getParticipacionById(id: number): Observable<ParticipacionEventoResponse> {
    return this.http.get<ParticipacionEventoResponse>(
      `${this.apiUrl}/showbyid/${id}`,
      { headers: this.getHeaders() }
    );
  }

  createParticipacion(participacion: ParticipacionEvento): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/create`,
      participacion,
      { headers: this.getHeaders() }
    );
  }

  updateParticipacion(participacion: ParticipacionEvento): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/update`,
      participacion,
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

  deleteParticipacion(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`, { headers: this.getHeaders() });
  }
}
