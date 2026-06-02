import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Signal para manejar el estado del tema reactivamente
  isDarkMode = signal<boolean>(false);

  constructor() {
    this.initTheme();
  }

  // Inicializa el tema desde localStorage o preferencia del sistema
  private initTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const dark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    this.setTheme(dark);
  }

  // Establece el tema y actualiza el DOM
  setTheme(dark: boolean): void {
    this.isDarkMode.set(dark);
    if (dark) {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }

  // Alterna entre temas
  toggleTheme(): void {
    this.setTheme(!this.isDarkMode());
  }
}
