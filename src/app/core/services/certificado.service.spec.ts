import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { CertificadoService } from './certificado.service';
import { environment } from '../../../environments/environment';

describe('CertificadoService', () => {
  let service: CertificadoService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api/certificado/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CertificadoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getCertificados: GET a /findall', () => {
    service.getCertificados().subscribe();
    const req = httpMock.expectOne(`${base}/findall`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getCertificadoById: interpola el id', () => {
    service.getCertificadoById(1).subscribe();
    const req = httpMock.expectOne(`${base}/showbyid/1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('createCertificado: POST con el certificado como body', () => {
    const certificado = { motivo: 'Bautismo' } as any;
    service.createCertificado(certificado).subscribe();
    const req = httpMock.expectOne(`${base}/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(certificado);
    req.flush({});
  });

  it('toggleEstado: PUT con body vacío', () => {
    service.toggleEstado(1).subscribe();
    const req = httpMock.expectOne(`${base}/estado/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({});
    req.flush(true);
  });

  it('deleteCertificado: DELETE con el id en la ruta', () => {
    service.deleteCertificado(1).subscribe();
    const req = httpMock.expectOne(`${base}/delete/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
