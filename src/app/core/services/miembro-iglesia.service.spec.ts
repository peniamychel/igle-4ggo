import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { MiembroIglesiaService } from './miembro-iglesia.service';
import { environment } from '../../../environments/environment';

/**
 * Además de los endpoints HTTP, este servicio expone un Subject
 * (`solicitudesChanged$`) que el sidenav usa para refrescar el contador de
 * notificaciones de traspaso. Lo que importa es la lista exacta de qué
 * dispara el aviso: traspaso/aceptar/rechazar/marcarVista/subir-carta SÍ,
 * pero las lecturas (getSolicitudesPendientes, getHistorialMiembro, etc.) NO.
 * Si un método nuevo de escritura se agrega sin el `tap`, el contador del
 * sidenav queda desactualizado y nadie lo nota hasta que alguien reporta que
 * "el numerito no baja".
 */
describe('MiembroIglesiaService', () => {
  let service: MiembroIglesiaService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api/miembroiglesia/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(MiembroIglesiaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  /** Se suscribe a solicitudesChanged$, ejecuta la acción y devuelve cuántas veces avisó. */
  function contarAvisos(disparar: () => void, url: string): number {
    let avisos = 0;
    const sub = service.solicitudesChanged$.subscribe(() => avisos++);

    disparar();
    httpMock.expectOne(url).flush({});

    sub.unsubscribe();
    return avisos;
  }

  describe('operaciones que SÍ avisan a solicitudesChanged$', () => {

    it('traspaso', () => {
      expect(contarAvisos(
        () => service.traspaso({ id: 1 } as any).subscribe(),
        `${base}/traspaso`
      )).toBe(1);
    });

    it('aceptarTraspaso', () => {
      expect(contarAvisos(
        () => service.aceptarTraspaso(1).subscribe(),
        `${base}/traspaso/1/aceptar`
      )).toBe(1);
    });

    it('rechazarTraspaso', () => {
      expect(contarAvisos(
        () => service.rechazarTraspaso(1).subscribe(),
        `${base}/traspaso/1/rechazar`
      )).toBe(1);
    });

    it('marcarRespuestaVista', () => {
      expect(contarAvisos(
        () => service.marcarRespuestaVista(1).subscribe(),
        `${base}/traspaso/1/respuesta-vista`
      )).toBe(1);
    });

    it('uploadCartaTraspaso', () => {
      expect(contarAvisos(
        () => service.uploadCartaTraspaso(1, new File(['x'], 'carta.pdf')).subscribe(),
        `${base}/1/carta-traspaso`
      )).toBe(1);
    });
  });

  describe('operaciones de lectura o CRUD genérico: NO avisan', () => {

    it('getSolicitudesPendientes no dispara el Subject', () => {
      let avisos = 0;
      const sub = service.solicitudesChanged$.subscribe(() => avisos++);

      service.getSolicitudesPendientes(1).subscribe();
      httpMock.expectOne(`${base}/traspaso/pendientes/1`).flush({});

      expect(avisos).toBe(0);
      sub.unsubscribe();
    });

    it('createMiembroIglesia y updateMiembroIglesia tampoco: sólo la familia de traspaso avisa', () => {
      let avisos = 0;
      const sub = service.solicitudesChanged$.subscribe(() => avisos++);

      service.createMiembroIglesia({} as any).subscribe();
      httpMock.expectOne(`${base}/create`).flush({});
      service.updateMiembroIglesia({} as any).subscribe();
      httpMock.expectOne(`${base}/update`).flush({});

      expect(avisos).toBe(0);
      sub.unsubscribe();
    });
  });

  it('notifySolicitudesChanged() dispara el aviso manualmente, sin pasar por HTTP', () => {
    let avisos = 0;
    const sub = service.solicitudesChanged$.subscribe(() => avisos++);

    service.notifySolicitudesChanged();

    expect(avisos).toBe(1);
    sub.unsubscribe();
  });

  describe('rutas de lectura', () => {

    it('getRespuestasSinVer y getSolicitudesPendientes usan rutas distintas', () => {
      service.getSolicitudesPendientes(5).subscribe();
      const req1 = httpMock.expectOne(`${base}/traspaso/pendientes/5`);
      expect(req1.request.method).toBe('GET');
      req1.flush({});

      service.getRespuestasSinVer(5).subscribe();
      const req2 = httpMock.expectOne(`${base}/traspaso/respuestas/5`);
      expect(req2.request.method).toBe('GET');
      req2.flush({});
    });

    it('getHistorialMiembro interpola el id del miembro', () => {
      service.getHistorialMiembro(7).subscribe();
      const req = httpMock.expectOne(`${base}/historial/7`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('getMisMiembros: ruta fija, sin parámetros', () => {
      service.getMisMiembros().subscribe();
      const req = httpMock.expectOne(`${base}/mis-miembros`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });
});
