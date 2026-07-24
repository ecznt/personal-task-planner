import { foundationMessages } from '@/i18n/messages/tr';

export default function HomePage() {
  return (
    <main>
      <section className="foundation-card" aria-labelledby="foundation-title">
        <p>{foundationMessages.eyebrow}</p>
        <h1 id="foundation-title">{foundationMessages.title}</h1>
        <p>{foundationMessages.description}</p>
      </section>
    </main>
  );
}
