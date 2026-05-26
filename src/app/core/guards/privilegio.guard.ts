import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/security/auth.service';

export const privilegioGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user is admin, allow all routes
  if (authService.isLoggedRolAdmin()) {
    return true;
  }

  // Get current path
  const path = route.routeConfig?.path;
  if (!path) return true; // allow empty or wildcard if not matched

  // Get privileges from localStorage
  const storedPrivilegios = localStorage.getItem('privilegios');
  if (!storedPrivilegios) {
    router.navigate(['/']);
    return false;
  }

  let userPrivileges: string[] = [];
  try {
    userPrivileges = JSON.parse(storedPrivilegios);
  } catch (e) {
    router.navigate(['/']);
    return false;
  }

  // Helper to normalize strings for comparison
  const normalize = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  const getKeywords = (str: string): string[] => {
    const normalized = normalize(str);
    return normalized
      .split(/[\s/_\-]+/)
      .map(word => {
        if (word.length > 3 && word.endsWith('s')) {
          return word.slice(0, -1);
        }
        return word;
      })
      .filter(word => word.length > 2);
  };

  const routeKeywords = getKeywords(path);
  const title = route.title || '';
  const titleKeywords = title ? getKeywords(title as string) : [];
  const allKeywords = [...new Set([...routeKeywords, ...titleKeywords])];

  if (allKeywords.length === 0) return true;

  // Check if user has privilege
  const hasPrivilege = userPrivileges.some(privilege => {
    const normalizedPrivilege = normalize(privilege);
    return allKeywords.some(keyword => {
      return normalizedPrivilege.includes(keyword);
    });
  });

  if (hasPrivilege) {
    return true;
  } else {
    router.navigate(['/']);
    return false;
  }
};
