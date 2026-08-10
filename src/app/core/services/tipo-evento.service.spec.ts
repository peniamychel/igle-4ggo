import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { TipoEventoService } from './tipo-evento.service';
import { environment } from '../../../environments/environment';

/** Mismo patrón de caché ya cubierto en iglesia.service/tipo-cargo.service. */
describe('TipoEventoService', () => {
  let service: TipoEventoService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api/tipo-evento/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TipoEventoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getTipoEventos: comparte una sola petición entre suscriptores', () => {
    service.getTipoEventos().subscribe();
    service.getTipoEventos().subscribe();

    const req = httpMock.expectOne(`${base}/findall`);
    expect(req.request.method).toBe('GET');
    req.flush({ datos: [] });
  });

  it('tras un error, el caché se limpia y el siguiente intento vuelve a pedir', () => {
    service.getTipoEventos().subscribe({ error: () => {} });
    httpMock.expectOne(`${base}/findall`).error(new ProgressEvent('network error'));

    service.getTipoEventos().subscribe();
    const req = httpMock.expectOne(`${base}/findall`);
    expect(req.request.method).toBe('GET');
    req.flush({ datos: [] });
  });

  it('create, update, toggleEstado y delete invalidan el caché', () => {
    const llenar = () => {
      service.getTipoEventos().subscribe();
      httpMock.expectOne(`${base}/findall`).flush({ datos: [] });
    };
    const confirmarInvalidado = () => {
      service.getTipoEventos().subscribe();
      const req = httpMock.expectOne(`${base}/findall`);
      expect(req.request.method).toBe('GET');
      req.flush({ datos: [] });
    };

    llenar();
    service.createTipoEvento({ nombre: 'Retiro' } as any).subscribe();
    httpMock.expectOne(`${base}/create`).flush({});
    confirmarInvalidado();

    service.updateTipoEvento({ id: 1, nombre: 'Retiro' } as any).subscribe();
    httpMock.expectOne(`${base}/update`).flush({});
    confirmarInvalidado();

    service.toggleEstado(1).subscribe();
    httpMock.expectOne(`${base}/estado/1`).flush(true);
    confirmarInvalidado();

    service.deleteTipoEvento(1).subscribe();
    httpMock.expectOne(`${base}/delete/1`).flush({});
    confirmarInvalidado();
  });

  it('getTipoEventoById no pasa por el caché', () => {
    service.getTipoEventoById(3).subscribe();
    const req = httpMock.expectOne(`${base}/showbyid/3`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
