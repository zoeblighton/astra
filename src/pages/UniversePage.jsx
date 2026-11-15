import PageIntro from '../components/layout/PageIntro.jsx';
import StagePlaceholder from '../components/layout/StagePlaceholder.jsx';

export default function UniversePage() {
  return (
    <>
      <PageIntro
        eyebrow="My Universe"
        title="Everything in your orbit."
        lead="The tracks, artists and discoveries you've gathered along the way."
      />
      <StagePlaceholder
        stage={7}
        title="My Universe"
        items={['Saved tracks', 'Favourite artists', 'Playlists', 'Saved discoveries', 'Your musical identity']}
      />
    </>
  );
}
