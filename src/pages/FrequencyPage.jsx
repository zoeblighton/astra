import PageIntro from '../components/layout/PageIntro.jsx';
import StagePlaceholder from '../components/layout/StagePlaceholder.jsx';

export default function FrequencyPage() {
  return (
    <>
      <PageIntro
        eyebrow="Your Frequency"
        title="What does your universe sound like?"
        lead="Answer a few questions about how you listen and discover the musical identity that shapes your recommendations."
      />
      <StagePlaceholder
        stage={5}
        title="Your Frequency"
        items={[
          'Questions about musical taste (lyrics, rhythm or melody first; calm or elevate; atmosphere; time of day)',
          'Dominant identity plus secondary influences',
          'Breakdown of musical influences',
          'Personalised recommendations',
          'Revisit your results',
        ]}
      />
    </>
  );
}
