import logo from "../../assets/logo.png";
import {
  Document,
  Page,
  Image,
  View,
  Text,
  PDFViewer,
} from "@react-pdf/renderer";
import type { visitInvoiceData } from "../types";
import { styles } from "./InvoiceStyle";
import TestsTableInvoice from "./TestsTableInvoice";

const InvoicePdf: React.FC<visitInvoiceData> = ({
  listOfTests,
  totalPrice,
  patient,
  visit_date,
  patient_insurance_company_rate,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Image src={logo} style={styles.logo} />
        <View>
          <Text style={[styles.title, styles.textBold]}>INVOICE</Text>
        </View>
      </View>
      <View style={styles.invoiceNumber}>
        <Text>Invoice Number:</Text>
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
        </View>
      </View>
      <TestsTableInvoice
        listOfTests={listOfTests}
        visit_date={visit_date!}
        totalPrice={totalPrice}
        patient={patient!}
        patient_insurance_company_rate={patient_insurance_company_rate}
      />
      <View style={[{ textAlign: "right" }]}>
        <Text>Signature</Text>
        <Text style={[{ top: 20 }]}>2009/37</Text>
      </View>
    </Page>
  </Document>
);
export default function Invoice(props: visitInvoiceData) {
  return (
    <PDFViewer width="100%" height="100%">
      <InvoicePdf key={props.patient.patient_id} {...props} />
    </PDFViewer>
  );
}
