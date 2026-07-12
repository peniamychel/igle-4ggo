import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TipoEvento, TipoEventoResponse, TipoEventosResponse } from '../models/tipo-evento.model';
import { ApiResponse } from '../models/interfaces/api.response';

@Injectable({
  providedIn: 'root'
})
export class TipoEventoService {
  private apiUrl = `${environment.apiUrl}/api/tipo-evento/v1`;

  // Catalogo de tipos de evento: cambia poco, se cachea y se invalida en cada mutacion.
  private tipoEventosCache$?: Observable<ApiResponse<TipoEvento[]>>;

  constructor(private http: HttpClient) { }

  getTipoEventos(): Observable<ApiResponse<TipoEvento[]>> {
    if (!this.tipoEventosCache$) {
      this.tipoEventosCache$ = this.http.get<ApiResponse<TipoEvento[]>>(`${this.apiUrl}/findall`).pipe(shareReplay(1));
    }
    return this.tipoEventosCache$;
  }

  /** Invalida el cache de tipos de evento; llamar tras cualquier mutacion. */
  private invalidateCache(): void {
    this.tipoEventosCache$ = undefined;
  }

  getTipoEventoById(id: number): Observable<TipoEventoResponse> {
    return this.http.get<TipoEventoResponse>(`${this.apiUrl}/showbyid/${id}`);
  }

  createTipoEvento(tipoEvento: TipoEvento): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, tipoEvento).pipe(tap(() => this.invalidateCache()));
  }

  updateTipoEvento(tipoEvento: TipoEvento): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, tipoEvento).pipe(tap(() => this.invalidateCache()));
  }

  toggleEstado(id: number): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/estado/${id}`, {}).pipe(tap(() => this.invalidateCache()));
  }

  deleteTipoEvento(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`).pipe(tap(() => this.invalidateCache()));
  }
}
