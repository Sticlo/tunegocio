const loadedScripts = new Map<string, Promise<void>>();

export function loadExternalScript(src: string): Promise<void> {
  const existing = loadedScripts.get(src);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    if (typeof document === 'undefined') {
      resolve();
      return;
    }

    const current = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (current) {
      if (current.dataset['loaded'] === 'true') {
        resolve();
        return;
      }
      current.addEventListener('load', () => resolve(), { once: true });
      current.addEventListener('error', () => reject(new Error(`No se pudo cargar ${src}`)), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.addEventListener(
      'load',
      () => {
        script.dataset['loaded'] = 'true';
        resolve();
      },
      { once: true },
    );
    script.addEventListener('error', () => reject(new Error(`No se pudo cargar ${src}`)), {
      once: true,
    });
    document.head.appendChild(script);
  });

  loadedScripts.set(src, promise);
  return promise;
}
