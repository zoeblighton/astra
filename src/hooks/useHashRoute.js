import { useEffect, useState } from 'react';

/*
 * Minimal hash-based routing: "#/explore" → "explore".
 * Back/forward buttons and shareable links work, with no router dependency
 * and no server configuration needed. Swap for a full router later if the
 * app grows nested or parameterised routes.
 */
function resolveRoute(validIds, fallback) {
  const id = window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  return validIds.includes(id) ? id : fallback;
}

export default function useHashRoute(validIds, fallback) {
  const [route, setRoute] = useState(() => resolveRoute(validIds, fallback));

  useEffect(() => {
    const onChange = () => setRoute(resolveRoute(validIds, fallback));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, [validIds, fallback]);

  return route;
}
