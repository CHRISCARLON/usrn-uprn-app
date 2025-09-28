interface HomePageProps {
  onNavigate: (view: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white border-2 border-gray-800 p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Report a Dataset
          </h2>
          <button
            onClick={() => onNavigate("report")}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium border border-gray-600 px-3 py-1 hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150"
          >
            Go to Page →
          </button>
        </div>

        <div className="bg-white border-2 border-gray-800 p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            BDUK Connectivity
          </h2>
          <button
            onClick={() => onNavigate("lookup")}
            className="inline-flex items-center text-green-600 hover:text-green-700 font-medium border border-gray-600 px-3 py-1 hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150"
          >
            Go to Page →
          </button>
        </div>

        <div className="bg-white border-2 border-gray-800 p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Paris Street Works
          </h2>
          <button
            onClick={() => onNavigate("streetworks")}
            className="inline-flex items-center text-red-600 hover:text-red-700 font-medium border border-gray-600 px-3 py-1 hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150"
          >
            Go to Page →
          </button>
        </div>
      </div>
    </div>
  );
}
