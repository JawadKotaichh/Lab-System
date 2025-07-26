import { Text, View } from "@react-pdf/renderer";
import { styles } from "./InvoiceStyle";
import type { visitInvoiceData } from "../types";
import amountToWords from "./amountToWords";

const TestsTableInvoice = ({
  listOfTests,
  totalPrice,
  patient_insurance_company_rate,
  listOfPanels,
}: visitInvoiceData) => {
  console.log("listOfTests", listOfTests);
  const headers = ["Nssf ID", "Test Name", "Price"];
  const testData = listOfTests.map((t) => [
    t.nssf_id,
    t.name,
    `${(patient_insurance_company_rate * t.price).toFixed(2)} $`,
  ]);
  const panelData = listOfPanels.map((t) => [
    t.nssf_id,
    t.panel_name,
    `${(patient_insurance_company_rate * t.lab_panel_price!).toFixed(2)} $`,
  ]);
  return (
    <View>
      <View style={styles.tableWrapper}>
        <View style={styles.tableRow}>
          {headers.map((h) => (
            <View style={styles.tableColHeader} key={h}>
              <Text
                style={[styles.tableCellTextHeader, { fontWeight: "9000" }]}
              >
                {h}
              </Text>
            </View>
          ))}
        </View>
        {testData.map((testVals, rowIdx) => (
          <View style={styles.tableRow} key={listOfTests[rowIdx].lab_test_id}>
            {testVals.map((val, colIdx) => (
              <View
                key={colIdx}
                style={[
                  styles.tableCol,
                  colIdx === testVals.length - 1 ? styles.tableColLast : {},
                ]}
              >
                <Text style={styles.tableCellText}>{val}</Text>
              </View>
            ))}
          </View>
        ))}
        {panelData.map((panelVals, rowIdx) => (
          <View style={styles.tableRow} key={listOfTests[rowIdx].lab_test_id}>
            {panelVals.map((val, colIdx) => (
              <View
                key={colIdx}
                style={[
                  styles.tableCol,
                  colIdx === panelVals.length - 1 ? styles.tableColLast : {},
                ]}
              >
                <Text style={styles.tableCellText}>{val}</Text>
              </View>
            ))}
          </View>
        ))}
        <View style={[styles.tableRow, styles.subTotal]}>
          <View style={styles.subTotalCol}>
            <Text style={[styles.subtotalCellText, { fontWeight: "9000" }]}>
              Subtotal
            </Text>
          </View>
          <View style={styles.tableColLast}>
            <Text
              style={[
                styles.subtotalCellText,
                { textAlign: "right", fontWeight: "9000" },
              ]}
            >
              {(totalPrice * patient_insurance_company_rate).toFixed(2)} $
            </Text>
          </View>
        </View>
      </View>
      <View style={[{ textAlign: "center" }, styles.AmountBox]}>
        <Text>
          {amountToWords(totalPrice * patient_insurance_company_rate)}
        </Text>
      </View>
    </View>
  );
};
export default TestsTableInvoice;
