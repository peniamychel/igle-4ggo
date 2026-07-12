import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TipoCertificado, TipoCertificadoResponse, TipoCertificadosResponse } from '../models/tipo-certificado.model';
import { ApiResponse } from '../models/interfaces/api.response';

@Injectable({
  providedIn: 'root'
})
export class TipoCertificadoService {
  private apiUrl = `${environment.apiUrl}/api/tipo-certificado/v1`;

  // Catalogo de tipos de certificado: cambia poco, se cachea y se invalida en cada mutacion.
  private tipoCertificadosCache$?: Observable<ApiResponse<TipoCertificado[]>>;

  constructor(private http: HttpClient) { }

  getTipoCertificados(): Observable<ApiResponse<TipoCertificado[]>> {
    if (!this.tipoCertificadosCache$) {
      this.tipoCertificadosCache$ = this.http.get<ApiResponse<TipoCertificado[]>>(`${this.apiUrl}/findall`).pipe(
        catchError(err => { this.tipoCertificadosCache$ = undefined; return throwError(() => err); }),
        shareReplay(1)
      );
    }
    return this.tipoCertificadosCache$;
  }

  /** Invalida el cache de tipos de certificado; llamar tras cualquier mutacion. */
  private invalidateCache(): void {
    this.tipoCertificadosCache$ = undefined;
  }

  getTipoCertificadoById(id: number): Observable<TipoCertificadoResponse> {
    return this.http.get<TipoCertificadoResponse>(`${this.apiUrl}/showbyid/${id}`);
  }

  createTipoCertificado(tipoCertificado: TipoCertificado): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, tipoCertificado).pipe(tap(() => this.invalidateCache()));
  }

  updateTipoCertificado(tipoCertificado: TipoCertificado): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, tipoCertificado).pipe(tap(() => this.invalidateCache()));
  }

  toggleEstado(id: number): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/estado/${id}`, {}).pipe(tap(() => this.invalidateCache()));
  }
}
