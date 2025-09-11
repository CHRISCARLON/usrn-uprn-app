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
        text: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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
    <section className="border-2 border-slate-300 bg-white shadow-lg rounded-sm">
      <div className="bg-slate-700 text-white p-6">
        <h2 className="text-xl font-bold tracking-wide text-white">
          Submit a Report
        </h2>
      </div>

      <div className="p-8 bg-white">
        {/* Success/Error Message */}
        {submitMessage && (
          <div
            className={`mb-6 p-4 rounded-sm border-2 ${
              submitMessage.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
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
              className={`px-6 py-3 text-sm font-bold uppercase tracking-wide border-2 transition-all duration-200 shadow-sm hover:shadow-md text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                isFormValid && !isSubmitting
                  ? "bg-green-600 border-green-600 hover:bg-green-700 hover:border-green-700"
                  : "bg-slate-700 border-slate-700 hover:bg-slate-800 hover:border-slate-800"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
