// Case registries keep stable asset IDs. Apply the hosting subdirectory only
// when rendering a resource (Sites uses '/', GitHub Pages uses '/<repo>/').
export function assetUrl(source: string, base = import.meta.env.BASE_URL): string {
  if (!source.startsWith('/') || source.startsWith('//')) return source;
  return base.replace(/\/$/, '') + source;
}
