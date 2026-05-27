import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Certificado, CertificadoResponse, CertificadosResponse } from '../models/certificado.model';
import { ApiResponse } from '../models/interfaces/api.response';

@Injectable({
  providedIn: 'root'
})
export class CertificadoService {
  private apiUrl = `${environment.apiUrl}/api/certificado/v1`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getCertificados(): Observable<ApiResponse<Certificado[]>> {
    return this.http.get<ApiResponse<Certificado[]>>(
      `${this.apiUrl}/findall`,
      { headers: this.getHeaders() }
    );
  }

  getCertificadoById(id: number): Observable<CertificadoResponse> {
    return this.http.get<CertificadoResponse>(
      `${this.apiUrl}/showbyid/${id}`,
      { headers: this.getHeaders() }
    );
  }

  createCertificado(certificado: Certificado): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/create`,
      certificado,
      { headers: this.getHeaders() }
    );
  }

  updateCertificado(certificado: Certificado): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/update`,
      certificado,
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
