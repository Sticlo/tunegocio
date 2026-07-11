import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  browserLocalPersistence,
  browserSessionPersistence,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly enabled =
    environment.firebase.enabled && Boolean(environment.firebase.apiKey?.trim());

  readonly app: FirebaseApp | null;
  readonly auth: Auth | null;
  readonly firestore: Firestore | null;
  readonly storage: FirebaseStorage | null;

  constructor() {
    if (!isPlatformBrowser(this.platformId) || !this.enabled) {
      this.app = null;
      this.auth = null;
      this.firestore = null;
      this.storage = null;
      return;
    }

    this.app = getApps().length ? getApp() : initializeApp(environment.firebase);
    this.auth = this.createAuth(this.app);
    this.firestore = getFirestore(this.app);
    const bucket = environment.firebase.storageBucket;
    this.storage = bucket ? getStorage(this.app, `gs://${bucket}`) : getStorage(this.app);
  }

  /** Safari móvil a veces falla con solo IndexedDB; cascada de persistencias. */
  private createAuth(app: FirebaseApp): Auth {
    try {
      return initializeAuth(app, {
        persistence: [
          indexedDBLocalPersistence,
          browserLocalPersistence,
          browserSessionPersistence,
        ],
      });
    } catch {
      return getAuth(app);
    }
  }
}
