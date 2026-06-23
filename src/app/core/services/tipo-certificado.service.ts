import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TipoCertificado, TipoCertificadoResponse, TipoCertificadosResponse } from '../models/tipo-certificado.model';
import { ApiResponse } from '../models/interfaces/api.response';

@Injectable({
  providedIn: 'root'
})
export class TipoCertificadoService {
  private apiUrl = `${environment.apiUrl}/api/tipo-certificado/v1`;

  constructor(private http: HttpClient) { }

  getTipoCertificados(): Observable<ApiResponse<TipoCertificado[]>> {
    return this.http.get<ApiResponse<TipoCertificado[]>>(`${this.apiUrl}/findall`);
  }

  getTipoCertificadoById(id: number): Observable<TipoCertificadoResponse> {
    return this.http.get<TipoCertificadoResponse>(`${this.apiUrl}/showbyid/${id}`);
  }

  createTipoCertificado(tipoCertificado: TipoCertificado): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, tipoCertificado);
  }

  updateTipoCertificado(tipoCertificado: TipoCertificado): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, tipoCertificado);
  }

  toggleEstado(id: number): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/estado/${id}`, {});
  }
}
