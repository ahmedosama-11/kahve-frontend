import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { SessionRecoveryService } from '../services/session-recovery.service';

const AUTH_RETRY = new HttpContextToken<boolean>(() => false);
const NO_AUTO_REFRESH_PATHS = [
  '/login',
  '/signup',
  '/logout',
  '/refresh-token',
  '/auth/refresh-token',
  '/verifyEmail',
  '/resendVerificationCode',
  '/forgotPassword',
  '/verifyResetCode',
  '/resetPassword',
];

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const isApiRequest = req.url.startsWith(API_BASE_URL);
  if (!isApiRequest) return next(req);

  const recovery = inject(SessionRecoveryService);
  const router = inject(Router);
  const token = localStorage.getItem('accessToken');
  const apiPath = req.url.slice(API_BASE_URL.length).split('?')[0];
  const canRefresh = !NO_AUTO_REFRESH_PATHS.some((path) => apiPath.startsWith(path));

  let apiRequest = req.clone({ withCredentials: true });
  if (token) {
    apiRequest = apiRequest.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(apiRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      const alreadyRetried = req.context.get(AUTH_RETRY);
      if (error.status !== 401 || alreadyRetried || !canRefresh) {
        return throwError(() => error);
      }

      return recovery.refreshAccessToken().pipe(
        switchMap((freshToken) => {
          let retryRequest = req.clone({
            withCredentials: true,
            context: req.context.set(AUTH_RETRY, true),
          });

          const tokenToUse = freshToken || localStorage.getItem('accessToken');
          if (tokenToUse) {
            retryRequest = retryRequest.clone({
              setHeaders: { Authorization: `Bearer ${tokenToUse}` },
            });
          }

          return next(retryRequest);
        }),
        catchError((retryError: HttpErrorResponse) => {
          if (retryError.status === 401) recovery.expireSession(router.url);
          return throwError(() => retryError);
        }),
      );
    }),
  );
};
