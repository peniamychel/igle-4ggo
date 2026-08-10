import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

/**
 * No es un servicio HTTP, pero tiene una condición real fácil de invertir por
 * error: `savedTheme === 'dark' || (!savedTheme && systemPrefersDark)`. La
 * preferencia guardada SIEMPRE debe ganar sobre la del sistema — sólo se
 * consulta `matchMedia` cuando no hay nada guardado todavía. El servicio se
 * crea DENTRO de cada test, no en el beforeEach, porque su constructor lee
 * localStorage y matchMedia: hay que sembrarlos antes de instanciarlo.
 */
describe('ThemeService', () => {

  /** Reemplaza window.matchMedia con uno que responde `matches` fijo, sin importar la media query. */
  function mockMatchMedia(matches: boolean) {
    spyOn(window, 'matchMedia').and.returnValue({
      matches,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    } as unknown as MediaQueryList);
  }

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark-theme');
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark-theme');
  });

  const crear = () => TestBed.inject(ThemeService);

  describe('initTheme: qué gana entre lo guardado y la preferencia del sistema', () => {

    it('con theme guardado en "dark", es oscuro sin importar el sistema', () => {
      localStorage.setItem('theme', 'dark');
      mockMatchMedia(false); // el sistema prefiere claro, pero lo guardado gana

      expect(crear().isDarkMode()).toBeTrue();
    });

    it('con theme guardado en "light", es claro aunque el sistema prefiera oscuro', () => {
      localStorage.setItem('theme', 'light');
      mockMatchMedia(true);

      expect(crear().isDarkMode()).toBeFalse();
    });

    it('SIN nada guardado, sigue la preferencia del sistema (oscuro)', () => {
      mockMatchMedia(true);

      expect(crear().isDarkMode()).toBeTrue();
    });

    it('SIN nada guardado, sigue la preferencia del sistema (claro)', () => {
      mockMatchMedia(false);

      expect(crear().isDarkMode()).toBeFalse();
    });

    it('al inicializar, aplica la clase dark-theme al <html> si corresponde', () => {
      localStorage.setItem('theme', 'dark');
      mockMatchMedia(false);

      crear();

      expect(document.documentElement.classList.contains('dark-theme')).toBeTrue();
    });
  });

  describe('setTheme', () => {

    it('oscuro: agrega la clase al DOM y persiste "dark"', () => {
      mockMatchMedia(false);
      const service = crear();

      service.setTheme(true);

      expect(service.isDarkMode()).toBeTrue();
      expect(document.documentElement.classList.contains('dark-theme')).toBeTrue();
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('claro: quita la clase del DOM y persiste "light"', () => {
      mockMatchMedia(false);
      const service = crear();
      service.setTheme(true); // arranca en oscuro para probar que se revierte

      service.setTheme(false);

      expect(service.isDarkMode()).toBeFalse();
      expect(document.documentElement.classList.contains('dark-theme')).toBeFalse();
      expect(localStorage.getItem('theme')).toBe('light');
    });
  });

  describe('toggleTheme', () => {

    it('invierte el estado actual', () => {
      mockMatchMedia(false);
      const service = crear();
      expect(service.isDarkMode()).toBeFalse();

      service.toggleTheme();
      expect(service.isDarkMode()).toBeTrue();

      service.toggleTheme();
      expect(service.isDarkMode()).toBeFalse();
    });
  });
});
