"use client";

import Header from "./components/Header";
import InfoCards from "./components/InfoCards";
import SubmissionForm from "./components/SubmissionForm";
import InfoCard2 from "./components/InfoCard2";

export default function Home() {
  const handleFormSubmit = () => {
    alert("Thank you for your submission! We'll review the dataset.");
  };

  const infoCards = [
    {
      title: "USRN",
      description:
        "The Unique Street Reference Number (USRN) is an 8 digit unique identifier for every street across Great Britain.",
    },
    {
      title: "UPRN",
      description:
        "The Unique Property Reference Number (UPRN) is a unique identifier for every addressable location in Great Britain.",
    },
  ];

  const benefits = [
    "Accurate emergency service response",
    "Efficient public service delivery",
    "Precise location-based data analysis",
    "Improved government data interoperability",
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky info banner */}
      <div className="bg-slate-100 border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <p className="text-xs text-slate-600 leading-relaxed text-center">
            <strong>Note:</strong> It&apos;s been around 5 years since{" "}
            <a
              href="https://www.geoplace.co.uk/addresses-streets/location-data/usrn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              USRNs
            </a>{" "}
            and{" "}
            <a
              href="https://www.geoplace.co.uk/addresses-streets/location-data/the-uprn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              UPRNs
            </a>{" "}
            were made{" "}
            <a
              href="https://www.geoplace.co.uk/power-of-place/becoming-open-and-royalty-free"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              open data.
            </a>{" "}
          </p>
        </div>
      </div>

      <Header
        title="404: USRN and/or UPRN Not Found"
        subtitle="Report datasets that are missing Unique Street Reference Numbers (USRN) or Unique Property Reference Numbers (UPRN) to help improve location data."
      />

      <main className="max-w-5xl mx-auto px-6 py-16">
        <InfoCards cards={infoCards} />

        <SubmissionForm onSubmit={handleFormSubmit} />

        <InfoCard2
          title="Why does this matter?"
          description="USRNs and UPRNs are integral to location data and enable:"
          benefits={benefits}
          conclusion="By reporting datasets that should include these identifiers, you contribute to better public services and more effective use of government data."
        />
      </main>
    </div>
  );
}
