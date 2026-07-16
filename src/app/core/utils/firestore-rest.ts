/** Firestore REST helpers for SSR / Node (no browser Firebase SDK). */

const DEFAULT_PROJECT_ID = 'tunegocio-4de17';

export function unwrapFirestoreValue(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const v = value as Record<string, unknown>;
  if ('stringValue' in v) return String(v['stringValue'] ?? '');
  if ('integerValue' in v) return Number.parseInt(String(v['integerValue']), 10);
  if ('doubleValue' in v) return Number(v['doubleValue']);
  if ('booleanValue' in v) return Boolean(v['booleanValue']);
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return String(v['timestampValue'] ?? '');
  if ('arrayValue' in v) {
    const values = (v['arrayValue'] as { values?: unknown[] } | undefined)?.values ?? [];
    return values.map(unwrapFirestoreValue);
  }
  if ('mapValue' in v) {
    const fields =
      (v['mapValue'] as { fields?: Record<string, unknown> } | undefined)?.fields ?? {};
    return unwrapFirestoreFields(fields);
  }
  return value;
}

export function unwrapFirestoreFields(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = unwrapFirestoreValue(value);
  }
  return out;
}

export interface FirestoreRestDocument {
  id: string;
  data: Record<string, unknown>;
}

/**
 * Lists all documents in a top-level collection via the public Firestore REST API.
 * Requires collection rules that allow unauthenticated reads (same as client catalog).
 */
export async function listFirestoreCollectionRest(
  collectionId: string,
  projectId = DEFAULT_PROJECT_ID,
): Promise<FirestoreRestDocument[]> {
  const documents: FirestoreRestDocument[] = [];
  let pageToken = '';

  do {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionId}`,
    );
    url.searchParams.set('pageSize', '300');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Firestore REST ${collectionId}: HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      documents?: Array<{ name: string; fields?: Record<string, unknown> }>;
      nextPageToken?: string;
    };

    for (const doc of payload.documents ?? []) {
      const id = doc.name.split('/').pop() ?? '';
      if (!id) continue;
      documents.push({
        id,
        data: unwrapFirestoreFields(doc.fields ?? {}),
      });
    }

    pageToken = payload.nextPageToken ?? '';
  } while (pageToken);

  return documents;
}
