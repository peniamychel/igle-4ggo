import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../services/security/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
 const router = inject(Router);
  const authService = inject(AuthService);
  if (authService.isAuth()) {
    return true;
  }else {
    router.navigate(['/']);
    return false;
  }
};
