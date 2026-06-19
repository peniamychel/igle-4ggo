import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Evento, EventoResponse, EventosResponse } from '../models/evento.model';
import { ApiResponse } from '../models/interfaces/api.response';

@Injectable({
  providedIn: 'root'
})
export class EventoService {
  private apiUrl = `${environment.apiUrl}/api/evento/v1`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getEventos(): Observable<ApiResponse<Evento[]>> {
    return this.http.get<ApiResponse<Evento[]>>(
      `${this.apiUrl}/findall`,
      { headers: this.getHeaders() }
    );
  }

  getEventoById(id: number): Observable<EventoResponse> {
    return this.http.get<EventoResponse>(
      `${this.apiUrl}/showbyid/${id}`,
      { headers: this.getHeaders() }
    );
  }

  createEvento(evento: Evento): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/create`,
      evento,
      { headers: this.getHeaders() }
    );
  }

  updateEvento(evento: Evento): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/update`,
      evento,
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

  deleteEvento(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`, { headers: this.getHeaders() });
  }
}
