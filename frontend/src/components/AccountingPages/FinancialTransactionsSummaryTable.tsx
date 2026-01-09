import { Text, View } from "@react-pdf/renderer";
import type { FinancialTransactionSummaryInvoice } from "./FinancialTransactionsSummaryList";
import { styles } from "./FinancialTransactionsSummaryStyle";
import amountToWords from "../Invoice/amountToWords";

const pad2 = (n: number) => String(n).padStart(2, "0");

const formatYMDLocal = (value: unknown) => {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

function formatMoney(amount: number, currency: string) {
  if (currency === "USD") return `${amount.toFixed(2)} $`;
  return `${amount.toLocaleString("en-US")} LBP`;
}

const getRowCurrency = (
  row: FinancialTransactionSummaryInvoice["summaryData"][number]
): string => {
  return row.currency;
};

const FinancialTransactionsSummaryTable = ({
  summaryData,
  currency,
}: FinancialTransactionSummaryInvoice) => {
  const headers = ["Date", "Category", "Description", "Total Price"];
  const filtered =
    currency && currency !== "ALL"
      ? summaryData.filter((t) => getRowCurrency(t) === currency)
      : summaryData;

  const grouped = filtered.reduce<
    Record<string, FinancialTransactionSummaryInvoice["summaryData"]>
  >((acc, row) => {
    const cur = getRowCurrency(row);
    (acc[cur] ??= []).push(row);
    return acc;
  }, {});

  const orderedCurrencies = Object.keys(grouped).sort((a, b) => {
    if (a === "USD") return -1;
    if (b === "USD") return 1;
    if (a === "LBP") return -1;
    if (b === "LBP") return 1;
    return a.localeCompare(b);
  });

  return (
    <View>
      {orderedCurrencies.map((cur) => {
        const rows = grouped[cur];
        const totalPrice = rows.reduce((sum, currentTransaction) => {
          const d = currentTransaction.amount;
          if (!d) return sum;
          return sum + d;
        }, 0);
        return (
          <View key={cur} style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>
              Currency: {cur}
            </Text>
            <View style={styles.tableWrapper}>
              <View style={[styles.tableRow, { borderBottomWidth: 0.1 }]}>
                {headers.map((h) => (
                  <View style={styles.tableColHeader} key={h}>
                    <Text
                      style={[styles.tableCellTextHeader, { fontWeight: 700 }]}
                    >
                      {h}
                    </Text>
                  </View>
                ))}
              </View>

              {rows.map((currentTransaction, rowIdx) => {
                const current_amount = currentTransaction.amount;
                const rowTotal = current_amount ? current_amount : 0;

                return (
                  <View
                    style={[styles.tableRow, { borderBottomWidth: 0.1 }]}
                    key={`${cur}-${rowIdx}`}
                  >
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCellText}>
                        {formatYMDLocal(currentTransaction.date)}
                      </Text>
                    </View>

                    <View style={styles.tableCol}>
                      <Text style={styles.tableCellText}>
                        {currentTransaction.category}
                      </Text>
                    </View>

                    <View style={styles.tableCol}>
                      <Text style={styles.tableCellText}>
                        {currentTransaction.description}
                      </Text>
                    </View>

                    <View style={[styles.tableColLast, { textAlign: "right" }]}>
                      <Text style={styles.tableCellText}>
                        {formatMoney(rowTotal, cur)}
                      </Text>
                    </View>
                  </View>
                );
              })}
              <View style={[styles.tableRow, styles.subTotal]}>
                <View style={styles.subTotalCol}>
                  <Text style={[styles.subtotalCellText, { fontWeight: 900 }]}>
                    Subtotal
                  </Text>
                </View>
                <View style={styles.tableColLast}>
                  <Text
                    style={[
                      styles.subtotalCellText,
                      { textAlign: "right", fontWeight: 900 },
                    ]}
                  >
                    {formatMoney(totalPrice, cur)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[{ textAlign: "center" }, styles.AmountBox]}>
              <Text>{amountToWords(totalPrice, cur)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};
export default FinancialTransactionsSummaryTable;
