"use client";

import { useState, useEffect } from "react";
import { usrnSchema } from "@/lib/validation";
import { z } from "zod";

interface Premise {
  uprn: string;
  postcode: string;
  country: string;
  local_authority: string;
  region: string;
  current_gigabit: boolean;
  future_gigabit: boolean;
  lot_name: string;
  subsidy_control_status: string;
}

interface PostcodeSummary {
  postcode: string;
  count: number;
  gigabit_ready: number;
  future_gigabit: number;
}

interface USRNData {
  usrn: string;
  total_premises: number;
  showing: number;
  summary: {
    postcodes: PostcodeSummary[];
    total_gigabit_ready: number;
    total_future_gigabit: number;
    region: string;
    local_authority: string;
  };
  premises: Premise[];
}

export default function USRNLookup() {
  const [usrn, setUsrn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<USRNData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (usrn === "") {
      setIsValid(false);
      setValidationError("");
      return;
    }

    try {
      z.object({
        usrn: z
          .string()
          .regex(/^\d{8}$/, "USRN must be exactly 8 digits!")
          .length(8, "USRN must be exactly 8 digits!"),
      }).parse({ usrn });
      setIsValid(true);
      setValidationError("");
    } catch {
      setIsValid(false);
      setValidationError("USRN must be 8 digits long!");
    }
  }, [usrn]);

  const isFormValid = isValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData = {
        usrn: usrn.trim(),
      };
      const validatedData = usrnSchema.parse(submitData);

      setLoading(true);
      setError("");
      setData(null);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const response = await fetch("/api/usrn-lookup", {
        method: "POST",
        headers,
        body: JSON.stringify({
          usrn: validatedData.usrn,
        }),
      });

      if (!response.ok) {
        throw new Error("Request Failed");
      }

      const result = await response.json();
      setData(result.data);
    } catch {
      setError("Request Failed");
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
            BDUK Gigabit Availability
          </h2>
          <p className="text-sm text-gray-700">
            Check premises gigabit connectivity and future delivery plans.
          </p>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            This tool provides BDUK&apos;s current view of whether premises have
            gigabit connections and future delivery plans.
          </p>
          <p className="text-gray-500 mb-6">
            <span className="block mb-4">Don&apos;t know your USRN?</span>
            <span className="block">
              Go to →{" "}
              <a
                href="https://www.findmystreet.co.uk/map"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                Find My Street!
              </a>
            </span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Request Counter */}
            <div className="mb-4">
              <div className="text-xs text-gray-500"></div>
            </div>

            <div>
              <label
                htmlFor="usrn"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                USRN
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="usrn"
                  value={usrn}
                  onChange={(e) => setUsrn(e.target.value)}
                  placeholder="e.g. 11004423"
                  className={`w-full px-4 py-2 border focus:outline-none transition-colors ${
                    usrn && !isValid
                      ? "border-orange-400 focus:border-orange-500"
                      : usrn && isValid
                      ? "border-green-400 focus:border-green-500"
                      : "border-gray-400 focus:border-gray-600"
                  }`}
                />
              </div>
              {validationError && usrn && (
                <p className="mt-1 text-sm text-red-600">{validationError}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`w-full font-medium py-3 px-4 border-2 text-sm transition-all duration-150 flex items-center justify-center ${
                !isFormValid || loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                  : "bg-white text-gray-700 border-gray-600 hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              }`}
            >
              {loading ? "Searching..." : "Look Up USRN"}
            </button>
          </form>

          {data && (
            <div className="mt-6 space-y-4">
              {/* Summary Card */}
              <div className="bg-white border border-gray-300">
                <div className="bg-blue-50 px-4 py-3 border-b border-gray-300">
                  <h3 className="text-sm font-medium text-gray-900">
                    Summary for USRN {data.usrn}
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="border border-gray-200 p-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Region
                      </h4>
                      <p className="text-sm text-gray-700">
                        {data.summary.region}
                      </p>
                    </div>
                    <div className="border border-gray-200 p-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Local Authority
                      </h4>
                      <p className="text-sm text-gray-700">
                        {data.summary.local_authority}
                      </p>
                    </div>
                    <div className="border border-gray-200 p-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Total Premises
                      </h4>
                      <p className="text-sm text-gray-700">
                        {data.total_premises}
                      </p>
                    </div>
                    <div className="border border-gray-200 p-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Gigabit Ready
                      </h4>
                      <p className="text-sm text-green-700 font-medium">
                        {data.summary.total_gigabit_ready} (
                        {Math.round(
                          (data.summary.total_gigabit_ready /
                            data.total_premises) *
                            100
                        )}
                        %)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Postcode Breakdown */}
              <div className="bg-white border border-gray-300">
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
                  <h3 className="text-sm font-medium text-gray-900">
                    Postcode Breakdown
                  </h3>
                </div>
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Postcode
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Premises
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Gigabit Ready
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Future Gigabit
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {data.summary.postcodes.map((pc) => (
                          <tr key={pc.postcode}>
                            <td className="px-3 py-2 text-sm">{pc.postcode}</td>
                            <td className="px-3 py-2 text-sm">{pc.count}</td>
                            <td className="px-3 py-2 text-sm">
                              <span
                                className={
                                  pc.gigabit_ready > 0
                                    ? "text-green-600 font-medium"
                                    : "text-gray-500"
                                }
                              >
                                {pc.gigabit_ready}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-sm">
                              <span
                                className={
                                  pc.future_gigabit > 0
                                    ? "text-blue-600 font-medium"
                                    : "text-gray-500"
                                }
                              >
                                {pc.future_gigabit}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Subsidy Classification Info */}
              <div className="bg-white border border-gray-300">
                <div className="bg-amber-50 px-4 py-3 border-b border-gray-300">
                  <h4 className="text-sm font-medium text-gray-900">
                    BDUK Project Gigabit Classifications
                    <a
                      href="https://www.gov.uk/government/publications/project-gigabit-uk-subsidy-advice/open-market-review-omr-and-public-review-pr-subsidy-control-classification-guidance"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-xs font-normal text-blue-600 hover:underline"
                    >
                      View official guidance →
                    </a>
                  </h4>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-700 mb-3">
                    BDUK will only provide subsidy to premises designated as{" "}
                    <span className="font-semibold">White</span>.
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start space-x-2">
                      <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mt-1 flex-shrink-0"></span>
                      <div>
                        <span className="font-semibold text-gray-700">
                          Gigabit White:
                        </span>
                        <span className="text-gray-700">
                          {" "}
                          Premises with no gigabit network infrastructure and
                          none is likely to be developed within 3 years.{" "}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="inline-block w-2 h-2 bg-gray-600 rounded-full mt-1 flex-shrink-0"></span>
                      <div>
                        <span className="font-semibold text-gray-800">
                          Gigabit Grey/Black:
                        </span>
                        <span className="text-gray-700">
                          {" "}
                          Premises with one or more qualifying gigabit
                          infrastructures from different suppliers being
                          available, or will be deployed within the coming 3
                          years.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mt-1 flex-shrink-0"></span>
                      <div>
                        <span className="font-semibold text-yellow-800">
                          Under Review:
                        </span>
                        <span className="text-gray-700">
                          {" "}
                          Coverage reported but not yet verified, or planned
                          build with some delivery risks or gaps in evidence.
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-amber-200">
                    <p className="text-xs text-gray-700">
                      <span className="font-semibold">Note:</span> When a
                      premise shows both current and future gigabit (✓ in both
                      columns), it means gigabit service is already available
                      from at least one supplier, and additional suppliers will
                      provide coverage in the future, increasing competition and
                      choice.
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Premises (Optional) */}
              {data.showing < data.total_premises && (
                <p className="text-sm text-gray-600 text-center">
                  Showing {data.showing} of {data.total_premises} premises
                </p>
              )}

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full py-2 px-3 text-sm border bg-white text-gray-700 hover:bg-gray-50 border-gray-400"
              >
                {showDetails ? "Hide" : "Show"} Detailed UPRN List
              </button>

              {showDetails && (
                <div className="bg-white border border-gray-300">
                  <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
                    <h3 className="text-sm font-medium text-gray-900">
                      Premises Details
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              UPRN
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Postcode
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Current Gigabit
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Future Gigabit
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Subsidy Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {data.premises.map((premise, index) => (
                            <tr key={`${premise.uprn}-${index}`}>
                              <td className="px-3 py-2">{premise.uprn}</td>
                              <td className="px-3 py-2">{premise.postcode}</td>
                              <td className="px-3 py-2">
                                {premise.current_gigabit ? (
                                  <span className="text-green-600">✓</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                {premise.future_gigabit ? (
                                  <span className="text-blue-600">✓</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    premise.subsidy_control_status
                                      ?.toLowerCase()
                                      .includes("white")
                                      ? "bg-gray-100 text-gray-800 border border-gray-200"
                                      : premise.subsidy_control_status
                                          ?.toLowerCase()
                                          .includes("black")
                                      ? "bg-gray-800 text-gray-100"
                                      : premise.subsidy_control_status
                                          ?.toLowerCase()
                                          .includes("grey")
                                      ? "bg-gray-100 text-gray-800 border border-gray-300"
                                      : premise.subsidy_control_status
                                          ?.toLowerCase()
                                          .includes("under review")
                                      ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                      : "bg-gray-50 text-gray-600"
                                  }`}
                                >
                                  {premise.subsidy_control_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* License Information */}
              <div className="bg-white border border-gray-300">
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
                  <h4 className="text-sm font-medium text-gray-700">
                    Data Attribution & Licensing
                  </h4>
                </div>
                <div className="p-4">
                  <div className="space-y-2 text-xs text-gray-600">
                    <p>
                      Contains OS data © Crown copyright and database right{" "}
                      {new Date().getFullYear()}
                    </p>
                    <p>
                      •{" "}
                      <a
                        href="https://www.ordnancesurvey.co.uk/products/os-open-linked-identifiers"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        OS Open Linked Identifiers
                      </a>{" "}
                      (USRN to UPRN matching)
                    </p>
                    <p>
                      •{" "}
                      <a
                        href="https://www.gov.uk/government/publications/january-2025-omr-and-premises-in-bduk-plans-england-and-wales/user-guide-and-technical-note-for-premises-in-bduk-plans"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        BDUK Data (January 2025)
                      </a>{" "}
                      (OMR and premises in BDUK plans)
                    </p>
                    <p>
                      All data licensed under the{" "}
                      <a
                        href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Open Government Licence v3.0
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
