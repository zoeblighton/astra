import { useState } from 'react';
import PageIntro from '../components/layout/PageIntro.jsx';
import Button, { IconButton } from '../components/ui/Button.jsx';
import SearchBar from '../components/ui/SearchBar.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Artwork from '../components/ui/Artwork.jsx';
import MusicCard from '../components/cards/MusicCard.jsx';
import ArtistCard from '../components/cards/ArtistCard.jsx';
// The kit is a dev/portfolio reference page, so it reads sample data directly.
import { artists, tracksWithArtists } from '../data/sampleData.js';
import './KitPage.css';

/*
 * UI kit: a living reference for the ASTRA design system.
 * Every component rendered with sample data. Not linked in the main nav;
 * reach it via the footer or #/kit.
 */

const PALETTE = [
  { name: 'Cosmic Charcoal', token: '--cosmic-charcoal', hex: '#19191F' },
  { name: 'Deep Graphite', token: '--deep-graphite', hex: '#292730' },
  { name: 'Smoky Plum', token: '--smoky-plum', hex: '#403647' },
  { name: 'Nebula Violet', token: '--nebula-violet', hex: '#695879' },
  { name: 'Atmospheric Lilac', token: '--atmospheric-lilac', hex: '#A493B5' },
  { name: 'Burnt Copper', token: '--burnt-copper', hex: '#9A664B' },
  { name: 'Clay Copper', token: '--clay-copper', hex: '#BF8062' },
  { name: 'Dusty Terracotta', token: '--dusty-terracotta', hex: '#E2AC91' },
  { name: 'Starlight Ivory', token: '--starlight-ivory', hex: '#E7E0D5' },
  { name: 'Ash Grey', token: '--ash-grey', hex: '#A9A5AC' },
];

const TYPE_SCALE = [
  { label: 'Display · 48', className: 'text-display', sample: 'Every sound opens a new universe.' },
  { label: 'H1 · 32', as: 'h3', className: 'kit-h1', sample: 'Discover something different' },
  { label: 'H2 · 24', as: 'h3', className: 'kit-h2', sample: 'Curated collections' },
  { label: 'H3 · 18', as: 'h3', sample: 'Recommended artists' },
  { label: 'Body · 14', sample: 'Explore new artists, unexpected genres and sounds that will take you somewhere different.' },
  { label: 'Small · 12', className: 'text-small text-secondary', sample: 'Updated weekly from your listening' },
  { label: 'Metadata · 11', className: 'text-meta', sample: 'Now playing / Track 001' },
];

function KitSection({ id, title, note, children }) {
  return (
    <section className="kit-section" aria-labelledby={id}>
      <div className="kit-section__head">
        <h2 id={id} className="section-title">{title}</h2>
        {note && <p className="text-small text-secondary">{note}</p>}
      </div>
      {children}
    </section>
  );
}

