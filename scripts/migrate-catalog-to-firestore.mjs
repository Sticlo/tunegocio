/**
 * Migra categorías y productos del catálogo estático a Firestore.
 *
 * Uso:
 *   FIREBASE_API_KEY=... FIREBASE_PROJECT_ID=... \
 *   FIREBASE_STORAGE_BUCKET=... FIREBASE_APP_ID=... \
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... \
 *   node scripts/migrate-catalog-to-firestore.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalogPath = join(__dirname, '../src/app/core/constants/products.catalog.ts');
const categoriesPath = join(__dirname, '../src/app/core/constants/categories.ts');

const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} = process.env;

function requireEnv(name, value) {
  if (!value) throw new Error(`Falta variable de entorno: ${name}`);
  return value;
}

function extractCategoryList(source) {
  const match = source.match(/export const CATEGORY_LIST[^=]*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error('No se encontró CATEGORY_LIST');
  const categoryImage = (filename) => `assets/categorias/${filename}`;
  return Function('categoryImage', `"use strict"; return (${match[1]});`)(categoryImage);
}

function extractProductCatalog(source) {
  const match = source.match(/export const PRODUCT_CATALOG[^=]*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error('No se encontró PRODUCT_CATALOG');
  return Function(`"use strict"; return (${match[1]});`)();
}

const app = initializeApp({
  apiKey: requireEnv('FIREBASE_API_KEY', FIREBASE_API_KEY),
  authDomain: requireEnv('FIREBASE_AUTH_DOMAIN', FIREBASE_AUTH_DOMAIN),
  projectId: requireEnv('FIREBASE_PROJECT_ID', FIREBASE_PROJECT_ID),
  storageBucket: requireEnv('FIREBASE_STORAGE_BUCKET', FIREBASE_STORAGE_BUCKET),
  messagingSenderId: requireEnv('FIREBASE_MESSAGING_SENDER_ID', FIREBASE_MESSAGING_SENDER_ID),
  appId: requireEnv('FIREBASE_APP_ID', FIREBASE_APP_ID),
});

const auth = getAuth(app);
const db = getFirestore(app);

await signInWithEmailAndPassword(
  auth,
  requireEnv('ADMIN_EMAIL', ADMIN_EMAIL),
  requireEnv('ADMIN_PASSWORD', ADMIN_PASSWORD),
);

const categories = extractCategoryList(readFileSync(categoriesPath, 'utf8'));
const products = extractProductCatalog(readFileSync(catalogPath, 'utf8'));

for (const [index, category] of categories.entries()) {
  await setDoc(doc(db, 'categories', category.slug), {
    name: category.heading,
    heading: category.heading,
    slug: category.slug,
    description: category.description,
    intro: category.intro,
    imageUrl: category.image.startsWith('http') || category.image.startsWith('/')
      ? category.image
      : `/${category.image}`,
    order: index,
    active: true,
    updatedAt: serverTimestamp(),
  });
  console.log('Categoría:', category.slug);
}

for (const product of products) {
  await setDoc(doc(db, 'products', product.id), {
    name: product.name,
    slug: product.slug,
    categorySlug: product.categorySlug,
    price: product.price,
    shortDescription: product.shortDescription,
    seoTitle: product.name.slice(0, 60),
    metaDescription: product.shortDescription.slice(0, 160),
    imageAlt: `${product.name} en acero inoxidable`.slice(0, 125),
    imageUrl: product.image.startsWith('http') || product.image.startsWith('/')
      ? product.image
      : `/${product.image}`,
    active: true,
    updatedAt: serverTimestamp(),
  });
  console.log('Producto:', product.slug);
}

console.log(`Listo: ${categories.length} categorías y ${products.length} productos.`);
