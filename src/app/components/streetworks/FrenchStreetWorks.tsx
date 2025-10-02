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

interface BdTopoFeature {
  type: string;
  id: string;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  properties: {
    cleabs: string;
    nature: string;
    nom_collaboratif_gauche: string;
    nom_collaboratif_droite: string;
    importance: string;
    sens_de_circulation: string;
    nombre_de_voies: number;
    largeur_de_chaussee: number;
    urbain: boolean;
    vitesse_moyenne_vl: number;
    acces_vehicule_leger: string;
    acces_pieton: string | null;
    amenagement_cyclable_gauche: string | null;
    amenagement_cyclable_droit: string | null;
    sens_amenagement_cyclable_gauche: string | null;
    sens_amenagement_cyclable_droit: string | null;
    borne_debut_gauche: string;
    borne_debut_droite: string;
    borne_fin_gauche: string;
    borne_fin_droite: string;
    insee_commune_gauche: string;
    insee_commune_droite: string;
    nom_voie_ban_gauche: string;
    nom_voie_ban_droite: string;
    identifiant_voie_ban_gauche: string;
    identifiant_voie_ban_droite: string;
    restriction_de_hauteur: number | null;
    restriction_de_poids_total: number | null;
    restriction_de_largeur: number | null;
    restriction_de_longueur: number | null;
    matieres_dangereuses_interdites: boolean;
    date_creation: string;
    date_modification: string;
    fictif: boolean;
    etat_de_l_objet: string;
    position_par_rapport_au_sol: string;
    itineraire_vert: boolean;
    prive: boolean;
    reserve_aux_bus: string | null;
    [key: string]: string | number | boolean | null | undefined;
  };
}

interface BdTopoResponse {
  success: boolean;
  banId: string;
  totalFeatures: number;
  features: BdTopoFeature[];
  error?: string;
}

