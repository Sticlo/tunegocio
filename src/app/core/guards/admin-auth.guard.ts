import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';
import { FirebaseService } from '../services/firebase.service';

const AUTH_WAIT_TIMEOUT_MS = 8_000;

function waitForAuthReady(auth: AdminAuthService): Promise<void> {
  if (!auth.loading()) return Promise.resolve();

  return new Promise((resolve) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (!auth.loading() || Date.now() - started >= AUTH_WAIT_TIMEOUT_MS) {
        clearInterval(timer);
        resolve();
      }
    }, 25);
  });
}

export const adminAuthGuard: CanActivateFn = async () => {
  const auth = inject(AdminAuthService);
  const firebase = inject(FirebaseService);
  const router = inject(Router);

  if (!firebase.enabled) {
    return router.createUrlTree(['/admin/login']);
  }

  await waitForAuthReady(auth);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/admin/login']);
};

export const adminGuestGuard: CanActivateFn = async () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);

  await waitForAuthReady(auth);
  return auth.isLoggedIn() ? router.createUrlTree(['/admin/productos']) : true;
};
