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
import { FirebaseService } from './firebase.service';
import { formatFirebaseUploadError } from '../utils/firebase-upload-error';
import { sortCategories } from '../utils/sort-categories';

const CATEGORIES = 'categories';
const PRODUCTS = 'products';

function mapCategory(id: string, data: Record<string, unknown>): FirestoreCategory {
  return {
    id,
    name: String(data['name'] ?? ''),
    slug: String(data['slug'] ?? ''),
    heading: String(data['heading'] ?? data['name'] ?? ''),
    description: String(data['description'] ?? ''),
    intro: String(data['intro'] ?? ''),
    imageUrl: String(data['imageUrl'] ?? ''),
    order: Number(data['order'] ?? 0),
    active: data['active'] !== false,
  };
}

function mapProduct(id: string, data: Record<string, unknown>): FirestoreProduct {
  const name = String(data['name'] ?? '');
  const shortDescription = String(data['shortDescription'] ?? '');
  return {
    id,
    name,
    slug: String(data['slug'] ?? ''),
    categorySlug: String(data['categorySlug'] ?? ''),
    price: Number(data['price'] ?? 0),
    shortDescription,
    seoTitle: String(data['seoTitle'] ?? name),
    metaDescription: String(data['metaDescription'] ?? shortDescription),
    imageAlt: String(data['imageAlt'] ?? name),
    imageUrl: String(data['imageUrl'] ?? ''),
    active: data['active'] !== false,
  };
}

@Injectable({ providedIn: 'root' })
export class CatalogFirestoreService {
  private readonly firebase = inject(FirebaseService);

  isAvailable(): boolean {
    return Boolean(this.firebase.firestore);
  }

  async listCategories(includeInactive = false): Promise<FirestoreCategory[]> {
    const db = this.firebase.firestore;
    if (!db) return [];

    const snap = await getDocs(query(collection(db, CATEGORIES), orderBy('order', 'asc')));
    const items = sortCategories(snap.docs.map((d) => mapCategory(d.id, d.data())));
    return includeInactive ? items : items.filter((c) => c.active);
  }

  async listProducts(includeInactive = false): Promise<FirestoreProduct[]> {
    const db = this.firebase.firestore;
    if (!db) return [];

    const snap = await getDocs(query(collection(db, PRODUCTS), orderBy('name', 'asc')));
    const items = snap.docs.map((d) => mapProduct(d.id, d.data()));
    return includeInactive ? items : items.filter((p) => p.active);
  }

  async getCategory(id: string): Promise<FirestoreCategory | null> {
    const db = this.firebase.firestore;
    if (!db) return null;

    const snap = await getDoc(doc(db, CATEGORIES, id));
    if (!snap.exists()) return null;
    return mapCategory(snap.id, snap.data());
  }

  async getProduct(id: string): Promise<FirestoreProduct | null> {
    const db = this.firebase.firestore;
    if (!db) return null;

    const snap = await getDoc(doc(db, PRODUCTS, id));
    if (!snap.exists()) return null;
    return mapProduct(snap.id, snap.data());
  }

  async saveCategory(id: string, input: FirestoreCategoryInput): Promise<void> {
    const db = this.firebase.firestore;
    if (!db) throw new Error('Firebase no configurado');

    await setDoc(doc(db, CATEGORIES, id), {
      ...input,
      updatedAt: serverTimestamp(),
    });
  }

  async saveProduct(id: string, input: FirestoreProductInput): Promise<void> {
    const db = this.firebase.firestore;
    if (!db) throw new Error('Firebase no configurado');

    await setDoc(doc(db, PRODUCTS, id), {
      ...input,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteCategory(id: string): Promise<void> {
    const db = this.firebase.firestore;
    if (!db) throw new Error('Firebase no configurado');
    await deleteDoc(doc(db, CATEGORIES, id));
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
      (productDoc) => mapProduct(productDoc.id, productDoc.data()).categorySlug === category.slug,
    );

    const batch = writeBatch(db);
    for (const productDoc of productDocs) {
      batch.delete(productDoc.ref);
    }
    batch.delete(doc(db, CATEGORIES, category.id));
    await batch.commit();

    return productDocs.length;
  }

  async deleteProduct(id: string): Promise<void> {
    const db = this.firebase.firestore;
    if (!db) throw new Error('Firebase no configurado');
    await deleteDoc(doc(db, PRODUCTS, id));
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
