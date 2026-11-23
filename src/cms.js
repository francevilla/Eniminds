// An empty URL disables remote content; configure only an approved WordPress instance.
const endpoint = (import.meta.env.VITE_WORDPRESS_URL || '').replace(/\/$/, '');
export const cmsEnabled = Boolean(endpoint);
export async function getWordPress(collection, params = {}, signal) {
  if (!endpoint) return null;
  const url = new URL(`${endpoint}/wp-json/wp/v2/${collection}`);
  Object.entries(params).forEach(([key,value]) => url.searchParams.set(key, value));
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`WordPress: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Risposta WordPress non valida');
  return data;
}
