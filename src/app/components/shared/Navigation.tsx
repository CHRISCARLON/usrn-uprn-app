interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Navigation({
  currentView,
  onViewChange,
}: NavigationProps) {
  return (
    <div className="bg-white">
      <div className="max-w-5xl mx-auto">
        <nav className="flex space-x-8 border-2 border-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white p-4">
          <button
            onClick={() => onViewChange("home")}
            className={`text-sm font-medium transition-colors ${
              currentView === "home"
                ? "text-black border-b-2 border-black pb-1"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onViewChange("report")}
            className={`text-sm font-medium transition-colors ${
              currentView === "report"
                ? "text-black border-b-2 border-black pb-1"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Report a Dataset
          </button>
          <button
            onClick={() => onViewChange("lookup")}
            className={`text-sm font-medium transition-colors ${
              currentView === "lookup"
                ? "text-black border-b-2 border-black pb-1"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            BDUK Lookup
          </button>
          <button
            onClick={() => onViewChange("streetworks")}
            className={`text-sm font-medium transition-colors ${
              currentView === "streetworks"
                ? "text-black border-b-2 border-black pb-1"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Paris Street Works
          </button>
        </nav>
      </div>
    </div>
  );
}
