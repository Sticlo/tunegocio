/**
 * Carga `.dev.vars` en desarrollo local (Node).
 * En edge (Cloudflare) no hay filesystem: las credenciales vienen del entorno.
 */
function loadDevVarsFile(): void {
  if (typeof process === 'undefined' || !process.env) return;

  try {
    const nodeRequire = (0, eval)('require') as NodeRequire;
    const { existsSync, readFileSync } = nodeRequire('node:fs');
    const { join } = nodeRequire('node:path');

    const devVarsPath = join(process.cwd(), '.dev.vars');
    if (!existsSync(devVarsPath)) return;

    for (const line of readFileSync(devVarsPath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const separator = trimmed.indexOf('=');
      if (separator === -1) continue;

      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // Edge / entorno sin `require`.
  }

  if (
    process.env['NODE_ENV'] !== 'production' &&
    !process.env['WOMPI_PUBLIC_KEY']?.trim() &&
    !process.env['ADDI_CLIENT_ID']?.trim()
  ) {
    console.warn(
      '[tunegocio] Pagos sin credenciales. Usa npm start (carga .dev.vars), no ng serve directo.',
    );
  }
}

loadDevVarsFile();
