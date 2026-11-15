import './Avatar.css';

/* Round lilac initial badge (design/ui-components.png). Decorative: the name is always shown beside it. */
export default function Avatar({ name = '', size = 'md', className = '' }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span className={`avatar avatar--${size} ${className}`} aria-hidden="true">
      {initial}
    </span>
  );
}
