import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  let authToken = localStorage.getItem('authToken');
  let baseUrl = localStorage.getItem('baseUrl');

  try {
    if (authToken?.startsWith('"')) authToken = JSON.parse(authToken);
    if (baseUrl?.startsWith('"')) baseUrl = JSON.parse(baseUrl);
  } catch {
    authToken = null;
    baseUrl = null;
  }

  const modifiedReq = req.clone({
    setHeaders: {
      ...(authToken ? { 'X-Authentication': authToken } : {}),
      ...(baseUrl ? { 'Base-Url': baseUrl } : {})
    }
  });

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        console.warn('Token expiré ou invalide. Redirection...');
        localStorage.clear();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
