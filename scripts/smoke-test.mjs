#!/usr/bin/env node
/**
 * Verificación rápida pre-deploy (sin navegador ni Firebase en vivo).
 * Ejecutar: npm run test:smoke
 * Tras build: npm run verify
 */
import { access, readFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const results = [];

function pass(name, detail = '') {
  results.push({ ok: true, name, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  results.push({ ok: false, name, detail });
  console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// ── Lógica crítica (espejo de src/app/core/utils) ─────────────────
function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function catalogSlugFromName(name) {
  return slugify(name.replace(/\s+/g, ' ').trim());
}

function assert(condition, name, detail) {
  if (condition) pass(name, detail);
  else fail(name, detail);
}

async function testCatalogLogic() {
  console.log('\n📦 Lógica de catálogo y rutas');
  assert(catalogSlugFromName('Asadero de pollos') === 'asadero-de-pollos', 'Nombre con espacios → slug con guiones');
  assert(catalogSlugFromName('  Hornos   industriales  ') === 'hornos-industriales', 'Normaliza espacios extra');
  assert(slugify('categoriaprueba') === 'categoriaprueba', 'Palabra pegada conserva slug');
  assert(slugify('Horno 4 cámaras') === 'horno-4-camaras', 'Quita acentos y usa guiones');
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test('asadero-de-pollos'), 'Formato de slug válido para SEO');
}

async function testProjectFiles() {
  console.log('\n📁 Archivos del proyecto');
  const required = [
    'src/environments/environment.ts',
    'firebase/firestore.rules',
    'firebase/storage.rules',
    'public/.htaccess',
    'src/app/admin/admin.routes.ts',
    'src/app/core/services/catalog-firestore.service.ts',
    'src/app/core/utils/admin-form-validators.ts',
  ];

  for (const file of required) {
    const exists = await fileExists(join(root, file));
    assert(exists, `Existe ${file}`);
  }
}

async function testEnvironment() {
  console.log('\n🔥 Configuración Firebase');
  const env = await readFile(join(root, 'src/environments/environment.ts'), 'utf8');
  const keys = ['enabled: true', 'projectId:', 'storageBucket:', 'apiKey:', 'authDomain:'];
  for (const key of keys) {
    assert(env.includes(key), `environment.ts incluye ${key.replace(':', '')}`);
  }
  assert(env.includes('firebasestorage.app'), 'Bucket Storage correcto (.firebasestorage.app)');
}

async function testFirebaseRules() {
  console.log('\n🔒 Reglas Firebase');
  const firestore = await readFile(join(root, 'firebase/firestore.rules'), 'utf8');
  const storage = await readFile(join(root, 'firebase/storage.rules'), 'utf8');

  assert(firestore.includes('allow read: if true'), 'Firestore: lectura pública');
  assert(firestore.includes('allow write: if isSignedIn()'), 'Firestore: escritura autenticada');
  assert(firestore.includes('match /categories/'), 'Firestore: colección categories');
  assert(firestore.includes('match /products/'), 'Firestore: colección products');

  assert(storage.includes('allow read: if true'), 'Storage: lectura pública');
  assert(storage.includes('allow write: if request.auth != null'), 'Storage: escritura autenticada');
}

async function testBuildOutput() {
  console.log('\n🏗️  Build de producción');
  const browserDir = join(root, 'dist/tunegocio-web/browser');

  if (!(await fileExists(browserDir))) {
    fail('dist/tunegocio-web/browser existe', 'Ejecuta npm run build primero');
    return;
  }

  pass('dist/tunegocio-web/browser existe');

  const htaccess = await fileExists(join(browserDir, '.htaccess'));
  assert(htaccess, '.htaccess copiado al build');

  const index = await fileExists(join(browserDir, 'index.html'));
  assert(index, 'index.html generado');

  const files = await readdir(browserDir);
  const hasMain = files.some((f) => f.startsWith('main-') && f.endsWith('.js'));
  assert(hasMain, 'Bundle main-*.js presente');

  const chunkFiles = files.filter((f) => f.startsWith('chunk-') && f.endsWith('.js'));
  assert(chunkFiles.length >= 5, `Chunks lazy generados (${chunkFiles.length})`);
}

async function testSeoLimits() {
  console.log('\n📈 Límites SEO');
  const seo = await readFile(join(root, 'src/app/core/constants/seo-limits.ts'), 'utf8');
  assert(seo.includes('metaDescription: { min: 120'), 'Meta descripción min 120');
  assert(seo.includes('title: { min: 30'), 'Título SEO min 30');
  assert(seo.includes('shortDescription: { min: 80'), 'Descripción producto min 80');
}

async function main() {
  console.log('TUNEGOCIO — smoke test pre-producción\n');

  await testCatalogLogic();
  await testProjectFiles();
  await testEnvironment();
  await testFirebaseRules();
  await testSeoLimits();
  await testBuildOutput();

  const failed = results.filter((r) => !r.ok);
  console.log('\n' + '─'.repeat(48));
  if (failed.length === 0) {
    console.log(`✅ ${results.length} verificaciones pasaron`);
    console.log('\nPendiente manual (no automatizable aquí):');
    console.log('  • Login admin en tunegocio.com.co/admin');
    console.log('  • Subir foto en producción');
    console.log('  • Probar en móvil y Chrome (no Brave con escudo)');
    process.exit(0);
  }

  console.log(`❌ ${failed.length} de ${results.length} verificaciones fallaron`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
