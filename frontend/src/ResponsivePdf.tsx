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
            <div className="p-4 flex flex-wrap gap-3 items-center justify-center">
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 active:scale-[0.98] transition"
              >
                Open PDF
              </a>

              <a
                href={url}
                download={fileName}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition"
              >
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
