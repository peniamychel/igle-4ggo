import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ResponsableEventoService } from './responsable-evento.service';
import { environment } from '../../../environments/environment';

describe('ResponsableEventoService', () => {
  let service: ResponsableEventoService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api/responsable-evento/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ResponsableEventoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getResponsables y getResponsablesPorEvento usan rutas distintas', () => {
    service.getResponsables().subscribe();
    const r1 = httpMock.expectOne(`${base}/findall`);
    expect(r1.request.method).toBe('GET');
    r1.flush({});

    service.getResponsablesPorEvento(7).subscribe();
    const r2 = httpMock.expectOne(`${base}/evento/7`);
    expect(r2.request.method).toBe('GET');
    r2.flush({});
  });

  it('createResponsable: POST con el responsable como body', () => {
    const responsable = { cargoId: 1 } as any;
    service.createResponsable(responsable).subscribe();
    const req = httpMock.expectOne(`${base}/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(responsable);
    req.flush({});
  });

  it('toggleEstado: PUT con body vacío', () => {
    service.toggleEstado(1).subscribe();
    const req = httpMock.expectOne(`${base}/estado/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({});
    req.flush(true);
  });

  it('deleteResponsable: DELETE con el id en la ruta', () => {
    service.deleteResponsable(1).subscribe();
    const req = httpMock.expectOne(`${base}/delete/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
