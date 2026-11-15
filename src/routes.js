import DiscoverPage from './pages/DiscoverPage.jsx';
import ExplorePage from './pages/ExplorePage.jsx';
import FrequencyPage from './pages/FrequencyPage.jsx';
import UniversePage from './pages/UniversePage.jsx';
import KitPage from './pages/KitPage.jsx';

/*
 * Route table: one place to add, rename or reorder pages.
 * `inNav` controls whether a route appears in the main navigation.
 */
export const ROUTES = [
  { id: 'discover', label: 'Discover', title: 'Discover', icon: 'discover', component: DiscoverPage, inNav: true },
  { id: 'explore', label: 'Explore', title: 'Explore', icon: 'explore', component: ExplorePage, inNav: true },
  { id: 'frequency', label: 'Frequency', title: 'Your Frequency', icon: 'frequency', component: FrequencyPage, inNav: true },
  { id: 'universe', label: 'My Universe', title: 'My Universe', icon: 'universe', component: UniversePage, inNav: true },
  { id: 'kit', label: 'UI kit', title: 'UI kit', component: KitPage, inNav: false },
];

export const ROUTE_IDS = ROUTES.map((r) => r.id); // stable reference for useHashRoute
export const NAV_ROUTES = ROUTES.filter((r) => r.inNav);

export { DEFAULT_ROUTE, routeHref } from './paths.js';
