import { Text, View } from "@react-pdf/renderer";
import type { SummaryInvoice } from "./InvoiceSummaryList";
import getTotalPrice from "./getTotalPrice";
import { styles } from "./InvoiceSummaryStyle";
import amountToWords from "../Invoice/amountToWords";

const InvoiceSummaryTable = ({ summaryData }: SummaryInvoice) => {
  const headers = ["Date", "Patient Name", "Insurance Company", "Total Price"];
  const totalPrice = summaryData.reduce((sum, currentInvoice) => {
    const d = currentInvoice.invoice_data;
    return (
      sum +
      getTotalPrice(
        d.patient_insurance_company_rate,
        d.discount_percentage,
        d.list_of_tests,
        d.list_of_lab_panels
      )
    );
  }, 0);
  return (
    <View>
      <View style={styles.tableWrapper}>
        <View
          style={[
            styles.tableRow,
            {
              borderBottomWidth: 0.1,
              borderTopWidth: 0,
              borderLeftWidth: 0,
              borderRightWidth: 0,
              borderColor: "#262626",
            },
          ]}
        >
          {headers.map((h) => (
            <View style={styles.tableColHeader} key={h}>
              <Text
                style={[styles.tableCellTextHeader, { fontWeight: "4000" }]}
              >
                {h}
              </Text>
            </View>
          ))}
        </View>
        {summaryData.map((currentInvoice, rowIdx) => {
          const current_invoice_data = currentInvoice.invoice_data;
          const cuurent_patient = currentInvoice.patient;

          return (
            <View
              style={[
                styles.tableRow,
                {
                  borderBottomWidth: 0.1,
                  borderTopWidth: 0,
                  borderLeftWidth: 0,
                  borderRightWidth: 0,
                  borderColor: "#262626",
                },
              ]}
              key={rowIdx}
            >
              <View style={styles.tableCol}>
                <Text style={styles.tableCellText}>
                  {current_invoice_data.visit_date
                    ? new Date(current_invoice_data.visit_date)
                        .toISOString()
                        .split("T")[0]
                    : null}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCellText}>{cuurent_patient.name}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCellText}>
                  {cuurent_patient.insurance_company_name}
                </Text>
              </View>
              <View style={[styles.tableColLast, { textAlign: "right" }]}>
                <Text style={styles.tableCellText}>
                  {getTotalPrice(
                    current_invoice_data.patient_insurance_company_rate,
                    current_invoice_data.discount_percentage,
                    current_invoice_data.list_of_tests,
                    current_invoice_data.list_of_lab_panels
                  )}{" "}
                  $
                </Text>
              </View>
            </View>
          );
        })}
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
              {totalPrice.toFixed(2)} $
            </Text>
          </View>
        </View>
      </View>

      <View style={[{ textAlign: "center" }, styles.AmountBox]}>
        <Text>{amountToWords(totalPrice)}</Text>
      </View>
    </View>
  );
};
export default InvoiceSummaryTable;
