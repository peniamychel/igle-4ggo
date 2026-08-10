import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { TipoCargoService } from './tipo-cargo.service';
import { environment } from '../../../environments/environment';

/**
 * Mismo patrón de caché que IglesiaService, pero con DOS cachés independientes
 * (`findall` y `findall-cargo`) que una mutación debe invalidar juntos. El
 * riesgo específico acá es que alguien agregue un tercer caché al servicio y
 * se olvide de sumarlo a invalidateCache(): un test por cada caché deja esa
 * omisión imposible de pasar desapercibida.
 */
describe('TipoCargoService', () => {
  let service: TipoCargoService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api/rol-cargo/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TipoCargoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getTipoCargos: comparte una sola petición entre suscriptores', () => {
    service.getTipoCargos().subscribe();
    service.getTipoCargos().subscribe();

    const req = httpMock.expectOne(`${base}/findall`);
    expect(req.request.method).toBe('GET');
    req.flush({ datos: [] });
  });

  it('getTipoCargosParaColaboradores: es un caché INDEPENDIENTE, con su propia ruta', () => {
    service.getTipoCargosParaColaboradores().subscribe();
    service.getTipoCargosParaColaboradores().subscribe();

    const req = httpMock.expectOne(`${base}/findall-cargo`);
    expect(req.request.method).toBe('GET');
    req.flush({ datos: [] });

    // Confirma que es distinto del caché de getTipoCargos: pedirlo también sale por HTTP.
    service.getTipoCargos().subscribe();
    httpMock.expectOne(`${base}/findall`).flush({ datos: [] });
  });

  it('una mutación invalida AMBOS cachés a la vez, no sólo el que se acaba de tocar', () => {
    service.getTipoCargos().subscribe();
    httpMock.expectOne(`${base}/findall`).flush({ datos: [] });
    service.getTipoCargosParaColaboradores().subscribe();
    httpMock.expectOne(`${base}/findall-cargo`).flush({ datos: [] });

    service.updateTipoCargo({ id: 1, nombre: 'Diácono' } as any).subscribe();
    httpMock.expectOne(`${base}/update`).flush({});

    // Ambos deben volver a pedirse por HTTP: si sólo se invalidara uno, el
    // otro serviría datos desactualizados sin que nadie lo note.
    service.getTipoCargos().subscribe();
    const req1 = httpMock.expectOne(`${base}/findall`);
    expect(req1.request.method).toBe('GET');
    req1.flush({ datos: [] });

    service.getTipoCargosParaColaboradores().subscribe();
    const req2 = httpMock.expectOne(`${base}/findall-cargo`);
    expect(req2.request.method).toBe('GET');
    req2.flush({ datos: [] });
  });

  it('createTipoCargo, toggleEstado y deleteTipoCargo también invalidan', () => {
    // Cada "confirmar" deja el caché tibio otra vez (pidió y recibió
    // respuesta), así que no hace falta re-llenarlo entre pasos: la mutación
    // siguiente ya encuentra un caché poblado para invalidar.
    const confirmarQueGeneraPeticion = () => {
      service.getTipoCargos().subscribe();
      const req = httpMock.expectOne(`${base}/findall`);
      expect(req.request.method).toBe('GET');
      req.flush({ datos: [] });
    };

    confirmarQueGeneraPeticion(); // llena el caché por primera vez

    service.createTipoCargo({ nombre: 'Diácono' } as any).subscribe();
    httpMock.expectOne(`${base}/create`).flush({});
    confirmarQueGeneraPeticion();

    service.toggleEstado(1).subscribe();
    httpMock.expectOne(`${base}/estado/1`).flush({});
    confirmarQueGeneraPeticion();

    service.deleteTipoCargo(1).subscribe();
    httpMock.expectOne(`${base}/delete/1`).flush({});
    confirmarQueGeneraPeticion();
  });

  it('getTipoCargoById no pasa por ningún caché', () => {
    service.getTipoCargoById(9).subscribe();
    const req = httpMock.expectOne(`${base}/showbyid/9`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
