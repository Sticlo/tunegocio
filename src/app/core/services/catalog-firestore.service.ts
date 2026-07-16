import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  FirestoreCategory,
  FirestoreCategoryInput,
  FirestoreProduct,
  FirestoreProductInput,
} from '../models/firestore-catalog.model';
import { environment } from '../../../environments/environment';
import {
  mapActiveCategories,
  mapActiveProducts,
  mapFirestoreCategory,
  mapFirestoreProduct,
} from '../utils/firestore-catalog-mappers';
import { listFirestoreCollectionRest } from '../utils/firestore-rest';
import { FirebaseService } from './firebase.service';
import { formatFirebaseUploadError } from '../utils/firebase-upload-error';

const CATEGORIES = 'categories';
const PRODUCTS = 'products';
const REST_CACHE_TTL_MS = 5 * 60 * 1000;

interface RestCache<T> {
  expiresAt: number;
  items: T[];
}

/** Shared across SSR requests in the same Node process. */
let productsRestCache: RestCache<FirestoreProduct> | null = null;
let categoriesRestCache: RestCache<FirestoreCategory> | null = null;

@Injectable({ providedIn: 'root' })
export class CatalogFirestoreService {
  private readonly firebase = inject(FirebaseService);

  isAvailable(): boolean {
    return Boolean(this.firebase.firestore);
  }

  /** True when we can load catalog via SDK or public REST (SSR). */
  canReadCatalog(): boolean {
    return this.isAvailable() || Boolean(environment.firebase.projectId?.trim());
  }

  async listCategories(includeInactive = false): Promise<FirestoreCategory[]> {
    const db = this.firebase.firestore;
    if (db) {
      const snap = await getDocs(query(collection(db, CATEGORIES), orderBy('order', 'asc')));
      const items = mapActiveCategories(
        snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> })),
        true,
      );
      return includeInactive ? items : items.filter((c) => c.active);
    }

    return this.listCategoriesViaRest(includeInactive);
  }

  async listProducts(includeInactive = false): Promise<FirestoreProduct[]> {
    const db = this.firebase.firestore;
    if (db) {
      const snap = await getDocs(query(collection(db, PRODUCTS), orderBy('name', 'asc')));
      const items = mapActiveProducts(
        snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> })),
        true,
      );
      return includeInactive ? items : items.filter((p) => p.active);
    }

    return this.listProductsViaRest(includeInactive);
  }

  /** Public REST read — used on SSR when the Firebase browser SDK is unavailable. */
  async listProductsViaRest(includeInactive = false): Promise<FirestoreProduct[]> {
    const now = Date.now();
    if (productsRestCache && productsRestCache.expiresAt > now) {
      return includeInactive
        ? productsRestCache.items
        : productsRestCache.items.filter((p) => p.active);
    }

    const projectId = environment.firebase.projectId || 'tunegocio-4de17';
    const docs = await listFirestoreCollectionRest(PRODUCTS, projectId);
    const items = mapActiveProducts(docs, true);
    productsRestCache = { items, expiresAt: now + REST_CACHE_TTL_MS };
    return includeInactive ? items : items.filter((p) => p.active);
  }

  async listCategoriesViaRest(includeInactive = false): Promise<FirestoreCategory[]> {
    const now = Date.now();
    if (categoriesRestCache && categoriesRestCache.expiresAt > now) {
      return includeInactive
        ? categoriesRestCache.items
        : categoriesRestCache.items.filter((c) => c.active);
    }

    const projectId = environment.firebase.projectId || 'tunegocio-4de17';
    const docs = await listFirestoreCollectionRest(CATEGORIES, projectId);
    const items = mapActiveCategories(docs, true);
    categoriesRestCache = { items, expiresAt: now + REST_CACHE_TTL_MS };
    return includeInactive ? items : items.filter((c) => c.active);
  }

  async getCategory(id: string): Promise<FirestoreCategory | null> {
    const db = this.firebase.firestore;
    if (!db) return null;

    const snap = await getDoc(doc(db, CATEGORIES, id));
    if (!snap.exists()) return null;
    return mapFirestoreCategory(snap.id, snap.data() as Record<string, unknown>);
  }

  async getProduct(id: string): Promise<FirestoreProduct | null> {
    const db = this.firebase.firestore;
    if (!db) return null;

    const snap = await getDoc(doc(db, PRODUCTS, id));
    if (!snap.exists()) return null;
    return mapFirestoreProduct(snap.id, snap.data() as Record<string, unknown>);
  }

  async saveCategory(id: string, input: FirestoreCategoryInput): Promise<void> {
    const db = this.firebase.firestore;
    if (!db) throw new Error('Firebase no configurado');

    await setDoc(doc(db, CATEGORIES, id), {
      ...input,
      updatedAt: serverTimestamp(),
    });
    categoriesRestCache = null;
  }

  async saveProduct(id: string, input: FirestoreProductInput): Promise<void> {
    const db = this.firebase.firestore;
    if (!db) throw new Error('Firebase no configurado');

    await setDoc(doc(db, PRODUCTS, id), {
      ...input,
      updatedAt: serverTimestamp(),
    });
    productsRestCache = null;
  }

  async deleteCategory(id: string): Promise<void> {
    const db = this.firebase.firestore;
    if (!db) throw new Error('Firebase no configurado');
    await deleteDoc(doc(db, CATEGORIES, id));
    categoriesRestCache = null;
  }

  async countProductsInCategory(categorySlug: string): Promise<number> {
    const products = await this.listProducts(true);
    return products.filter((product) => product.categorySlug === categorySlug).length;
  }

  async deleteCategoryCascade(category: FirestoreCategory): Promise<number> {
    const db = this.firebase.firestore;
    if (!db) throw new Error('Firebase no configurado');

    const snap = await getDocs(collection(db, PRODUCTS));
    const productDocs = snap.docs.filter(
      (productDoc) =>
        mapFirestoreProduct(productDoc.id, productDoc.data() as Record<string, unknown>)
          .categorySlug === category.slug,
    );

    const batch = writeBatch(db);
    for (const productDoc of productDocs) {
      batch.delete(productDoc.ref);
    }
    batch.delete(doc(db, CATEGORIES, category.id));
    await batch.commit();
    productsRestCache = null;
    categoriesRestCache = null;

    return productDocs.length;
  }

  async deleteProduct(id: string): Promise<void> {
    const db = this.firebase.firestore;
    if (!db) throw new Error('Firebase no configurado');
    await deleteDoc(doc(db, PRODUCTS, id));
    productsRestCache = null;
  }

  async uploadImage(folder: 'categories' | 'products', id: string, file: File): Promise<string> {
    const storage = this.firebase.storage;
    if (!storage) throw new Error('Firebase Storage no configurado');

    if (!this.firebase.auth?.currentUser) {
      throw new Error('Debes iniciar sesión en el panel para subir fotos.');
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${folder}/${id}/${Date.now()}-${safeName}`;

    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (err) {
      throw new Error(formatFirebaseUploadError(err));
    }
  }
}

export { Timestamp };
