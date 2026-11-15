import './CosmicBackground.css';

/*
 * Fixed atmospheric layer that sits behind every page.
 * Recreates the orbs, dust and glow from the Figma frames in design/.
 * Purely decorative, so it's hidden from assistive technology.
 */

// Faint copper "dust" positions (% of viewport), matched to the Figma frames.
const DUST = [
  { top: 6, left: 63, size: 22 },
  { top: 17, left: 74, size: 20 },
  { top: 17, left: 81, size: 20 },
  { top: 25, left: 70, size: 20 },
  { top: 27, left: 89, size: 22 },
  { top: 52, left: 8, size: 14 },
];

export default function CosmicBackground() {
  return (
    <div className="cosmic-bg" aria-hidden="true">
      <div className="cosmic-bg__glow cosmic-bg__glow--bottom" />
      <div className="cosmic-bg__glow cosmic-bg__glow--top" />

      <div className="cosmic-bg__orb cosmic-bg__orb--primary" />
      <div className="cosmic-bg__orb cosmic-bg__orb--copper" />
      <div className="cosmic-bg__orb cosmic-bg__orb--edge" />
      <div className="cosmic-bg__orb cosmic-bg__orb--ring" />

      {DUST.map((d, i) => (
        <span
          key={i}
          className="cosmic-bg__dust"
          style={{
            top: `${d.top}%`,
            left: `${d.left}%`,
            '--dust-size': `${d.size}px`,
            '--dust-delay': `${i * -3}s`,
          }}
        />
      ))}

      <div className="cosmic-bg__grain" />
    </div>
  );
}
