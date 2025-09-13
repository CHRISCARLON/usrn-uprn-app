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
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<USRNData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [requirePassword, setRequirePassword] = useState<boolean | null>(null);
  const [authConfigLoading, setAuthConfigLoading] = useState(true);
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    fetch("/api/auth-config")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setRequirePassword(data.requirePassword);
        setAuthConfigLoading(false);
      })
      .catch((error) => {
        console.error("Auth config failed:", error);
        setRequirePassword(true);
        setAuthConfigLoading(false);
      });
  }, []);

  useEffect(() => {
    const updateRequestCount = () => {
      const storedCount = localStorage.getItem("requestCount");
      if (storedCount) {
        setRequestCount(parseInt(storedCount, 10));
      }
    };

    updateRequestCount();
  }, []);

  const recordRequest = () => {
    const newCount = requestCount + 1;
    setRequestCount(newCount);
    localStorage.setItem("requestCount", newCount.toString());
  };

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

  const isFormValid = requirePassword
    ? isValid && password.trim().length > 0
    : isValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData = {
        usrn: usrn.trim(),
      };
      const validatedData = usrnSchema.parse(submitData);

      if (requirePassword && (!password || password.trim().length === 0)) {
        setError("Password is required");
        return;
      }

      setLoading(true);
      setError("");
      setData(null);

      recordRequest();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (requirePassword) {
        headers["Authorization"] = `Bearer ${password.trim()}`;
      }

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

  if (authConfigLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex justify-center">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
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
            <div className="text-xs text-gray-500">
              <span>Requests Made: {requestCount}</span>
            </div>
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
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 transition-colors ${
                  usrn && !isValid
                    ? "border-orange-300 focus:ring-orange-500 focus:border-orange-500"
                    : usrn && isValid
                      ? "border-green-300 focus:ring-green-500 focus:border-green-500"
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                }`}
              />
              {usrn && isValid && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              )}
              {usrn && !isValid && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-red-500"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              )}
            </div>
            {validationError && usrn && (
              <p className="mt-1 text-sm text-red-600">{validationError}</p>
            )}
          </div>

          {requirePassword && (
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Access Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter access password"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className={`w-full font-medium py-2 px-4 rounded-md transition-all duration-200 flex items-center justify-center ${
              !isFormValid || loading
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700 active:bg-green-800 cursor-pointer"
            }`}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Searching...
              </>
            ) : (
              "Look Up USRN"
            )}
          </button>
        </form>

        {data && (
          <div className="mt-8 space-y-6">
            {/* Summary Card */}
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Summary for USRN {data.usrn}
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Region</p>
                  <p className="font-medium">{data.summary.region}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Local Authority</p>
                  <p className="font-medium">{data.summary.local_authority}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Premises</p>
                  <p className="font-medium">{data.total_premises}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gigabit Ready</p>
                  <p className="font-medium">
                    {data.summary.total_gigabit_ready} (
                    {Math.round(
                      (data.summary.total_gigabit_ready / data.total_premises) *
                        100,
                    )}
                    %)
                  </p>
                </div>
              </div>
            </div>

            {/* Postcode Breakdown */}
            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Postcode Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Postcode
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Premises
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Gigabit Ready
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Future Gigabit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {data.summary.postcodes.map((pc) => (
                      <tr key={pc.postcode}>
                        <td className="px-4 py-2 text-sm">{pc.postcode}</td>
                        <td className="px-4 py-2 text-sm">{pc.count}</td>
                        <td className="px-4 py-2 text-sm">
                          <span
                            className={
                              pc.gigabit_ready > 0
                                ? "text-green-600"
                                : "text-gray-500"
                            }
                          >
                            {pc.gigabit_ready}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span
                            className={
                              pc.future_gigabit > 0
                                ? "text-blue-600"
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

            {/* Subsidy Classification Info */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
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
                      Premises with no gigabit network infrastructure and none
                      is likely to be developed within 3 years.{" "}
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
                      infrastructures from different suppliers being available,
                      or will be deployed within the coming 3 years.
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
                      Coverage reported but not yet verified, or planned build
                      with some delivery risks or gaps in evidence.
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-amber-200">
                <p className="text-xs text-gray-700">
                  <span className="font-semibold">Note:</span> When a premise
                  shows both current and future gigabit (✓ in both columns), it
                  means gigabit service is already available from at least one
                  supplier, and additional suppliers will provide coverage in
                  the future, increasing competition and choice.
                </p>
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
              className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {showDetails ? "Hide" : "Show"} Detailed UPRN List
            </button>

            {showDetails && (
              <div className="p-6 bg-white rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Premises Details
                </h3>
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
            )}

            {/* License Information */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">
                Data Attribution & Licensing
              </h4>
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
        )}
      </div>
    </div>
  );
}
