#!/usr/bin/env node
/**
 * Empaqueta dist/ para subir a Hostinger (Node.js).
 * Genera: deploy/hostinger/ y deploy/tunegocio-hostinger.zip
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const distApp = join(root, 'dist', 'tunegocio-web');
const outDir = join(root, 'deploy', 'hostinger');
const zipPath = join(root, 'deploy', 'tunegocio-hostinger.zip');

if (!existsSync(join(distApp, 'server', 'server.mjs'))) {
  console.error('No hay build. Ejecuta primero: npm run build');
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

cpSync(join(distApp, 'browser'), join(outDir, 'browser'), { recursive: true });
cpSync(join(distApp, 'server'), join(outDir, 'server'), { recursive: true });

// Hostinger Express busca `server.js` en la raíz y debe dejar el proceso escuchando.
writeFileSync(
  join(outDir, 'server.js'),
  `/** Entry Hostinger — arranca el SSR Angular. */
import { startTunegocioServer } from './server/server.mjs';
startTunegocioServer();
`,
);

const pkg = {
  name: 'tunegocio-web',
  version: '1.0.0',
  private: true,
  type: 'module',
  engines: { node: '>=20' },
  main: 'server.js',
  scripts: {
    // Hostinger ejecuta `npm run build` por defecto; el ZIP ya viene compilado.
    build: "node -e \"console.log('prebuilt — skip')\"",
    start: 'node server.js',
  },
  dependencies: {
    express: '^5.1.0',
  },
};

writeFileSync(join(outDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');

const envExample = `# Variables en el panel de Hostinger (Node.js → Environment)
# NO subas secretos al ZIP.

WOMPI_PUBLIC_KEY=pub_prod_...
WOMPI_INTEGRITY_SECRET=prod_integrity_...
WOMPI_EVENTS_SECRET=prod_events_...
SITE_URL=https://tunegocio.com.co

ADDI_CLIENT_ID=...
ADDI_CLIENT_SECRET=...
ADDI_SANDBOX=false
ADDI_ALLY_SLUG=esiesas-ecommerce

PORT=4000
NODE_ENV=production
`;

writeFileSync(join(outDir, '.env.example'), envExample);

const readme = `# Deploy Hostinger — TUNEGOCIO

## Contenido
- \`browser/\` — frontend estático
- \`server/\` — SSR + API de pagos (\`/api/payments/*\`)
- \`package.json\` — \`npm start\` → \`node server/server.mjs\`

## Pasos en Hostinger (Node.js)

1. Crea/abre una app **Node.js** apuntando al dominio \`tunegocio.com.co\`.
2. Sube el contenido de esta carpeta (o el ZIP) a la raíz de la app.
3. En el panel, configura:
   - **Node version:** 20 o 22
   - **Application root:** carpeta donde está este \`package.json\`
   - **Application startup file / start:** \`npm start\` o \`node server/server.mjs\`
4. Agrega las variables de entorno (copia desde \`.env.example\` con valores reales de producción).
5. Instala dependencias si el panel lo pide: \`npm install --omit=dev\`
6. Reinicia la app.

## Webhooks (después de que el dominio responda)

- Wompi: \`https://tunegocio.com.co/api/payments/wompi/webhook\`
- Addi: \`https://tunegocio.com.co/api/payments/addi/callback\`

## Prueba rápida

\`\`\`
curl https://tunegocio.com.co/api/payments/status
\`\`\`

Debe devolver \`{"wompi":true,"addi":true,...}\`.
`;

writeFileSync(join(outDir, 'README-HOSTINGER.md'), readme);

rmSync(zipPath, { force: true });
const zip = spawnSync('zip', ['-r', zipPath, '.'], { cwd: outDir, stdio: 'inherit' });
if (zip.status !== 0) {
  console.warn('No se pudo crear el ZIP (¿falta zip?). La carpeta deploy/hostinger/ sí está lista.');
} else {
  console.log(`ZIP: ${zipPath}`);
}

console.log(`Carpeta lista: ${outDir}`);
console.log('Sube deploy/hostinger/ o deploy/tunegocio-hostinger.zip a Hostinger Node.js.');
