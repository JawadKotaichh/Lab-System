import { Text, View } from "@react-pdf/renderer";
import type { SummaryInvoice } from "./InvoiceSummaryList";
import { invoiceNet } from "../Invoice/invoicePricing";
import { styles } from "./InvoiceSummaryStyle";
import amountToWords from "../Invoice/amountToWords";

const InvoiceSummaryTable = ({ summaryData, currency }: SummaryInvoice) => {
  const headers = ["Date", "Patient Name", "Insurance Company", "Total Price"];
  const rows = summaryData.map(currentInvoice => ({
    currentInvoice,
    rowTotal: invoiceNet(currentInvoice.invoice_data),
  })).filter(({ currentInvoice, rowTotal }) =>
    rowTotal !== 0 || Boolean(currentInvoice.invoice_data.adjustment_minor)
  );
  const totalPrice = rows.reduce((sum, row) => sum + row.rowTotal, 0);

  return (
    <View>
      <View style={styles.tableWrapper}>
        <View
          style={[
            styles.tableRow,
            {
              borderTopWidth: 1,
              borderTopColor: "#000000",
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
        {rows.map(({ currentInvoice, rowTotal }, rowIdx) => {
          const current_invoice_data = currentInvoice.invoice_data;
          const cuurent_patient = currentInvoice.patient;
          return (
            <View
              style={[
                styles.tableRow,
                { borderBottomWidth: 0.5, borderBottomColor: "#000000" },
              ]}
              wrap={false}
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
                  {currency === "USD"
                    ? rowTotal.toFixed(2)
                    : rowTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}{" "}
                  {currency === "USD" ? "$" : "LBP"}
                </Text>
              </View>
            </View>
          );
        })}
        <View
          style={[styles.tableRow, styles.subTotal, { borderBottomWidth: 1 }]}
          wrap={false}
        >
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
              {currency === "USD"
                ? totalPrice.toFixed(2)
                : totalPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}{" "}
              {currency === "USD" ? "$" : "LBP"}
            </Text>
          </View>
        </View>
      </View>

      <View style={[{ textAlign: "center" }, styles.AmountBox]} wrap={false}>
        <Text>{amountToWords(totalPrice, currency)}</Text>
      </View>
    </View>
  );
};
export default InvoiceSummaryTable;
