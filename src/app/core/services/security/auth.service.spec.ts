import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { environment } from '../../../../environments/environment';

/**
 * Es la pieza de seguridad del lado cliente: de acá salen el token, el rol y
 * los privilegios que consumen el interceptor, los guards y el menú. El
 * equivalente frontend de UserDetailsServiceImpl en el backend.
 *
 * Todo su estado vive en localStorage, así que cada test lo limpia y arma el
 * suyo. El servicio se crea DENTRO de cada test (no en el beforeEach) porque
 * su constructor lee localStorage: hay que sembrarlo antes de instanciarlo.
 */
describe('AuthService', () => {
  let httpMock: HttpTestingController;

  /** JWT falso: sólo importa el payload, que es lo único que el servicio decodifica. */
  function jwtCon(payload: object): string {
    return `encabezado.${btoa(JSON.stringify(payload))}.firma`;
  }

  const ahoraEnSegundos = () => Math.floor(Date.now() / 1000);

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  /** Instancia el servicio DESPUÉS de haber sembrado el localStorage. */
  const crear = () => TestBed.inject(AuthService);

  // ───────────────────────── isTokenExpired ─────────────────────────

  describe('isTokenExpired', () => {

    it('sin token: se considera expirado (default-deny)', () => {
      expect(crear().isTokenExpired()).toBeTrue();
    });

    it('token ilegible: se considera expirado, no se asume válido', () => {
      localStorage.setItem('auth_token', 'esto-no-es-un-jwt');
      expect(crear().isTokenExpired()).toBeTrue();
    });

    it('exp en el pasado: expirado', () => {
      localStorage.setItem('auth_token', jwtCon({ exp: ahoraEnSegundos() - 60 }));
      expect(crear().isTokenExpired()).toBeTrue();
    });

    it('exp en el futuro: vigente', () => {
      localStorage.setItem('auth_token', jwtCon({ exp: ahoraEnSegundos() + 3600 }));
      expect(crear().isTokenExpired()).toBeFalse();
    });

    it('token SIN campo exp: se considera vigente para siempre (comportamiento actual)', () => {
      // Ojo: acá el default NO es denegar. Un token sin `exp` nunca vence del
      // lado del cliente; sólo lo frena el backend al validar la firma. Se fija
      // con un test para que, si algún día se decide invertirlo, sea una
      // decisión explícita y no un cambio accidental.
      localStorage.setItem('auth_token', jwtCon({ sub: 'carlos' }));
      expect(crear().isTokenExpired()).toBeFalse();
    });
  });

  // ───────────────────────── isAuthenticated / isAuth ─────────────────────────

  describe('isAuthenticated', () => {

    it('exige token Y que no esté expirado', () => {
      localStorage.setItem('auth_token', jwtCon({ exp: ahoraEnSegundos() + 3600 }));
      expect(crear().isAuthenticated()).toBeTrue();
    });

    it('con token expirado no está autenticado', () => {
      localStorage.setItem('auth_token', jwtCon({ exp: ahoraEnSegundos() - 60 }));
      expect(crear().isAuthenticated()).toBeFalse();
    });

    it('isAuth() delega en isAuthenticated(): una sola implementación', () => {
      localStorage.setItem('auth_token', jwtCon({ exp: ahoraEnSegundos() + 3600 }));
      const service = crear();
      expect(service.isAuth()).toBe(service.isAuthenticated());
    });
  });

  // ───────────────────────── roles ─────────────────────────

  describe('roles', () => {

    it('isLoggedRolAdmin sólo con ROLE_ADMIN exacto', () => {
      localStorage.setItem('role', 'ROLE_ADMIN');
      expect(crear().isLoggedRolAdmin()).toBeTrue();
    });

    it('otro rol no es admin', () => {
      localStorage.setItem('role', 'ROLE_PASTOR');
      expect(crear().isLoggedRolAdmin()).toBeFalse();
    });

    it('sin rol guardado no es admin', () => {
      expect(crear().isLoggedRolAdmin()).toBeFalse();
    });

    it('isLoggedRolEncargado reconoce ROLE_ENCARGADO_IGLESIA', () => {
      localStorage.setItem('role', 'ROLE_ENCARGADO_IGLESIA');
      expect(crear().isLoggedRolEncargado()).toBeTrue();
    });
  });

  // ───────────────────────── hasPrivilegio ─────────────────────────

  describe('hasPrivilegio', () => {

    it('ADMIN tiene bypass total, aunque no tenga privilegios guardados', () => {
      localStorage.setItem('role', 'ROLE_ADMIN');
      expect(crear().hasPrivilegio('CUALQUIER:COSA')).toBeTrue();
    });

    it('sin privilegios guardados: false', () => {
      localStorage.setItem('role', 'ROLE_PASTOR');
      expect(crear().hasPrivilegio('MIEMBROS:VER')).toBeFalse();
    });

    it('privilegios ilegibles (JSON roto): false, no revienta', () => {
      localStorage.setItem('role', 'ROLE_PASTOR');
      localStorage.setItem('privilegios', '{esto no es json');
      expect(crear().hasPrivilegio('MIEMBROS:VER')).toBeFalse();
    });

    it('privilegios que no son un array: false', () => {
      localStorage.setItem('role', 'ROLE_PASTOR');
      localStorage.setItem('privilegios', '{"a":1}');
      expect(crear().hasPrivilegio('MIEMBROS:VER')).toBeFalse();
    });

    it('coincidencia exacta del código SERVICIO:ACCION', () => {
      localStorage.setItem('role', 'ROLE_PASTOR');
      localStorage.setItem('privilegios', JSON.stringify(['MIEMBROS:VER']));
      const service = crear();
      expect(service.hasPrivilegio('MIEMBROS:VER')).toBeTrue();
      expect(service.hasPrivilegio('MIEMBROS:ELIMINAR')).toBeFalse();
    });

    it('traduce el nombre legible al código via PRIVILEGE_MAPPING', () => {
      // 'Ver Miembros' no está en localStorage, pero mapea a MIEMBROS:VER que sí.
      localStorage.setItem('role', 'ROLE_PASTOR');
      localStorage.setItem('privilegios', JSON.stringify(['MIEMBROS:VER']));
      expect(crear().hasPrivilegio('Ver Miembros')).toBeTrue();
    });

    it('un nombre de escritura basta con UNO de sus códigos', () => {
      // 'Escribir Miembros' mapea a CREAR/EDITAR/ELIMINAR/SUBIR_FOTO.
      localStorage.setItem('role', 'ROLE_PASTOR');
      localStorage.setItem('privilegios', JSON.stringify(['MIEMBROS:SUBIR_FOTO']));
      expect(crear().hasPrivilegio('Escribir Miembros')).toBeTrue();
    });

    it('con una lista alcanza tener uno solo de los pedidos', () => {
      localStorage.setItem('role', 'ROLE_PASTOR');
      localStorage.setItem('privilegios', JSON.stringify(['EVENTOS:VER']));
      const service = crear();
      expect(service.hasPrivilegio(['MIEMBROS:VER', 'EVENTOS:VER'])).toBeTrue();
      expect(service.hasPrivilegio(['MIEMBROS:VER', 'IGLESIAS:VER'])).toBeFalse();
    });

    it('la comparación distingue mayúsculas: no hay coincidencia laxa', () => {
      localStorage.setItem('role', 'ROLE_PASTOR');
      localStorage.setItem('privilegios', JSON.stringify(['MIEMBROS:VER']));
      expect(crear().hasPrivilegio('miembros:ver')).toBeFalse();
    });

    it('hasAccion es un alias de hasPrivilegio', () => {
      localStorage.setItem('role', 'ROLE_PASTOR');
      localStorage.setItem('privilegios', JSON.stringify(['MIEMBROS:VER']));
      const service = crear();
      expect(service.hasAccion('MIEMBROS:VER')).toBe(service.hasPrivilegio('MIEMBROS:VER'));
    });
  });

  // ───────────────────────── logout ─────────────────────────

  describe('logout', () => {

    it('borra TODAS las claves de sesión, no sólo el token', () => {
      // Si alguna sobrevive, el siguiente usuario que entre en la misma máquina
      // hereda rol o privilegios ajenos.
      // user_data va con JSON válido a propósito: el constructor lo parsea sin
      // protección (ver el test de fragilidad más abajo).
      localStorage.setItem('user_data', JSON.stringify({ username: 'carlos' }));
      ['auth_token', 'role', 'nombreuser', 'datosUsuario',
       'privilegios', 'user_iglesias'].forEach(k => localStorage.setItem(k, 'x'));

      crear().logout();

      ['auth_token', 'user_data', 'role', 'nombreuser', 'datosUsuario',
       'privilegios', 'user_iglesias'].forEach(k => {
        expect(localStorage.getItem(k)).withContext(`clave ${k}`).toBeNull();
      });
    });

    it('deja el usuario actual en null', () => {
      const service = crear();
      service.logout();
      expect(service.getCurrentUser()).toBeNull();
    });
  });

  // ───────────────────────── fragilidad del constructor ─────────────────────────

  describe('loadStoredUser (constructor)', () => {

    it('restaura el usuario guardado al construirse', () => {
      localStorage.setItem('user_data', JSON.stringify({ username: 'carlos' }));
      expect(crear().getCurrentUser()).toEqual({ username: 'carlos' } as any);
    });

    it('REGRESIÓN: con user_data corrupto el constructor NO lanza — la app tiene que arrancar igual', () => {
      // Antes esto tumbaba el arranque entero: AuthService es
      // providedIn:'root' y lo inyectan el interceptor, los 3 guards y muchos
      // componentes, así que la excepción dejaba la app en blanco y sin salida
      // para el usuario (sólo se recuperaba borrando los datos del sitio).
      localStorage.setItem('user_data', 'no-es-json');
      expect(() => crear()).not.toThrow();
    });

    it('con user_data corrupto el usuario queda en null, que es un estado ya soportado', () => {
      localStorage.setItem('user_data', 'no-es-json');
      expect(crear().getCurrentUser()).toBeNull();
    });

    it('descarta la clave corrupta para que el fallo no se repita en cada recarga', () => {
      localStorage.setItem('user_data', 'no-es-json');
      crear();
      expect(localStorage.getItem('user_data')).toBeNull();
    });

    it('NO cierra la sesión: el token sobrevive, porque isAuthenticated() no depende de user_data', () => {
      // La recuperación es acotada a propósito: se descarta sólo el dato
      // ilegible. Desloguear además obligaría a volver a entrar por un
      // problema que no afecta la validez de la sesión.
      const token = jwtCon({ exp: ahoraEnSegundos() + 3600 });
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', 'no-es-json');

      const service = crear();

      expect(service.getToken()).toBe(token);
      expect(service.isAuthenticated()).toBeTrue();
    });
  });

  // ───────────────────────── getDecodedToken ─────────────────────────

  describe('getDecodedToken y contexto de iglesia', () => {

    it('sin token devuelve null', () => {
      expect(crear().getDecodedToken()).toBeNull();
    });

    it('token ilegible devuelve null en vez de lanzar', () => {
      localStorage.setItem('auth_token', 'roto');
      expect(crear().getDecodedToken()).toBeNull();
    });

    it('expone iglesia y cargo del token', () => {
      localStorage.setItem('auth_token', jwtCon({
        iglesiaId: 7, iglesiaNombre: 'Palmar', cargoNombre: 'Pastor'
      }));
      const service = crear();
      expect(service.getCurrentIglesiaId()).toBe(7);
      expect(service.getCurrentIglesiaNombre()).toBe('Palmar');
      expect(service.getCurrentCargoNombre()).toBe('Pastor');
    });

    it('sin token, el contexto de iglesia es null y no revienta', () => {
      const service = crear();
      expect(service.getCurrentIglesiaId()).toBeNull();
      expect(service.getCurrentIglesiaNombre()).toBeNull();
    });
  });

  // ───────────────────────── login ─────────────────────────

  describe('login', () => {

    it('separa el ROLE_ de los privilegios al leer las authorities del JWT', () => {
      const service = crear();
      const token = jwtCon({
        exp: ahoraEnSegundos() + 3600,
        authorities: ['ROLE_PASTOR', 'MIEMBROS:VER', 'EVENTOS:CREAR']
      });

      service.login({ username: 'carlos', password: 'x' } as any).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/login`)
        .flush({ token, username: 'carlos' });

      expect(localStorage.getItem('auth_token')).toBe(token);
      expect(localStorage.getItem('role')).toBe('ROLE_PASTOR');
      expect(JSON.parse(localStorage.getItem('privilegios')!))
        .toEqual(['MIEMBROS:VER', 'EVENTOS:CREAR']);
    });

    it('si el JWT no trae ningún ROLE_, cae a ROLE_USER', () => {
      const service = crear();
      const token = jwtCon({ authorities: ['MIEMBROS:VER'] });

      service.login({ username: 'carlos', password: 'x' } as any).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/login`).flush({ token, username: 'carlos' });

      expect(localStorage.getItem('role')).toBe('ROLE_USER');
    });

    it('con requiresSelection NO guarda sesión todavía (falta elegir iglesia)', () => {
      const service = crear();

      service.login({ username: 'carlos', password: 'x' } as any).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/login`)
        .flush({ requiresSelection: true, iglesias: [{ id: 1 }], username: 'carlos' });

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('role')).toBeNull();
    });

    it('selectCargo sí cierra el login y guarda el token definitivo', () => {
      const service = crear();
      const token = jwtCon({ authorities: ['ROLE_PASTOR', 'MIEMBROS:VER'] });

      service.selectCargo('pre-token', 3).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/select-cargo`);
      expect(req.request.body).toEqual({ preAuthToken: 'pre-token', iglesiaId: 3 });
      req.flush({ token, username: 'carlos' });

      expect(localStorage.getItem('auth_token')).toBe(token);
      expect(localStorage.getItem('role')).toBe('ROLE_PASTOR');
    });

    it('switchChurch reemplaza el token y el contexto sin pasar por login', () => {
      const service = crear();
      const nuevo = jwtCon({ authorities: ['ROLE_PASTOR'], iglesiaId: 9, iglesiaNombre: 'Libertad' });

      service.switchChurch(9).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/switch-church`);
      expect(req.request.body).toEqual({ iglesiaId: 9 });
      req.flush({ token: nuevo, username: 'carlos' });

      expect(service.getCurrentIglesiaId()).toBe(9);
      expect(service.getCurrentIglesiaNombre()).toBe('Libertad');
    });
  });
});
