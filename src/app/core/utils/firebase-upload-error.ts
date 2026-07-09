const MAX_IMAGE_MB = 8;

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'El archivo debe ser una imagen (JPG, PNG o WEBP).';
  }

  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > MAX_IMAGE_MB) {
    return `La imagen pesa ${sizeMb.toFixed(1)} MB. El máximo permitido es ${MAX_IMAGE_MB} MB. Comprímela e intenta de nuevo.`;
  }

  return null;
}

export function formatFirebaseUploadError(err: unknown): string {
  const code = String((err as { code?: string })?.code ?? '').toLowerCase();
  const message = String((err as { message?: string })?.message ?? err).toLowerCase();

  if (code === 'storage/unauthorized' || message.includes('permission') || message.includes('unauthorized')) {
    return 'No tienes permiso para subir fotos. Cierra sesión y vuelve a entrar al panel admin.';
  }

  if (code === 'storage/canceled') {
    return 'La subida de la foto fue cancelada.';
  }

  if (code === 'storage/quota-exceeded') {
    return 'Se llenó el espacio de almacenamiento en Firebase.';
  }

  if (
    code === 'storage/object-not-found' ||
    code === 'storage/bucket-not-found' ||
    message.includes('404') ||
    message.includes('not found') ||
    message.includes('cors') ||
    message.includes('preflight')
  ) {
    return (
      'Firebase Storage no está activo todavía. Ve a Firebase Console → Storage → Comenzar, ' +
      'crea el bucket (región southamerica-east1) y publica las reglas de firebase/storage.rules.'
    );
  }

  if (message.includes('network') || message.includes('failed')) {
    return 'No hay conexión con Firebase. Revisa tu internet o desactiva el bloqueador de anuncios (Brave puede bloquear Firebase).';
  }

  return 'No se pudo subir la foto. Intenta con una imagen JPG o PNG de menos de 8 MB.';
}
