interface InfoCard {
  title: string;
  description: string;
}

interface InfoCardsProps {
  cards: InfoCard[];
}

export default function InfoCard({ cards }: InfoCardsProps) {
  return (
    <section className="mb-12 grid md:grid-cols-2 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`border-2 border-gray-700 p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 ${
            index === 0
              ? "bg-blue-50"
              : "bg-green-50"
          }`}
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
