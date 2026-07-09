import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'imageUrl',
  standalone: true
})
export class ImageUrlPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    if (value.endsWith('/') || value === '/uploads/miembros' || value === '/uploads/personas') {
      return '';
    }
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
      return value;
    }
    let cleanPath = '';
    if (value.startsWith('/')) {
      cleanPath = value;
    } else if (value.startsWith('activos/') || value.startsWith('iglesias/') || value.startsWith('miembros/') || value.startsWith('cargos/') || value.startsWith('cartas-traspaso/')) {
      cleanPath = `/uploads/${value}`;
    } else {
      cleanPath = `/uploads/personas/${value}`;
    }
    return `${environment.apiUrl}${cleanPath}`;
  }
}
