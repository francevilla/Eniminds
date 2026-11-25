// Preserve the path selected by Vercel's rewrite; reject ambiguous or unsafe paths.
export function rewrittenUrl(input) {
  const url = new URL(input, 'http://internal');
  const paths = url.searchParams.getAll('__cms_path');
  const path = paths[0];
  if (paths.length !== 1 || !path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\') || /[\r\n?#]/.test(path)) return null;
  url.searchParams.delete('__cms_path');
  return path + url.search;
}
