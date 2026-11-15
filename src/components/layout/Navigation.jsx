import Icon from '../ui/Icon.jsx';
import { NAV_ROUTES, routeHref } from '../../routes.js';
import './Navigation.css';

/*
 * Main navigation (design/ui-components.png).
 * One component, three layouts — all handled in CSS:
 *   mobile  (<768)   full-width bottom bar, icon above label, terracotta pill
 *   tablet  (768+)   floating bottom bar, centred
 *   desktop (1200+)  inline in the header
 */
export default function Navigation({ currentRoute }) {
  return (
    <nav className="nav" aria-label="Main">
      <ul role="list" className="nav__list">
        {NAV_ROUTES.map((route) => {
          const isActive = route.id === currentRoute;
          return (
            <li key={route.id}>
              <a
                href={routeHref(route.id)}
                className="nav__link"
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="nav__icon">
                  <Icon name={route.icon} size={20} />
                </span>
                <span className="nav__label">{route.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
