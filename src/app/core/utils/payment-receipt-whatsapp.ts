import { WHATSAPP_NUMBER } from '../constants/navigation';

/** WhatsApp para enviar comprobante tras un pago en línea. */
export function paymentReceiptWhatsappUrl(reference?: string | null): string {
  const lines = [
    'Hola, acabo de realizar un pago en TUNEGOCIO.COM.',
    'Adjunto el comprobante de pago para validar mi pedido.',
  ];

  const ref = reference?.trim();
  if (ref) {
    lines.push(`Referencia: ${ref}`);
  }

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}