export default function FrenchStreetWorks() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<StreetWorksResponse | null>(null);
  const [address, setAddress] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [bdTopoData, setBdTopoData] = useState<BdTopoResponse | null>(null);
  const [loadingBdTopo, setLoadingBdTopo] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingTimeouts, setLoadingTimeouts] = useState<NodeJS.Timeout[]>([]);

  const cancelLoading = () => {
    loadingTimeouts.forEach(clearTimeout);
    setLoadingTimeouts([]);
    setLoadingMessage("");
    setLoadingCompanies(false);
    setLoadingBdTopo(false);
  };

  const analyseStreet = async (lat: number, lon: number) => {
    setLoadingCompanies(true);
    setLoadingBdTopo(true);
    setLoadingMessage("");
    setAddress("");
    setCompanies([]);
    setBdTopoData(null);

    const messages = [
      "Bribing the API with baguettes...",
      "Bribing the API with more baguettes...",
      "How many baguettes does it need!?",
      "Asking Emmanuel Macron nicely...",
      "Allons enfants de la Patrie...",
      "Teaching the server French...",
      "Still faster than the Post Office...",
      "Intern is cycling to get the data...",
      "Counting cobblestones...",
      "At least it's not a 404...",
      "Paris wasn't built in a day...",
      "Au moins c'est gratuit...",
      "I have no words...",
    ];

    const timeouts: NodeJS.Timeout[] = [];

    messages.forEach((message, index) => {
      const timeout = setTimeout(() => {
        setLoadingMessage(message);
      }, (index + 1) * 5000);
      timeouts.push(timeout);
    });
    setLoadingTimeouts(timeouts);

    try {
      const addressResponse = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
      if (!addressResponse.ok) {
        throw new Error(`Error: ${addressResponse.status}`);
      }

      const addressResult = await addressResponse.json();
      if (addressResult.success) {
        setAddress(addressResult.address);

        const companiesPromise = fetch(
          `/api/companies?address=${encodeURIComponent(addressResult.address)}`
        )
          .then(async (response) => {
            if (response.ok) {
              const result = await response.json();
              if (result.success) {
                setCompanies(result.companies || []);
              }
            }
          })
          .catch(() => console.error("Failed to fetch companies:"))
          .finally(() => setLoadingCompanies(false));

        // Fetch BD TOPO data!
        const bdTopoPromise = fetch(
          `/api/bdtopo?address=${encodeURIComponent(addressResult.address)}`
        )
          .then(async (response) => {
            if (response.ok) {
              const result = await response.json();
              if (result.success) {
                setBdTopoData(result);
              }
            }
          })
          .catch((err) => console.error("Failed to fetch BD TOPO data:", err))
          .finally(() => {
            setLoadingBdTopo(false);
            timeouts.forEach(clearTimeout);
            setLoadingMessage("");
          });

        // Wait for both to complete
        await Promise.all([companiesPromise, bdTopoPromise]);
      } else {
        setAddress("Address not found");
        setLoadingCompanies(false);
        setLoadingBdTopo(false);
        timeouts.forEach(clearTimeout);
        setLoadingMessage("");
      }
    } catch (err) {
      console.error("Failed to analyse street:", err);
      setAddress("Error fetching address");
      setLoadingCompanies(false);
      setLoadingBdTopo(false);
      timeouts.forEach(clearTimeout);
      setLoadingMessage("");
    }
  };

  const handleNext = () => {
    if (data && currentIndex < data.data.length - 1) {
      cancelLoading();
      setCurrentIndex(currentIndex + 1);
      setAddress("");
      setCompanies([]);
      setBdTopoData(null);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      cancelLoading();
      setCurrentIndex(currentIndex - 1);
      setAddress("");
      setCompanies([]);
      setBdTopoData(null);
    }
  };

  const fetchStreetWorks = async () => {
    setLoading(true);
    setError("");
    setData(null);
    setAddress("");
    setCurrentIndex(0);

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
                      <div className="flex gap-3">
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

                    {data.data[currentIndex].locationDetails &&
                      data.data[currentIndex].locationDetails.length > 0 && (
                        <div className="mt-4 border border-gray-200 p-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Location Details
                          </h4>
                          <div className="text-sm text-gray-700 space-y-1">
                            {data.data[currentIndex].locationDetails.map(
                              (detail, idx) => (
                                <div key={idx}>{detail}</div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {data.data[currentIndex].parkingImpact &&
                      data.data[currentIndex].parkingImpact.length > 0 && (
                        <div className="mt-4 border border-gray-200 p-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Parking Impact
                          </h4>
                          <div className="text-sm text-gray-700 space-y-1">
                            {data.data[currentIndex].parkingImpact.map(
                              (impact, idx) => (
                                <div key={idx}>{impact}</div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Location Analysis Section */}
                  <div className="border-t border-gray-300 bg-gray-50 px-4 py-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Street Analysis
                    </h4>

                    <button
                      onClick={() =>
                        analyseStreet(
                          data.data[currentIndex].coordinates.lat,
                          data.data[currentIndex].coordinates.lon
                        )
                      }
                      disabled={loadingCompanies || loadingBdTopo}
                      className={`w-full py-2 px-3 text-sm border mb-2 ${
                        loadingCompanies || loadingBdTopo
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                          : "bg-white text-gray-700 border-gray-600 hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150"
                      }`}
                    >
                      {loadingCompanies || loadingBdTopo
                        ? "Analysing..."
                        : "Analyse Street"}
                    </button>

                    <p className="text-xs text-gray-500 italic mb-3">
                      Note: Street topology data may take longer to load
                    </p>

                    {address && (
                      <div className="mb-3 p-2 bg-blue-50 border border-blue-200">
                        <div className="space-y-1 text-xs text-gray-700">
                          <div>
                            <span className="font-medium">Address:</span>{" "}
                            {address}
                          </div>
                          <div>
                            <span className="font-medium">Coordinates:</span>{" "}
                            {data.data[currentIndex].coordinates.lat.toFixed(6)}
                            ,{" "}
                            {data.data[currentIndex].coordinates.lon.toFixed(6)}
                          </div>
                        </div>
                      </div>
                    )}

                    {(companies.length > 0 ||
                      loadingCompanies ||
                      bdTopoData ||
                      loadingBdTopo) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {/* Companies Column */}
                        <div>
                          {loadingCompanies && (
                            <div className="bg-white border border-gray-300 p-3">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-500">
                                  Loading companies data
                                </p>
                                <div className="flex gap-1">
                                  <span
                                    className="animate-bounce"
                                    style={{ animationDelay: "0ms" }}
                                  >
                                    .
                                  </span>
                                  <span
                                    className="animate-bounce"
                                    style={{ animationDelay: "150ms" }}
                                  >
                                    .
                                  </span>
                                  <span
                                    className="animate-bounce"
                                    style={{ animationDelay: "300ms" }}
                                  >
                                    .
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {!loadingCompanies && companies.length > 0 && (
                            <div className="bg-white border border-gray-300 p-3">
                              <h5 className="text-sm font-medium text-gray-900 mb-3">
                                {companies.length} Companies
                              </h5>
                              <div
                                className="space-y-2"
                                style={{
                                  maxHeight: "500px",
                                  overflowY: "auto",
                                }}
                              >
                                {companies.map((company, idx) => (
                                  <div
                                    key={idx}
                                    className="border border-gray-200 p-2"
                                  >
                                    <h6 className="font-medium text-gray-900 text-sm mb-1">
                                      {company.nom}
                                    </h6>
                                    <div className="space-y-1 text-sm text-gray-600">
                                      <div>SIRET: {company.siret}</div>
                                      <div>
                                        {company.adresse}, {company.ville}
                                      </div>
                                      <div>Activity: {company.activite}</div>
                                      <div>Created: {company.dateCreation}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {!loadingCompanies &&
                            companies.length === 0 &&
                            address && (
                              <div className="bg-white border border-gray-300 p-3">
                                <div
                                  className="flex items-center"
                                  style={{ minHeight: "24px" }}
                                >
                                  <p className="text-sm text-gray-500">
                                    No companies found
                                  </p>
                                </div>
                              </div>
                            )}
                        </div>

                        {/* BD TOPO Column */}
                        <div>
                          {loadingBdTopo && (
                            <div className="bg-white border border-gray-300 p-3">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-500">
                                  Loading street data
                                </p>
                                <div className="flex gap-1">
                                  <span
                                    className="animate-bounce"
                                    style={{ animationDelay: "0ms" }}
                                  >
                                    .
                                  </span>
                                  <span
                                    className="animate-bounce"
                                    style={{ animationDelay: "150ms" }}
                                  >
                                    .
                                  </span>
                                  <span
                                    className="animate-bounce"
                                    style={{ animationDelay: "300ms" }}
                                  >
                                    .
                                  </span>
                                </div>
                                {loadingMessage && (
                                  <span className="text-sm text-gray-600 italic">
                                    ({loadingMessage})
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {!loadingBdTopo &&
                            bdTopoData &&
                            bdTopoData.success && (
                              <div className="bg-white border border-gray-300 p-3">
                                <h5 className="text-sm font-medium text-gray-900 mb-3">
                                  Street Data ({bdTopoData.totalFeatures}{" "}
                                  segments) - BAN ID: {bdTopoData.banId}
                                </h5>

                                {bdTopoData.features.length > 0 && (
                                  <div
                                    className="space-y-3"
                                    style={{
                                      maxHeight: "500px",
                                      overflowY: "auto",
                                    }}
                                  >
                                    {bdTopoData.features.map((feature, idx) => (
                                      <div
                                        key={idx}
                                        className="border border-gray-200 p-2"
                                      >
                                        <h6 className="font-medium text-gray-900 text-sm mb-1">
                                          {feature.properties
                                            .nom_voie_ban_gauche ||
                                            feature.properties
                                              .nom_collaboratif_gauche}
                                        </h6>
                                        <div className="space-y-1 text-sm text-gray-600">
                                          {(feature.properties
                                            .nom_voie_ban_gauche ||
                                            feature.properties
                                              .nom_voie_ban_droite) && (
                                            <div>
                                              <span className="font-medium">
                                                Street Name:
                                              </span>{" "}
                                              {feature.properties
                                                .nom_voie_ban_gauche && (
                                                <span>
                                                  {
                                                    feature.properties
                                                      .nom_voie_ban_gauche
                                                  }
                                                </span>
                                              )}
                                              {feature.properties
                                                .nom_voie_ban_gauche &&
                                                feature.properties
                                                  .nom_voie_ban_droite &&
                                                feature.properties
                                                  .nom_voie_ban_gauche !==
                                                  feature.properties
                                                    .nom_voie_ban_droite && (
                                                  <span> | </span>
                                                )}
                                              {feature.properties
                                                .nom_voie_ban_droite &&
                                                feature.properties
                                                  .nom_voie_ban_gauche !==
                                                  feature.properties
                                                    .nom_voie_ban_droite && (
                                                  <span>
                                                    {
                                                      feature.properties
                                                        .nom_voie_ban_droite
                                                    }
                                                  </span>
                                                )}
                                            </div>
                                          )}
                                          <div>
                                            <span className="font-medium">
                                              Type:
                                            </span>{" "}
                                            {feature.properties.nature}
                                          </div>
                                          <div>
                                            <span className="font-medium">
                                              Direction:
                                            </span>{" "}
                                            {
                                              feature.properties
                                                .sens_de_circulation
                                            }
                                          </div>
                                          <div>
                                            <span className="font-medium">
                                              Lanes:
                                            </span>{" "}
                                            {feature.properties.nombre_de_voies}
                                            , Width:{" "}
                                            {
                                              feature.properties
                                                .largeur_de_chaussee
                                            }
                                            m
                                          </div>
                                          <div>
                                            <span className="font-medium">
                                              Speed:
                                            </span>{" "}
                                            {
                                              feature.properties
                                                .vitesse_moyenne_vl
                                            }{" "}
                                            km/h
                                          </div>
                                          <div>
                                            <span className="font-medium">
                                              Vehicle Access:
                                            </span>{" "}
                                            {
                                              feature.properties
                                                .acces_vehicule_leger
                                            }
                                          </div>
                                          {feature.properties.acces_pieton && (
                                            <div>
                                              <span className="font-medium">
                                                Pedestrian:
                                              </span>{" "}
                                              {feature.properties.acces_pieton}
                                            </div>
                                          )}
                                          <div>
                                            <span className="font-medium">
                                              Urban:
                                            </span>{" "}
                                            {feature.properties.urbain
                                              ? "Yes"
                                              : "No"}
                                            {" | "}
                                            <span className="font-medium">
                                              Private:
                                            </span>{" "}
                                            {feature.properties.prive
                                              ? "Yes"
                                              : "No"}
                                            {" | "}
                                            <span className="font-medium">
                                              Green Route:
                                            </span>{" "}
                                            {feature.properties.itineraire_vert
                                              ? "Yes"
                                              : "No"}
                                          </div>
                                          <div>
                                            <span className="font-medium">
                                              State:
                                            </span>{" "}
                                            {feature.properties
                                              .etat_de_l_objet === "En service"
                                              ? "In service"
                                              : feature.properties
                                                  .etat_de_l_objet}
                                          </div>
                                          <div>
                                            <span className="font-medium">
                                              Position:
                                            </span>{" "}
                                            {feature.properties
                                              .position_par_rapport_au_sol ===
                                            "0"
                                              ? "Ground level"
                                              : feature.properties
                                                  .position_par_rapport_au_sol}
                                          </div>
                                          {feature.properties
                                            .reserve_aux_bus && (
                                            <div>
                                              <span className="font-medium">
                                                Bus Lane:
                                              </span>{" "}
                                              {
                                                feature.properties
                                                  .reserve_aux_bus
                                              }
                                            </div>
                                          )}
                                          <div>
                                            <span className="font-medium">
                                              Importance:
                                            </span>{" "}
                                            {feature.properties.importance}
                                          </div>
                                          <div>
                                            <span className="font-medium">
                                              Created:
                                            </span>{" "}
                                            {new Date(
                                              feature.properties.date_creation
                                            ).toLocaleDateString()}
                                          </div>
                                          <div>
                                            <span className="font-medium">
                                              Modified:
                                            </span>{" "}
                                            {new Date(
                                              feature.properties.date_modification
                                            ).toLocaleDateString()}
                                          </div>

                                          {(feature.properties
                                            .amenagement_cyclable_gauche ||
                                            feature.properties
                                              .amenagement_cyclable_droit) && (
                                            <div className="pt-2 mt-2 border-t border-gray-200">
                                              <div className="font-medium mb-1 text-green-700">
                                                Cycling Infrastructure:
                                              </div>
                                              {feature.properties
                                                .amenagement_cyclable_gauche && (
                                                <div>
                                                  <span className="font-medium">
                                                    Left:
                                                  </span>{" "}
                                                  {
                                                    feature.properties
                                                      .amenagement_cyclable_gauche
                                                  }
                                                  {feature.properties
                                                    .sens_amenagement_cyclable_gauche && (
                                                    <span>
                                                      {" "}
                                                      (
                                                      {
                                                        feature.properties
                                                          .sens_amenagement_cyclable_gauche
                                                      }
                                                      )
                                                    </span>
                                                  )}
                                                </div>
                                              )}
                                              {feature.properties
                                                .amenagement_cyclable_droit && (
                                                <div>
                                                  <span className="font-medium">
                                                    Right:
                                                  </span>{" "}
                                                  {
                                                    feature.properties
                                                      .amenagement_cyclable_droit
                                                  }
                                                  {feature.properties
                                                    .sens_amenagement_cyclable_droit && (
                                                    <span>
                                                      {" "}
                                                      (
                                                      {
                                                        feature.properties
                                                          .sens_amenagement_cyclable_droit
                                                      }
                                                      )
                                                    </span>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {feature.properties.fictif && (
                                            <div className="pt-2 mt-2 border-t border-gray-200 text-orange-600 font-medium">
                                              ⚠ Fictitious road
                                            </div>
                                          )}

                                          {(feature.properties
                                            .restriction_de_hauteur ||
                                            feature.properties
                                              .restriction_de_poids_total ||
                                            feature.properties
                                              .restriction_de_largeur ||
                                            feature.properties
                                              .restriction_de_longueur ||
                                            feature.properties
                                              .matieres_dangereuses_interdites) && (
                                            <div className="pt-2 mt-2 border-t border-gray-200">
                                              <div className="font-medium text-red-700 mb-1">
                                                Restrictions:
                                              </div>
                                              {feature.properties
                                                .restriction_de_hauteur && (
                                                <div>
                                                  Height:{" "}
                                                  {
                                                    feature.properties
                                                      .restriction_de_hauteur
                                                  }
                                                  m
                                                </div>
                                              )}
                                              {feature.properties
                                                .restriction_de_poids_total && (
                                                <div>
                                                  Weight:{" "}
                                                  {
                                                    feature.properties
                                                      .restriction_de_poids_total
                                                  }
                                                  t
                                                </div>
                                              )}
                                              {feature.properties
                                                .restriction_de_largeur && (
                                                <div>
                                                  Width:{" "}
                                                  {
                                                    feature.properties
                                                      .restriction_de_largeur
                                                  }
                                                  m
                                                </div>
                                              )}
                                              {feature.properties
                                                .restriction_de_longueur && (
                                                <div>
                                                  Length:{" "}
                                                  {
                                                    feature.properties
                                                      .restriction_de_longueur
                                                  }
                                                  m
                                                </div>
                                              )}
                                              {feature.properties
                                                .matieres_dangereuses_interdites && (
                                                <div>Hazmat prohibited</div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                          {!loadingBdTopo && !bdTopoData && address && (
                            <div className="bg-white border border-gray-300 p-3">
                              <p className="text-sm text-gray-500">
                                No street data found
                              </p>
                            </div>
                          )}
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
            <p>• Source: SIRENE data from INSEE, Licence Ouverte Etalab 2.0.</p>
            <p>
              • Source: Base Adresse Nationale (BAN), Licence Ouverte Etalab 2.0
            </p>
            <p>
              • Source: BD TOPO from IGN/Géoplateforme, Licence Ouverte Etalab
              2.0
            </p>
            <p>
              • Source: Paris Open Data, Licence ODbL (Open Database Licence)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
