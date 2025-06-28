interface InfoCard {
  title: string;
  description: string;
}

interface InfoCardsProps {
  cards: InfoCard[];
}

export default function InfoCards({ cards }: InfoCardsProps) {
  return (
    <section className="mb-12 grid md:grid-cols-2 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="border-2 border-slate-200 p-5 bg-slate-100 shadow-lg hover:shadow-xl transition-shadow duration-300"
        >
          <h2 className="text-lg font-black mb-3 text-slate-900 tracking-wide">
            {card.title}
          </h2>
          <p className="font-semibold text-slate-700 text-sm leading-relaxed">
            {card.description}
          </p>
        </div>
      ))}
    </section>
  );
}
