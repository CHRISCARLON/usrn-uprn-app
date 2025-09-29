"use client";

import { useState } from "react";

interface StreetWork {
  id: string;
  arrondissement: string;
  startDate: string;
  endDate: string;
  category: string;
  contractor: string;
  area: number;
  description: string;
  locationDetails: string[];
  parkingImpact: string[];
  requestId: string;
  workSiteId: string;
  geometry: string;
  coordinates: {
    lon: number;
    lat: number;
  };
}

interface StreetWorksResponse {
  success: boolean;
  totalCount: number;
  count: number;
  data: StreetWork[];
  message?: string;
  error?: string;
}

interface Company {
  siret: string;
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  activite: string;
  dateCreation: string;
}

export default function FrenchStreetWorks() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<StreetWorksResponse | null>(null);
  const [address, setAddress] = useState<string>("");
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const fetchCompanies = async (address: string) => {
    setLoadingCompanies(true);
    setCompanies([]);

    try {
      const response = await fetch(
        `/api/companies?address=${encodeURIComponent(address)}`
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setCompanies(result.companies || []);
        console.log(
          `Found ${result.total} companies on ${result.searchedStreet}`
        );
        console.log("Companies:", result.companies);
      }
    } catch (err) {
      console.error("Failed to fetch companies:", err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchAddress = async (lat: number, lon: number) => {
    setLoadingAddress(true);
    setAddress("");

    try {
      const response = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setAddress(result.address);
        console.log("Address found:", result.address);
      } else {
        setAddress("Address not found");
      }
    } catch (err) {
      console.error("Failed to fetch address:", err);
      setAddress("Error fetching address");
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleNext = () => {
    if (data && currentIndex < data.data.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAddress(""); // Reset address when changing work
      setCompanies([]); // Reset companies when changing work
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setAddress(""); // Reset address when changing work
      setCompanies([]); // Reset companies when changing work
    }
  };

  const fetchStreetWorks = async () => {
    setLoading(true);
    setError("");
    setData(null);
    setAddress(""); // Reset address when fetching new data
    setCurrentIndex(0); // Reset to first item

    try {
      const response = await fetch("/api/french-street-works?limit=50");

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result: StreetWorksResponse = await response.json();

      setData(result);
    } catch (err) {
      console.error("Failed to fetch:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white border-2 border-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {/* Header Section */}
        <div className="bg-gray-100 px-6 py-4 border-b border-gray-300">
          <h2 className="text-lg font-semibold text-gray-900">
            Paris Street Works
          </h2>
          <p className="text-sm text-gray-700">
            Live street works data from the Paris open data portal. Displaying a
            sample of 50 records.
          </p>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <button
            onClick={fetchStreetWorks}
            disabled={loading}
            className={`w-full py-3 px-4 border-2 text-sm transition-all duration-150 ${
              loading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                : "bg-white text-gray-700 border-gray-600 hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            }`}
          >
            {loading ? "Loading..." : "Fetch Street Works"}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200">
              <p className="text-red-800 text-sm">Error: {error}</p>
            </div>
          )}

          {data && data.success && (
            <div className="mt-4 space-y-4">
              <div className="p-3 bg-green-50 border border-green-200">
                <p className="text-green-800 text-sm">
                  Found {data.totalCount} street works currently in progress
                  across Paris
                </p>
              </div>

              {data.data.length > 0 && (
                <div className="bg-white border border-gray-300">
                  {/* Card Header */}
                  <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          Street Work {currentIndex + 1} of {data.data.length}
                        </h3>
                        <p className="text-xs text-gray-600">
                          ID: {data.data[currentIndex].id}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={handlePrevious}
                          disabled={currentIndex === 0}
                          className={`px-3 py-1 text-sm border ${
                            currentIndex === 0
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                              : "bg-white text-gray-700 border-gray-600 hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150"
                          }`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={handleNext}
                          disabled={currentIndex === data.data.length - 1}
                          className={`px-3 py-1 text-sm border ${
                            currentIndex === data.data.length - 1
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                              : "bg-white text-gray-700 border-gray-600 hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150"
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Timeline */}
                      <div className="border border-gray-200 p-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Timeline
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div>Start: {data.data[currentIndex].startDate}</div>
                          <div>End: {data.data[currentIndex].endDate}</div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="border border-gray-200 p-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Location
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div>
                            Arrondissement:{" "}
                            {data.data[currentIndex].arrondissement}
                          </div>
                          <div>Area: {data.data[currentIndex].area} m²</div>
                        </div>
                      </div>

                      {/* Project Info */}
                      <div className="border border-gray-200 p-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Project
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div>
                            Category: {data.data[currentIndex].category}
                          </div>
                          <div>
                            Contractor: {data.data[currentIndex].contractor}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border border-gray-200 p-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Description
                      </h4>
                      <p className="text-sm text-gray-700">
                        {data.data[currentIndex].description}
                      </p>
                    </div>
                  </div>

                  {/* Location Analysis Section */}
                  <div className="border-t border-gray-300 bg-gray-50 px-4 py-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Location Analysis
                    </h4>

                    <button
                      onClick={() =>
                        fetchAddress(
                          data.data[currentIndex].coordinates.lat,
                          data.data[currentIndex].coordinates.lon
                        )
                      }
                      disabled={loadingAddress}
                      className={`w-full py-2 px-3 text-sm border ${
                        loadingAddress
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                          : "bg-white text-gray-700 border-gray-600 hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150"
                      }`}
                    >
                      {loadingAddress ? "Loading..." : "Get Street Address"}
                    </button>

                    {address && (
                      <div className="mt-3 bg-white border border-gray-300 p-3">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">
                          Street Address
                        </h5>
                        <p className="text-sm text-gray-700 mb-3">{address}</p>

                        <button
                          onClick={() => fetchCompanies(address)}
                          disabled={loadingCompanies}
                          className={`w-full py-2 px-3 text-sm border ${
                            loadingCompanies
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                              : "bg-white text-gray-700 border-gray-600 hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150"
                          }`}
                        >
                          {loadingCompanies
                            ? "Loading..."
                            : "Find Companies on this Street"}
                        </button>
                      </div>
                    )}

                    {companies.length > 0 && (
                      <div className="mt-3 bg-white border border-gray-300 p-3">
                        <h5 className="text-sm font-medium text-gray-900 mb-3">
                          {companies.length} Companies Found
                        </h5>

                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {companies.map((company, idx) => (
                            <div
                              key={idx}
                              className="border border-gray-200 p-2"
                            >
                              <h6 className="font-medium text-gray-900 text-sm mb-1">
                                {company.nom}
                              </h6>
                              <div className="space-y-1 text-xs text-gray-600">
                                <div>SIRET: {company.siret}</div>
                                <div>Address: {company.adresse}</div>
                                <div>City: {company.ville}</div>
                                <div>Activity: {company.activite}</div>
                                <div>Created: {company.dateCreation}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Data Attribution */}
        <div className="border-t border-gray-300 bg-gray-50 px-6 py-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Data Attribution & Licensing
          </h4>
          <div className="space-y-1 text-xs text-gray-600">
            <p>
              • SIRENE® data from INSEE, ODbL license. Data provided by INSEE
              and available on data.gouv.fr.
            </p>
            <p>
              • Source: Base Adresse Nationale (BAN), Licence Ouverte Etalab 2.0
            </p>
            <p>• Source: IGN, Licence Ouverte Etalab 2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
