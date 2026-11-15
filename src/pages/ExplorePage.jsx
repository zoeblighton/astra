import PageIntro from '../components/layout/PageIntro.jsx';
import StagePlaceholder from '../components/layout/StagePlaceholder.jsx';

export default function ExplorePage() {
  return (
    <>
      <PageIntro
        eyebrow="Explore"
        title="Wander by mood, genre and atmosphere."
        lead="Follow a feeling, a scene or an artist, and see where the connections lead."
      />
      <StagePlaceholder
        stage={4}
        title="Explore page"
        items={[
          'Browse by mood',
          'Browse by genre',
          'Browse by atmosphere',
          'Artists and related musical styles',
        ]}
      />
    </>
  );
}
