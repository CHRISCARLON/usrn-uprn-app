"use client";

import { useState } from "react";
import { SubmissionData } from "@/lib/validation";

export type FormData = SubmissionData;

interface SubmissionFormProps {
  onSubmit?: (data: FormData) => void;
}

export default function SubmissionForm({ onSubmit }: SubmissionFormProps) {
  const [formData, setFormData] = useState<FormData>({
    datasetName: "",
    datasetUrl: "",
    datasetOwner: "Public Sector",
    ownerName: "",
    description: "",
    missingType: "USRN",
    jobTitle: "",
    sector: "Public Sector",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: string;
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitMessage({
          type: "success",
          text: result.message,
        });

        setTimeout(() => {
          setSubmitMessage(null);
        }, 2500);

        setFormData({
          datasetName: "",
          datasetUrl: "",
          datasetOwner: "Public Sector",
          ownerName: "",
          description: "",
          missingType: "Both",
          jobTitle: "",
          sector: "Public Sector",
        });

        if (onSubmit) {
          onSubmit(formData);
        }
      } else {
        setSubmitMessage({
          type: "error",
          text: result.message,
        });
      }
    } catch {
      setSubmitMessage({
        type: "error",
        text: "Request Failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isFormValid =
    formData.datasetName.trim() !== "" &&
    formData.datasetUrl.trim() !== "" &&
    formData.ownerName.trim() !== "" &&
    formData.datasetOwner.trim() !== "" &&
    formData.missingType.trim() !== "" &&
    formData.description.trim() !== "";

  return (
    <section className="border-2 border-gray-800 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="bg-gray-100 px-6 py-4 border-b border-gray-300">
        <h2 className="text-lg font-semibold text-gray-900">Submit a Report</h2>
        <p className="text-sm text-gray-700">
          Help us identify datasets that should include location identifiers but
          currently don&apos;t.
        </p>
      </div>

      <div className="p-8 bg-white">
        {/* Success/Error Message */}
        {submitMessage && (
          <div
            className={`mb-6 p-4 rounded-sm ${
              submitMessage.type === "success"
                ? "text-green-700"
                : "bg-red-50 border-2 border-red-200 text-red-800"
            }`}
          >
            <p className="font-semibold">{submitMessage.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dataset Basic Information */}
          <div className="space-y-6">
            <h3 className="text-base font-bold uppercase tracking-wide text-slate-900 border-b-2 border-slate-200 pb-2">
              Dataset Information
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="datasetName"
                  className="block text-xs font-bold mb-2 uppercase tracking-wide text-slate-900"
                >
                  Dataset Name *
                </label>
                <input
                  type="text"
                  id="datasetName"
                  name="datasetName"
                  value={formData.datasetName}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full p-3 border-2 border-slate-300 text-sm font-medium focus:ring-0 focus:border-slate-500 bg-slate-50 text-slate-900 transition-all duration-200 hover:bg-white disabled:opacity-50"
                  placeholder="e.g. NapTAN Data"
                />
              </div>

              <div>
                <label
                  htmlFor="datasetUrl"
                  className="block text-xs font-bold mb-2 uppercase tracking-wide text-slate-900"
                >
                  Dataset URL *
                </label>
                <input
                  type="url"
                  id="datasetUrl"
                  name="datasetUrl"
                  value={formData.datasetUrl}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full p-3 border-2 border-slate-300 text-sm font-medium focus:ring-0 focus:border-slate-500 bg-slate-50 text-slate-900 transition-all duration-200 hover:bg-white disabled:opacity-50"
                  placeholder="https://data.gov.uk/dataset/..."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="ownerName"
                  className="block text-xs font-bold mb-2 uppercase tracking-wide text-slate-900"
                >
                  Owner Name *
                </label>
                <input
                  type="text"
                  id="ownerName"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full p-3 border-2 border-slate-300 text-sm font-medium focus:ring-0 focus:border-slate-500 bg-slate-50 text-slate-900 transition-all duration-200 hover:bg-white disabled:opacity-50"
                  placeholder="e.g. Department for Transport, Ordnance Survey"
                />
              </div>

              <div>
                <label
                  htmlFor="datasetOwner"
                  className="block text-xs font-bold mb-2 uppercase tracking-wide text-slate-900"
                >
                  Owner Type *
                </label>
                <select
                  id="datasetOwner"
                  name="datasetOwner"
                  value={formData.datasetOwner}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full p-3 border-2 border-slate-300 text-sm font-medium focus:ring-0 focus:border-slate-500 bg-slate-50 text-slate-900 transition-all duration-200 hover:bg-white disabled:opacity-50"
                >
                  <option value="Public Sector">Public Sector</option>
                  <option value="Private Sector">Private Sector</option>
                  <option value="Academic/Research">Academic/Research</option>
                  <option value="Non-profit">Non-profit</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Missing Identifiers */}
          <div className="space-y-6">
            <h3 className="text-base font-bold uppercase tracking-wide text-slate-900 border-b-2 border-slate-200 pb-2">
              Identifier Information
            </h3>

            <div>
              <label
                htmlFor="missingType"
                className="block text-xs font-bold mb-2 uppercase tracking-wide text-slate-900"
              >
                What identifiers should be added? *
              </label>
              <select
                id="missingType"
                name="missingType"
                value={formData.missingType}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="w-full p-4 border-2 border-slate-300 text-sm font-semibold focus:ring-0 focus:border-slate-500 bg-slate-50 text-slate-900 transition-all duration-200 hover:bg-white max-w-md disabled:opacity-50"
              >
                <option value="Both">Both USRN and UPRN</option>
                <option value="USRN">USRN only</option>
                <option value="UPRN">UPRN only</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-xs font-bold mb-2 uppercase tracking-wide text-slate-900"
              >
                Description * ({formData.description.length}/500)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                maxLength={500}
                required
                disabled={isSubmitting}
                rows={5}
                className="w-full p-3 border-2 border-slate-300 text-sm font-medium focus:ring-0 focus:border-slate-500 bg-slate-50 text-slate-900 resize-none transition-all duration-200 hover:bg-white disabled:opacity-50"
                placeholder="Please describe the dataset and explain why you believe it should include USRNs and/or UPRNs. Include any relevant context about the data's purpose and current limitations."
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-6">
            <h3 className="text-base font-bold uppercase tracking-wide text-slate-900 border-b-2 border-slate-200 pb-2">
              Professional Information
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="jobTitle"
                  className="block text-xs font-bold mb-2 uppercase tracking-wide text-slate-900"
                >
                  Job Title (Optional)
                </label>
                <input
                  type="text"
                  id="jobTitle"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full p-3 border-2 border-slate-300 text-sm font-medium focus:ring-0 focus:border-slate-500 bg-slate-50 text-slate-900 transition-all duration-200 hover:bg-white disabled:opacity-50"
                  placeholder="e.g. Data Analyst, GIS Specialist"
                />
              </div>

              <div>
                <label
                  htmlFor="sector"
                  className="block text-xs font-bold mb-2 uppercase tracking-wide text-slate-900"
                >
                  Sector (Optional)
                </label>
                <select
                  id="sector"
                  name="sector"
                  value={formData.sector}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full p-4 border-2 border-slate-300 text-sm font-semibold focus:ring-0 focus:border-slate-500 bg-slate-50 text-slate-900 transition-all duration-200 hover:bg-white disabled:opacity-50"
                >
                  <option value="Public Sector">Public Sector</option>
                  <option value="Private Sector">Private Sector</option>
                  <option value="Academic/Research">Academic/Research</option>
                  <option value="Non-profit">Non-profit</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`px-6 py-3 text-sm font-medium border-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                isFormValid && !isSubmitting
                  ? "bg-white text-gray-700 border-gray-600 hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-gray-100 text-gray-400 border-gray-300"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1">
                  Submitting
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
                </span>
              ) : (
                "Submit Report"
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
