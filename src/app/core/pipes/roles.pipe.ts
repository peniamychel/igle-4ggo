import { Pipe, PipeTransform } from '@angular/core';
import { Role } from '../models/user.model';

@Pipe({
  name: 'roles',
  standalone: true
})
export class RolesPipe implements PipeTransform {
  transform(roles: Role[]): string {
    if (!roles || !Array.isArray(roles)) {
      return '';
    }
    return roles.map(role => role.name).join(', ');
  }
}