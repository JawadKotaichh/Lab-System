import { Text, View } from "@react-pdf/renderer";
import { styles } from "./InvoiceStyle";
import amountToWords from "./amountToWords";
import type { InvoiceWrapperProps } from "../types";

const TestsTableInvoice = ({
  list_of_tests,
  total_price,
  patient_insurance_company_rate,
  list_of_lab_panels,
  discount_percentage,
}: InvoiceWrapperProps) => {
  const headers = ["Nssf ID", "Test Name", "Price"];
  const testData = list_of_tests.map((t) => [
    t.nssf_id,
    t.name,
    `${(patient_insurance_company_rate * t.price).toFixed(2)} $`,
  ]);
  const panelData = list_of_lab_panels.map((p) => [
    p.nssf_id,
    p.panel_name,
    `${(patient_insurance_company_rate * p.lab_panel_price!).toFixed(2)} $`,
  ]);
  return (
    <View>
      <View style={styles.tableWrapper}>
        <View style={[styles.tableRow, { borderBottom: 0.1 }]}>
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
          <View
            style={[styles.tableRow, { borderBottom: 0.1 }]}
            key={list_of_tests[rowIdx].lab_test_id}
          >
            {testVals.map((val, colIdx) => (
              <View
                key={colIdx}
                style={[
                  styles.tableCol,
                  colIdx === testVals.length - 1 ? styles.tableColLast : {},
                ]}
              >
                <Text
                  style={[
                    styles.tableCellText,
                    colIdx === testVals.length - 1
                      ? { textAlign: "right" }
                      : {},
                  ]}
                >
                  {val}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {panelData.map((panelVals, rowIdx) => (
          <View
            style={[styles.tableRow, { borderBottom: 0.1 }]}
            key={list_of_tests[rowIdx].lab_test_id}
          >
            {panelVals.map((val, colIdx) => (
              <View
                key={colIdx}
                style={[
                  styles.tableCol,
                  colIdx === panelVals.length - 1 ? styles.tableColLast : {},
                ]}
              >
                <Text
                  style={[
                    styles.tableCellText,
                    colIdx === panelVals.length - 1
                      ? { textAlign: "right" }
                      : {},
                  ]}
                >
                  {val}
                </Text>
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
              {(
                total_price * patient_insurance_company_rate -
                (total_price *
                  patient_insurance_company_rate *
                  discount_percentage) /
                  100
              ).toFixed(2)}{" "}
              $
            </Text>
          </View>
        </View>
      </View>
      <View style={[{ textAlign: "center" }, styles.AmountBox]}>
        <Text>
          {amountToWords(
            total_price * patient_insurance_company_rate -
              (total_price *
                patient_insurance_company_rate *
                discount_percentage) /
                100
          )}
        </Text>
      </View>
    </View>
  );
};
export default TestsTableInvoice;
