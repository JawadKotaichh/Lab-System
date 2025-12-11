import { baseURLL } from "src/api";
import {
  Document,
  Page,
  Image,
  View,
  Text,
  PDFViewer,
} from "@react-pdf/renderer";
import type { fetchedInvoiceData } from "../types";
import InvoiceSummaryTable from "./InvoiceSummaryTable";
import { styles } from "./InvoiceSummaryStyle";
export interface SummaryInvoice {
  summaryData: fetchedInvoiceData[];
  showSignature: boolean;
  start_date: Date;
  end_date: Date;
}
const InvoiceSummaryPDF: React.FC<SummaryInvoice> = ({
  summaryData,
  showSignature,
  start_date,
  end_date,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Image
        src={`${baseURLL}/branding/lab_header`}
        style={styles.lab_header}
      />
      <View style={styles.patientCard}>
        <View style={styles.patientInfoRow}>
          <View style={styles.patientInfoPair}>
            <Text style={styles.patientLabel}>Insurance Company:</Text>
            <Text style={styles.patientValue}>
              {summaryData[0].patient.insurance_company_name}
            </Text>
          </View>
          <View style={styles.patientInfoPair}>
            <Text style={styles.patientLabel}>From:</Text>
            <Text style={styles.patientValue}>
              {start_date
                ? new Date(start_date).toISOString().split("T")[0]
                : null}
            </Text>
          </View>
          <View style={styles.patientInfoPair}>
            <Text style={styles.patientLabel}>To:</Text>
            <Text style={styles.patientValue}>
              {end_date ? new Date(end_date).toISOString().split("T")[0] : null}
            </Text>
          </View>
        </View>
      </View>
      <InvoiceSummaryTable
        start_date={start_date}
        end_date={end_date}
        summaryData={summaryData}
        showSignature={showSignature}
      />

      <View style={[{ textAlign: "right", paddingTop: 15 }]}>
        {showSignature && (
          <Image
            src={`${baseURLL}/branding/lab_signature`}
            style={styles.lab_signature}
          />
        )}
        <Text>Signature</Text>
        <Text style={[{ top: 20 }]}>2009/37</Text>
      </View>

      <View style={styles.footer} fixed>
        <Image
          src={`${baseURLL}/branding/lab_address`}
          style={styles.footerImage}
        />
      </View>
    </Page>
  </Document>
);
export default function InvoiceSummaryList({
  summaryData,
  showSignature,
  start_date,
  end_date,
}: SummaryInvoice) {
  return (
    <PDFViewer width="100%" height="100%">
      <InvoiceSummaryPDF
        end_date={end_date}
        start_date={start_date}
        summaryData={summaryData}
        showSignature={showSignature}
      />
    </PDFViewer>
  );
}
