import type { PaymentServerEnv } from './types';

let activeEnv: PaymentServerEnv = {};

export function setPaymentServerEnv(env: PaymentServerEnv): void {
  activeEnv = env;
}

export function getPaymentServerEnv(): PaymentServerEnv {
  const fromProcess =
    typeof process !== 'undefined' && process.env
      ? {
          WOMPI_PUBLIC_KEY: process.env['WOMPI_PUBLIC_KEY'],
          WOMPI_INTEGRITY_SECRET: process.env['WOMPI_INTEGRITY_SECRET'],
          WOMPI_EVENTS_SECRET: process.env['WOMPI_EVENTS_SECRET'],
          ADDI_CLIENT_ID: process.env['ADDI_CLIENT_ID'],
          ADDI_CLIENT_SECRET: process.env['ADDI_CLIENT_SECRET'],
          ADDI_SANDBOX: process.env['ADDI_SANDBOX'],
          ADDI_ALLY_SLUG: process.env['ADDI_ALLY_SLUG'],
          SITE_URL: process.env['SITE_URL'],
        }
      : {};

  return {
    ...fromProcess,
    ...activeEnv,
  };
}

export function siteOrigin(request: Request, env: PaymentServerEnv): string {
  if (env.SITE_URL?.trim()) return env.SITE_URL.replace(/\/+$/, '');
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}
