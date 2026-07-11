import { inject, Injectable, signal } from '@angular/core';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { FirebaseService } from './firebase.service';

const AUTH_READY_TIMEOUT_MS = 8_000;

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly firebase = inject(FirebaseService);

  readonly user = signal<User | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    const auth = this.firebase.auth;
    if (!auth) {
      this.loading.set(false);
      return;
    }

    void this.bootstrapAuth();
  }

  isLoggedIn(): boolean {
    return Boolean(this.user());
  }

  async login(email: string, password: string): Promise<void> {
    const auth = this.firebase.auth;
    if (!auth) {
      throw new Error('Firebase Auth no configurado. Revisa environment.ts');
    }

    this.error.set(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      this.error.set('Correo o contraseña incorrectos.');
      throw new Error('auth-failed');
    }
  }

  async logout(): Promise<void> {
    const auth = this.firebase.auth;
    this.error.set(null);
    if (!auth) return;
    await signOut(auth);
  }

  /**
   * En móvil (Safari) IndexedDB/Auth a veces tarda o no dispara el callback.
   * Nunca dejamos `loading` en true indefinidamente.
   */
  private async bootstrapAuth(): Promise<void> {
    const auth = this.firebase.auth;
    if (!auth) {
      this.loading.set(false);
      return;
    }

    onAuthStateChanged(auth, (user) => {
      this.user.set(user);
      this.loading.set(false);
    });

    try {
      await Promise.race([
        auth.authStateReady(),
        new Promise<void>((resolve) => setTimeout(resolve, AUTH_READY_TIMEOUT_MS)),
      ]);
      this.user.set(auth.currentUser);
    } catch {
      this.user.set(auth.currentUser);
    } finally {
      this.loading.set(false);
    }
  }
}
