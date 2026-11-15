import './StagePlaceholder.css';

/* Honest "coming next" panel for pages that are scheduled for a later build stage. */
export default function StagePlaceholder({ stage, title, items = [] }) {
  return (
    <section className="stage-placeholder" aria-labelledby={`stage-${stage}-title`}>
      <p className="stage-placeholder__tag">Coming in Stage {stage}</p>
      <h2 id={`stage-${stage}-title`} className="stage-placeholder__title">
        {title}
      </h2>
      <ul className="stage-placeholder__list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
