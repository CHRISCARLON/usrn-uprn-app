interface InfoCard {
  title: string;
  description: string;
}

interface InfoCardsProps {
  cards: InfoCard[];
}

export default function InfoCards({ cards }: InfoCardsProps) {
  return (
    <section className="mb-16 grid md:grid-cols-2 gap-8">
      {cards.map((card, index) => (
        <div
          key={index}
          className="border-2 border-slate-200 p-8 bg-slate-100 shadow-lg hover:shadow-xl transition-shadow duration-300"
        >
          <h2 className="text-2xl font-black mb-4 text-slate-900 tracking-wide">
            {card.title}
          </h2>
          <p className="font-semibold text-slate-700 text-lg leading-relaxed">
            {card.description}
          </p>
        </div>
      ))}
    </section>
  );
}
