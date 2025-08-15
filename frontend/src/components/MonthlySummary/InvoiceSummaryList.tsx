import lab_header from "../../assets/lab_header.png";
import lab_signature from "../../assets/Lab Signature.png";
import lab_address from "../../assets/lab_address.png";
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
}
const InvoiceSummaryPDF: React.FC<SummaryInvoice> = ({
  summaryData,
  showSignature,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Image src={lab_header} style={styles.lab_header} />
      <View style={styles.patientCard}>
        <View style={styles.patientInfoRow}>
          <View style={styles.patientInfoPair}>
            <Text style={styles.patientLabel}>Insurance Company:</Text>
            <Text style={styles.patientValue}>
              {summaryData[0].patient.insurance_company_name}
            </Text>
          </View>
          <View style={styles.patientInfoPair}>
            <Text style={styles.patientLabel}>Month:</Text>
            <Text style={styles.patientValue}>
              {summaryData[0].patient.insurance_company_name}
            </Text>
          </View>
        </View>
      </View>
      <InvoiceSummaryTable
        summaryData={summaryData}
        showSignature={showSignature}
      />

      <View style={[{ textAlign: "right", paddingTop: 15 }]}>
        {showSignature && (
          <Image src={lab_signature} style={styles.lab_signature} />
        )}
        <Text>Signature</Text>
        <Text style={[{ top: 20 }]}>2009/37</Text>
      </View>

      <View style={styles.footer} fixed>
        <Image src={lab_address} style={styles.footerImage} />
      </View>
    </Page>
  </Document>
);
export default function InvoiceSummaryList({
  summaryData,
  showSignature,
}: SummaryInvoice) {
  return (
    <PDFViewer width="100%" height="100%">
      <InvoiceSummaryPDF
        summaryData={summaryData}
        showSignature={showSignature}
      />
    </PDFViewer>
  );
}
