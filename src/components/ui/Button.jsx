import Icon from './Icon.jsx';
import './Button.css';

/*
 * Button — primary (copper, dark text), secondary (transparent, lilac border)
 * or ghost. Renders an <a> when given `href`, otherwise a <button>, so links
 * and actions stay semantically correct.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'start',
  href,
  className = '',
  children,
  ...rest
}) {
  const classes = ['btn', `btn--${variant}`, `btn--${size}`, className].filter(Boolean).join(' ');
  const iconEl = icon ? <Icon name={icon} size={size === 'sm' ? 16 : 18} /> : null;

  const content = (
    <>
      {iconPosition === 'start' && iconEl}
      <span>{children}</span>
      {iconPosition === 'end' && iconEl}
    </>
  );

  if (href) {
    return (
      <a className={classes} href={href} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {content}
    </button>
  );
}

/* Round icon-only button. `label` is required: it's the accessible name. */
export function IconButton({ icon, label, variant = 'ghost', size = 'md', className = '', ...rest }) {
  return (
    <button
      type="button"
      className={`icon-btn icon-btn--${variant} icon-btn--${size} ${className}`}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon name={icon} size={size === 'lg' ? 22 : 20} />
    </button>
  );
}
