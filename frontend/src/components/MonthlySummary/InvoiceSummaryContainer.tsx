import { useState } from "react";
import { useLocation } from "react-router-dom";
import ShowWithSignature from "../ShowWithSignature";
import InvoiceSummaryList from "./InvoiceSummaryList";

export default function InvoiceSummaryContainer() {
  const location = useLocation();

  const { summaryData, currency, start_date, end_date } = location.state || {};

  // const [loading, setLoading] = useState(true);

  // const [error, setError] = useState<string>("");
  const [showSignature, setShowSignature] = useState<boolean>(true);
  const [showSignatureOption, setShowSignatureOption] = useState<boolean>(true);

  // if (loading) return <div>Loading Summary Invoice</div>;
  // if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ width: "100%", height: "800px" }}>
      {showSignatureOption && (
        <ShowWithSignature
          setShowSignature={setShowSignature}
          setShowSignatureOption={setShowSignatureOption}
        />
      )}
      {!showSignatureOption && (
        <InvoiceSummaryList
          currency={currency}
          end_date={end_date}
          start_date={start_date}
          summaryData={summaryData}
          showSignature={showSignature}
        />
      )}
    </div>
  );
}
