import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  getCertificados(): Observable<ApiResponse<Certificado[]>> {
    return this.http.get<ApiResponse<Certificado[]>>(`${this.apiUrl}/findall`);
  }

  getCertificadoById(id: number): Observable<CertificadoResponse> {
    return this.http.get<CertificadoResponse>(`${this.apiUrl}/showbyid/${id}`);
  }

  createCertificado(certificado: Certificado): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, certificado);
  }

  updateCertificado(certificado: Certificado): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, certificado);
  }

  toggleEstado(id: number): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/estado/${id}`, {});
  }

  deleteCertificado(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/delete/${id}`);
  }
}
