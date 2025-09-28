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
    <section className="mt-12 border-2 border-gray-700 bg-yellow-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-150">
      <div className="p-5">
        <h3 className="text-lg font-black mb-4 text-slate-900 tracking-wide">
          {title}
        </h3>
        <div className="prose prose-slate max-w-none">
          <p className="font-semibold text-sm leading-relaxed text-slate-700 mb-3">
            {description}
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-700 font-semibold text-sm">
            {benefits.map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
          </ul>
          <p className="font-semibold text-sm leading-relaxed text-slate-700 mt-4">
            {conclusion}
          </p>
        </div>
      </div>
    </section>
  );
}
