interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <>
      <style>
        {`
          .animated-title {
            color: #1f2937;
            position: relative;
            display: inline-block;
          }

          .animated-title::after {
            content: '';
            position: absolute;
            width: 0;
            height: 3px;
            bottom: -4px;
            left: 0;
            background: linear-gradient(90deg, #3b82f6, #06b6d4);
            animation: underlineGrowFade 3s ease-in-out 0.3s forwards;
          }

          @keyframes underlineGrowFade {
            0% {
              width: 0;
              left: 0;
            }
            45% {
              width: 100%;
              left: 0;
            }
            55% {
              width: 100%;
              left: 0;
            }
            100% {
              width: 0;
              left: 100%;
            }
          }
        `}
      </style>
      <header className="border-b-2 border-gray-800 bg-white shadow-[0px_3px_0px_0px_rgba(0,0,0,1)]">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h1 className="text-xl md:text-3xl font-black tracking-tight mb-6">
            <span className="animated-title">{title}</span>
          </h1>
          <p className="text-lg font-semibold max-w-3xl text-gray-700 leading-relaxed">
            {subtitle}
          </p>
        </div>
      </header>
    </>
  );
}
