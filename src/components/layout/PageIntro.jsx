import './PageIntro.css';

/*
 * Standard page heading block. The h1 has id="page-title" and tabIndex=-1
 * so AppShell can move focus to it on navigation.
 */
export default function PageIntro({ eyebrow, title, lead, children }) {
  return (
    <header className="page-intro">
      {eyebrow && <p className="page-intro__eyebrow">{eyebrow}</p>}
      <h1 id="page-title" tabIndex={-1} className="page-intro__title">
        {title}
      </h1>
      {lead && <p className="page-intro__lead">{lead}</p>}
      {children && <div className="page-intro__actions">{children}</div>}
    </header>
  );
}
