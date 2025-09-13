interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Navigation({
  currentView,
  onViewChange,
}: NavigationProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-6 py-4">
        <nav className="flex space-x-8">
          <button
            onClick={() => onViewChange("home")}
            className={`text-sm font-medium transition-colors ${
              currentView === "home"
                ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onViewChange("report")}
            className={`text-sm font-medium transition-colors ${
              currentView === "report"
                ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Report a Dataset
          </button>
          <button
            onClick={() => onViewChange("lookup")}
            className={`text-sm font-medium transition-colors ${
              currentView === "lookup"
                ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            BDUK Lookup
          </button>
        </nav>
      </div>
    </div>
  );
}