export default function KitPage() {
  const [lastAction, setLastAction] = useState('Nothing selected yet');
  const report = (label) => (item) => setLastAction(`${label}: ${item.title ?? item.name}`);

  return (
    <>
      <PageIntro
        eyebrow="Design system · 04 UI components"
        title="Interface elements"
        lead="A collection of reusable components for the ASTRA experience."
      />

      <p className="kit-status text-meta" role="status" aria-live="polite">
        Last interaction — {lastAction}
      </p>

      <div className="kit">
        <KitSection id="kit-buttons" title="Buttons">
          <div className="kit-row">
            <Button variant="primary" size="lg">Explore music</Button>
            <Button variant="secondary" size="lg">Learn more</Button>
          </div>
          <div className="kit-row">
            <Button variant="primary" icon="arrowRight" iconPosition="end">Start exploring</Button>
            <Button variant="secondary" icon="plus">Save</Button>
            <Button variant="ghost">Skip</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
          <div className="kit-row">
            <Button variant="primary" size="sm">Small primary</Button>
            <Button variant="secondary" size="sm">Small secondary</Button>
            <IconButton icon="play" variant="primary" label="Play" />
            <IconButton icon="plus" label="Add" />
            <IconButton icon="close" label="Close" />
          </div>
        </KitSection>

        <KitSection id="kit-search" title="Search bar" note="Try “dream”, “soul” or “berlin”. Arrow keys, Enter and Escape work.">
          <div className="kit-search">
            <SearchBar onSelect={report('Search')} />
          </div>
        </KitSection>

        <KitSection id="kit-music" title="Music card">
          <div className="kit-grid kit-grid--rows">
            {tracksWithArtists.slice(0, 2).map((t) => (
              <MusicCard key={t.id} track={t} onSelect={report('Track')} />
            ))}
          </div>
          <div className="kit-grid kit-grid--tiles">
            {tracksWithArtists.slice(2, 7).map((t) => (
              <MusicCard key={t.id} track={t} layout="tile" onSelect={report('Track')} onPlay={report('Play')} />
            ))}
          </div>
        </KitSection>

        <KitSection id="kit-artists" title="Artist card">
          <div className="kit-grid kit-grid--artists">
            {artists.slice(0, 4).map((a, i) => (
              <ArtistCard key={a.id} artist={a} onSelect={report('Artist')} defaultFollowing={i === 1} />
            ))}
          </div>
        </KitSection>

        <KitSection
          id="kit-artwork"
          title="Artwork & avatars"
          note="Generative placeholder artwork from each item's id, built only from brand colours."
        >
          <div className="kit-artwork">
            {tracksWithArtists.slice(0, 8).map((t) => (
              <Artwork key={t.id} seed={t.id} label={`Placeholder artwork for ${t.title}`} />
            ))}
          </div>
          <div className="kit-row">
            <Avatar name="Astra" size="sm" />
            <Avatar name="Bloom" size="md" />
            <Avatar name="Cosmos" size="lg" />
          </div>
        </KitSection>

        <KitSection id="kit-navigation" title="Navigation" note="Live in the app: bottom bar on mobile, floating bar on tablet, header on desktop. Resize the window to see it adapt." />

        <KitSection id="kit-palette" title="Colour palette">
          <ul role="list" className="swatches">
            {PALETTE.map((c) => (
              <li key={c.token} className="swatch">
                <span className="swatch__chip" style={{ background: `var(${c.token})` }} />
                <span className="swatch__name">{c.name}</span>
                <span className="swatch__hex">{c.hex}</span>
              </li>
            ))}
          </ul>
        </KitSection>

        <KitSection id="kit-type" title="Typography">
          <div className="kit-grid kit-grid--three">
            <div className="surface font-card">
              <p className="eyebrow">01 / Display Font</p>
              <p className="font-card__sample font-card__sample--display">Space Grotesk</p>
              <p className="text-small text-secondary">Brand name, headings, feature titles</p>
            </div>
            <div className="surface font-card">
              <p className="eyebrow">02 / Interface Font</p>
              <p className="font-card__sample font-card__sample--body">Inter</p>
              <p className="text-small text-secondary">Body, buttons, navigation, labels</p>
            </div>
            <div className="surface font-card">
              <p className="eyebrow">03 / Metadata Font</p>
              <p className="font-card__sample font-card__sample--mono">DM Mono</p>
              <p className="text-small text-secondary">Track info, metadata, technical labels</p>
            </div>
          </div>
          <div className="surface surface--feature type-scale">
            {TYPE_SCALE.map(({ label, as: Tag = 'p', className, sample }) => (
              <div key={label} className="type-scale__row">
                <span className="text-meta type-scale__label">{label}</span>
                <Tag className={className}>{sample}</Tag>
              </div>
            ))}
          </div>
        </KitSection>

        <KitSection id="kit-surfaces" title="Surfaces">
          <div className="kit-grid kit-grid--three">
            <div className="surface surface-demo">
              <span className="text-meta">Card · 18px</span>
              <p>Deep Graphite surface with a soft ivory border.</p>
            </div>
            <div className="surface surface--raised surface-demo">
              <span className="text-meta">Raised · 18px</span>
              <p>Smoky Plum for highlighted content.</p>
            </div>
            <div className="surface surface--glass surface--feature surface-demo">
              <span className="text-meta text-meta--warm">Glass feature · 22px</span>
              <p>Restrained glass: translucent graphite with a soft blur.</p>
            </div>
          </div>
        </KitSection>
      </div>
    </>
  );
}
