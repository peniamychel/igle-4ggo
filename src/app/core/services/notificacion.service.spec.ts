import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { NotificacionService } from './notificacion.service';
import { environment } from '../../../environments/environment';

describe('NotificacionService', () => {
  let service: NotificacionService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api/notificaciones/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(NotificacionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getBadge: sin iglesiaId, el query param no se agrega (caso admin)', () => {
    service.getBadge().subscribe();
    const req = httpMock.expectOne(`${base}/badge`);
    expect(req.request.params.has('iglesiaId')).toBeFalse();
    req.flush({ success: true, message: '', datos: { traspasos: 0, eventos: 0, respuestas: 0, total: 0 } });
  });

  it('getBadge: con iglesiaId, se agrega como query param', () => {
    service.getBadge(3).subscribe();
    const req = httpMock.expectOne(r => r.url === `${base}/badge`);
    expect(req.request.params.get('iglesiaId')).toBe('3');
    req.flush({});
  });

  it('getBadge: iglesiaId=0 es falsy, se omite igual que "sin iglesiaId" (mismo patrón de riesgo ya visto en otros servicios)', () => {
    service.getBadge(0).subscribe();
    const req = httpMock.expectOne(`${base}/badge`);
    expect(req.request.params.has('iglesiaId')).toBeFalse();
    req.flush({});
  });
});
