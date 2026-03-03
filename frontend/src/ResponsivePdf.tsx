import React from "react";
import { PDFViewer, BlobProvider } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

type Props = {
  document: React.ReactElement<DocumentProps>;
  fileName?: string;
};

export default function ResponsivePdf({
  document,
  fileName = "document.pdf",
}: Props) {
  const mobile = isMobileDevice();

  if (mobile) {
    return (
      <BlobProvider document={document}>
        {({ url, loading, error }) => {
          if (loading) return <div style={{ padding: 16 }}>Preparing PDF…</div>;
          if (error || !url)
            return <div style={{ padding: 16 }}>Failed to generate PDF.</div>;

          return (
            <div
              style={{
                padding: 16,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <a href={url} target="_blank" rel="noreferrer">
                Open PDF
              </a>
              <a href={url} download={fileName}>
                Download PDF
              </a>
            </div>
          );
        }}
      </BlobProvider>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <PDFViewer width="100%" height="100%">
        {document}
      </PDFViewer>
    </div>
  );
}
