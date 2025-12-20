import { baseURLL } from "../../api";

import {
  Document,
  Page,
  Image,
  View,
  Text,
  PDFViewer,
} from "@react-pdf/renderer";
import { styles } from "./InvoiceStyle";
import TestsTableInvoice from "./TestsTableInvoice";
import type { InvoiceWrapperProps } from "../types";

const InvoicePdf: React.FC<InvoiceWrapperProps> = ({
  invoice_number,
  list_of_lab_panels,
  list_of_tests,
  patient,
  total_price,
  visit_date,
  patient_insurance_company_rate,
  showSignature,
  discount_percentage,
  currency,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Image
        src={`${baseURLL}/branding/lab_header`}
        style={styles.lab_header}
      />
      <View style={styles.invoiceNumber}>
        <Text>Invoice Number: {invoice_number}</Text>
      </View>
      <View style={styles.patientCard}>
        <View style={styles.patientInfoRow}>
          <View style={styles.patientInfoPair}>
            <Text style={styles.patientLabel}>Name:</Text>
            <Text style={styles.patientValue}>{patient!.name}</Text>
          </View>
          <View style={styles.patientInfoPair}>
            <Text style={styles.patientLabel}>Gender:</Text>
            <Text style={styles.patientValue}>{patient!.gender}</Text>
          </View>
          <View style={styles.patientInfoPair}>
            <Text style={styles.patientLabel}>DOB:</Text>
            <Text style={styles.patientValue}>
              {patient!.DOB.split("T")[0]}
            </Text>
          </View>
        </View>
        <View style={styles.patientInfoRow}>
          <View
            style={[
              styles.patientInfoPair,
              styles.patientInfoPairWide,
              styles.patientInfoPairGap,
            ]}
          >
            <Text style={styles.patientLabel}>Insurance Company:</Text>
            <Text style={styles.patientValue}>
              {patient!.insurance_company_name}
            </Text>
          </View>

          <View
            style={[
              styles.patientInfoPair,
              styles.patientInfoPairMid,
              styles.patientInfoPairGap,
            ]}
          >
            <Text style={styles.patientLabel}>Phone Number:</Text>
            <Text style={styles.patientValue}>{patient!.phone_number}</Text>
          </View>

          <View style={[styles.patientInfoPair, styles.patientInfoPairNarrow]}>
            <Text style={styles.patientLabel}>Visit Date:</Text>
            <Text style={styles.patientValue}>
              {visit_date.toString().split("T")[0]}
            </Text>
          </View>
        </View>

        {/* 
        <View style={styles.patientInfoRow}>
          <View style={styles.patientInfoPair}>
            <Text style={styles.patientLabel}>Insurance Company:</Text>
            <Text style={styles.patientValue}>
              {patient!.insurance_company_name}
            </Text>
          </View>
          <View style={styles.patientInfoPair}>
            <Text style={styles.patientLabel}>Phone Number:</Text>
            <Text style={styles.patientValue}>{patient!.phone_number}</Text>
          </View>
          <View style={styles.patientInfoPair}>
            <Text style={styles.patientLabel}>Visit Date:</Text>
            <Text style={styles.patientValue}>
              {visit_date.toString().split("T")[0]}
            </Text>
          </View>
        </View> */}
      </View>
      <TestsTableInvoice
        invoice_number={invoice_number}
        discount_percentage={discount_percentage}
        showSignature={showSignature}
        list_of_lab_panels={list_of_lab_panels}
        list_of_tests={list_of_tests}
        visit_date={visit_date!}
        total_price={total_price}
        patient={patient!}
        patient_insurance_company_rate={patient_insurance_company_rate}
        currency={currency}
      />
      <View style={[{ textAlign: "right" }]}>
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
export default function Invoice(props: InvoiceWrapperProps) {
  return (
    <PDFViewer width="100%" height="100%">
      <InvoicePdf key={props.patient.patient_id} {...props} />
    </PDFViewer>
  );
}
