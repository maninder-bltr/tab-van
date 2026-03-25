export function getContextKey(url, granularity = 'section') {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const pathSegments = parsed.pathname.split('/').filter(Boolean);

    switch (granularity) {
      case 'domain':
        // All pages on same domain share notes
        return hostname;

      case 'section':
        // Domain + first path segment (recommended)
        if (pathSegments.length > 0) {
          if (hostname.includes('github.com') || hostname.includes('gitlab.com')) {
            return `${hostname}/${pathSegments[0]}`;
          }
          return hostname;
        }
        return hostname;

      case 'page':
        // Domain + first 2 path segments (more specific)
        if (pathSegments.length >= 2) {
          return `${hostname}/${pathSegments[0]}/${pathSegments[1]}`;
        } else if (pathSegments.length === 1) {
          return `${hostname}/${pathSegments[0]}`;
        }
        return hostname;

      default:
        return hostname;
    }
  } catch (e) {
    console.warn('Failed to parse URL:', url, e);
    return null;
  }
}
