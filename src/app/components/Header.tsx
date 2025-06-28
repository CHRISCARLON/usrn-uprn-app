interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="border-b-2 border-slate-300 bg-white shadow-sm">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-xl md:text-3xl font-black tracking-tight mb-6 text-slate-900">
          <span className="text-slate-800 px-1">{title}</span>
        </h1>
        <p className="text-lg font-semibold max-w-3xl text-slate-700 leading-relaxed">
          {subtitle}
        </p>
      </div>
    </header>
  );
}
