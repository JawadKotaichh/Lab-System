import { baseURLL } from "../../api";
import {
  Document,
  Page,
  Image,
  View,
  Text,
  PDFViewer,
} from "@react-pdf/renderer";
import type { financialTransaction } from "../types";
import FinancialTransactionsSummaryTable from "./FinancialTransactionsSummaryTable";
import { styles } from "./FinancialTransactionsSummaryStyle";

type DateLike = Date | string;

const pad2 = (n: number) => String(n).padStart(2, "0");

const formatYMDLocal = (value: DateLike) => {
  if (!value) return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(
      value.getDate()
    )}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export interface FinancialTransactionSummaryInvoice {
  summaryData: financialTransaction[];
  currency: string;
  showSignature: boolean;
  start_date: DateLike;
  end_date: DateLike;
  category: string;
  type: string;
}

const FinancialTransactionSummaryPDF: React.FC<
  FinancialTransactionSummaryInvoice
> = ({
  summaryData,
  showSignature,
  start_date,
  end_date,
  currency,
  category,
  type,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Image
        src={`${baseURLL}/branding/lab_header`}
        style={styles.lab_header}
      />

      <View style={styles.patientCard}>
        <View style={styles.patientInfoRow}>
          <View style={styles.patientInfoColumnWide}>
            <View style={styles.patientInfoPair}>
              <Text style={styles.patientLabel}>Type:</Text>
              <Text style={styles.patientValue}>{type}</Text>
            </View>
          </View>

          <View style={styles.patientInfoColumn}>
            <View style={styles.patientInfoPair}>
              <Text style={styles.patientLabel}>Category:</Text>
              <Text style={styles.patientValue}>{category}</Text>
            </View>
          </View>

          <View style={styles.patientInfoColumnLast}>
            <View style={styles.patientInfoPair}>
              <Text style={styles.patientLabel}>Currency:</Text>
              <Text style={styles.patientValue}>{currency}</Text>
            </View>
          </View>
        </View>

        <View style={styles.patientInfoRow}>
          <View style={styles.patientInfoColumnWide}>
            <View style={styles.patientInfoPair}>
              <Text style={styles.patientLabel}>From:</Text>
              <Text style={styles.patientValue}>
                {formatYMDLocal(start_date)}
              </Text>
            </View>
          </View>

          <View style={styles.patientInfoColumn}>
            <View style={styles.patientInfoPair}>
              <Text style={styles.patientLabel}>To:</Text>
              <Text style={styles.patientValue}>
                {formatYMDLocal(end_date)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <FinancialTransactionsSummaryTable
        category={category}
        type={type}
        start_date={start_date}
        currency={currency}
        end_date={end_date}
        summaryData={summaryData}
        showSignature={showSignature}
      />

      <View style={{ textAlign: "right", paddingTop: 15 }}>
        {showSignature && (
          <Image
            src={`${baseURLL}/branding/lab_signature`}
            style={styles.lab_signature}
          />
        )}
        <Text>Signature</Text>
        <Text style={{ top: 20 }}>2009/37</Text>
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

export default function FinancialTransactionsSummaryList(
  props: FinancialTransactionSummaryInvoice
) {
  return (
    <PDFViewer width="100%" height="100%">
      <FinancialTransactionSummaryPDF {...props} />
    </PDFViewer>
  );
}
