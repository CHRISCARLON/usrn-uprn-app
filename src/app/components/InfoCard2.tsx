interface InfoCard2Props {
  title: string;
  description: string;
  benefits: string[];
  conclusion: string;
}

export default function InfoCard2({
  title,
  description,
  benefits,
  conclusion,
}: InfoCard2Props) {
  return (
    <section className="mt-16 border-2 border-slate-200 bg-slate-100 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-sm">
      <div className="p-8">
        <h3 className="text-2xl font-black mb-6 text-slate-900 tracking-wide">
          {title}
        </h3>
        <div className="prose prose-slate max-w-none">
          <p className="font-semibold text-lg leading-relaxed text-slate-700 mb-4">
            {description}
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 font-semibold">
            {benefits.map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
          </ul>
          <p className="font-semibold text-lg leading-relaxed text-slate-700 mt-6">
            {conclusion}
          </p>
        </div>
      </div>
    </section>
  );
}
