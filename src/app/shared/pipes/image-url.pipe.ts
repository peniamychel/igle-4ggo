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
    const cleanPath = value.startsWith('/') ? value : `/uploads/personas/${value}`;
    return `${environment.apiUrl}${cleanPath}`;
  }
}
