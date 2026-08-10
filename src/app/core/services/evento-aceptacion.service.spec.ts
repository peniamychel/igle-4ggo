import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { EventoAceptacionService } from './evento-aceptacion.service';
import { environment } from '../../../environments/environment';

describe('EventoAceptacionService', () => {
  let service: EventoAceptacionService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api/evento-aceptacion/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(EventoAceptacionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('decidir: POST con el dto como body', () => {
    const dto = { eventoId: 1, iglesiaId: 2, estado: 'ACEPTADO' } as any;
    service.decidir(dto).subscribe();
    const req = httpMock.expectOne(`${base}/decidir`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({});
  });

  it('getDecisionesPorIglesia: interpola el id de la iglesia', () => {
    service.getDecisionesPorIglesia(5).subscribe();
    const req = httpMock.expectOne(`${base}/iglesia/5`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getDecisionPorEventoYIglesia: interpola AMBOS ids en el orden evento/iglesia', () => {
    service.getDecisionPorEventoYIglesia(1, 5).subscribe();
    const req = httpMock.expectOne(`${base}/evento/1/iglesia/5`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
