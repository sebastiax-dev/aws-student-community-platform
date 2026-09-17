import { ExternalLink, MessageSquareText } from "lucide-react";

type RecommendationsCtaProperties = Readonly<{
  formUrl: string;
}>;

export function RecommendationsCta({ formUrl }: RecommendationsCtaProperties): React.ReactNode {
  if (formUrl.length === 0) {
    return null;
  }

  return <section aria-labelledby="recommendations-title" className="recommendations-cta surface">
    <span aria-hidden="true" className="recommendations-cta__icon"><MessageSquareText size={26} /></span>
    <div><p className="eyebrow">TU OPINIÓN IMPULSA LA COMUNIDAD</p><h2 id="recommendations-title">Ayúdanos a mejorar la web</h2><p>Comparte tus recomendaciones y cuéntanos qué te gustaría encontrar en la plataforma.</p></div>
    <a className="button button--secondary" href={formUrl} rel="noreferrer" target="_blank">Recomendaciones <ExternalLink size={16} /></a>
  </section>;
}
