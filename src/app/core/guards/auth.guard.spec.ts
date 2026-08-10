import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

import { authGuard } from './auth.guard';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/security/auth.service';

/**
 * Los dos guards simples de la app. Son pocas líneas, pero deciden si alguien
 * entra o no: lo que hay que fijar es que ante la duda NIEGUEN, y que además
 * de devolver false redirijan (si sólo devolvieran false, el usuario se
 * quedaría en una pantalla vacía sin saber qué pasó).
 *
 * `privilegioGuard` queda fuera a propósito por ahora: tiene una lista
 * `globalRoutes` que contradice a ROUTE_VIEW_MAP y está pendiente de decisión.
 */
describe('guards de ruta', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const ruta = {} as ActivatedRouteSnapshot;
  const estado = {} as RouterStateSnapshot;

  /** Los CanActivateFn usan inject(), así que hay que ejecutarlos dentro del contexto de TestBed. */
  const correr = (guard: typeof authGuard) =>
    TestBed.runInInjectionContext(() => guard(ruta, estado));

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', ['isAuth', 'isLoggedRolAdmin']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
  });

  describe('authGuard', () => {

    it('autenticado: deja pasar y no redirige', () => {
      authService.isAuth.and.returnValue(true);

      expect(correr(authGuard)).toBeTrue();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('no autenticado: bloquea Y manda al login', () => {
      authService.isAuth.and.returnValue(false);

      expect(correr(authGuard)).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('adminGuard', () => {

    it('admin: deja pasar', () => {
      authService.isLoggedRolAdmin.and.returnValue(true);

      expect(correr(adminGuard)).toBeTrue();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('no admin: bloquea y manda a /no-autorizado (no al login: sí está logueado)', () => {
      // La distinción importa: mandarlo a '/' haría pensar que perdió la sesión.
      authService.isLoggedRolAdmin.and.returnValue(false);

      expect(correr(adminGuard)).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/no-autorizado']);
    });

    it('no consulta isAuth: sólo le importa el rol', () => {
      // Documenta que adminGuard confía en que authGuard ya corrió en la ruta
      // padre. Si alguna ruta usara adminGuard SIN authGuard, un anónimo sin
      // rol guardado igual sería rechazado (isLoggedRolAdmin da false), así que
      // el default sigue siendo negar.
      authService.isLoggedRolAdmin.and.returnValue(false);

      correr(adminGuard);

      expect(authService.isAuth).not.toHaveBeenCalled();
    });
  });
});
