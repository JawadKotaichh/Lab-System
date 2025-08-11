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
import type { visitResultData } from "../types";
import { styles } from "./ResultStyle";
import TestsTableResults from "./TestsTableResults";

const ResultPdf: React.FC<visitResultData> = ({
  patient,
  list_of_panel_results,
  list_of_standalone_test_results,
  visit_date,
  report_date,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Image src={lab_header} style={styles.lab_header} />
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
            <Text style={styles.patientLabel}>Exam Date:</Text>
            <Text style={styles.patientValue}>
              {visit_date.toString().split("T")[0]}
            </Text>
          </View>
          <View style={styles.patientInfoPair}>
            <Text style={styles.patientLabel}>Report Date:</Text>
            <Text style={styles.patientValue}>
              {report_date.toISOString().split("T")[0]}
            </Text>
          </View>
        </View>
      </View>
      <View>
        <Text style={styles.labTitle}>Lab Results</Text>
      </View>
      <TestsTableResults
        patientGender={patient.gender}
        visit_date={visit_date}
        report_date={report_date}
        list_of_standalone_test_results={list_of_standalone_test_results}
        list_of_panel_results={list_of_panel_results}
        patient={patient!}
      />
      <View style={[{ textAlign: "right", paddingTop: 15 }]}>
        <Image src={lab_signature} style={styles.lab_signature} />
        <Text>Signature</Text>
        <Text style={[{ top: 20 }]}>2009/37</Text>
      </View>
      <View style={styles.footer} fixed>
        <Image src={lab_address} style={styles.footerImage} />
      </View>
    </Page>
  </Document>
);
export default function ResultList(props: visitResultData) {
  return (
    <PDFViewer width="100%" height="100%">
      <ResultPdf key={props.patient.patient_id} {...props} />
    </PDFViewer>
  );
}
