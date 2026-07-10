#!/usr/bin/env node
/**
 * Carga variables de .dev.vars y ejecuta el comando indicado.
 * Uso: node scripts/run-with-dev-vars.mjs ng serve
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const devVarsPath = join(root, '.dev.vars');

function loadDevVars() {
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
}

loadDevVars();

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error('Uso: node scripts/run-with-dev-vars.mjs <comando> [args...]');
  process.exit(1);
}

const child = spawn(command, args, {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => process.exit(code ?? 1));
