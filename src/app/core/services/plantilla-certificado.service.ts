import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/interfaces/api.response';
import { PlantillaCertificado } from '../models/plantilla-certificado.model';

@Injectable({
  providedIn: 'root'
})
export class PlantillaCertificadoService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/v1/plantilla-certificado`;

  findAll(): Observable<ApiResponse<PlantillaCertificado[]>> {
    return this.http.get<ApiResponse<PlantillaCertificado[]>>(this.apiUrl);
  }

  findById(id: number): Observable<ApiResponse<PlantillaCertificado>> {
    return this.http.get<ApiResponse<PlantillaCertificado>>(`${this.apiUrl}/${id}`);
  }

  create(plantilla: PlantillaCertificado): Observable<ApiResponse<PlantillaCertificado>> {
    return this.http.post<ApiResponse<PlantillaCertificado>>(this.apiUrl, plantilla);
  }

  update(id: number, plantilla: PlantillaCertificado): Observable<ApiResponse<PlantillaCertificado>> {
    return this.http.put<ApiResponse<PlantillaCertificado>>(`${this.apiUrl}/${id}`, plantilla);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  changeState(id: number): Observable<ApiResponse<PlantillaCertificado>> {
    return this.http.put<ApiResponse<PlantillaCertificado>>(`${this.apiUrl}/estado/${id}`, {});
  }

  uploadLogo(id: number, file: File): Observable<ApiResponse<string>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/${id}/logo`, formData);
  }

  uploadMarcaAgua(id: number, file: File): Observable<ApiResponse<string>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/${id}/marca-agua`, formData);
  }

  uploadFirma(id: number, file: File): Observable<ApiResponse<string>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/${id}/firma`, formData);
  }
}
