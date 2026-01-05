import { Text, View } from "@react-pdf/renderer";
import { styles } from "./InvoiceStyle";
import amountToWords from "./amountToWords";
import type { InvoiceWrapperProps, labPanel, labTest } from "../types";

const TestsTableInvoice = ({
  list_of_tests,
  total_price,
  patient_insurance_company_rate,
  list_of_lab_panels,
  discount_percentage,
  currency,
}: InvoiceWrapperProps) => {
  const headers = ["Nssf ID", "Test Name", "Price"];

  console.log(`currency :${currency}`);

  const formatPrice = (currency: string, value: number = 0) => {
    const rate = patient_insurance_company_rate ?? 1;
    const discount = discount_percentage ?? 0;

    const base = value * rate;
    const final = base - (base * discount) / 100;
    return currency === "USD"
      ? `${final.toFixed(2)} $`
      : `${final.toLocaleString("en-US")} LBP`;
  };

  const getPrice = (test: labTest) => formatPrice(currency, test.price);

  const getPanelPrice = (panel: labPanel) =>
    formatPrice(currency, panel.lab_panel_price);

  return (
    <View>
      <View style={styles.tableWrapper}>
        <View style={[styles.tableRow, { borderBottomWidth: 0.1 }]} fixed>
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
        {list_of_tests.map((test, rowIdx) => {
          const testValues = [test.nssf_id, test.name, getPrice(test)];
          return (
            <View
              style={[styles.tableRow, { borderBottomWidth: 0.1 }]}
              wrap={false}
              key={test.lab_test_id ?? `${test.name}-${rowIdx}`}
            >
              {testValues.map((val, colIdx) => (
                <View
                  key={colIdx}
                  style={[
                    styles.tableCol,
                    colIdx === testValues.length - 1 ? styles.tableColLast : {},
                  ]}
                  wrap={false}
                >
                  <Text
                    style={[
                      styles.tableCellText,
                      colIdx === testValues.length - 1
                        ? { textAlign: "right" }
                        : {},
                    ]}
                  >
                    {val}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}

        {list_of_lab_panels.map((panel, rowIdx) => {
          const panelValues = [
            panel.nssf_id,
            panel.panel_name,
            getPanelPrice(panel),
          ];
          return (
            <View
              style={[styles.tableRow, { borderBottomWidth: 0.1 }]}
              wrap={false}
              key={panel.id ?? `${panel.panel_name}-${rowIdx}`}
            >
              {panelValues.map((val, colIdx) => (
                <View
                  key={colIdx}
                  style={[
                    styles.tableCol,
                    colIdx === panelValues.length - 1
                      ? styles.tableColLast
                      : {},
                  ]}
                >
                  <Text
                    style={[
                      styles.tableCellText,
                      colIdx === panelValues.length - 1
                        ? { textAlign: "right" }
                        : {},
                    ]}
                  >
                    {val}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}

        <View style={[styles.tableRow, styles.subTotal]} wrap={false}>
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
                ? `${(
                    total_price * patient_insurance_company_rate -
                    (total_price *
                      patient_insurance_company_rate *
                      discount_percentage) /
                      100
                  ).toFixed(2)} $`
                : `${(
                    total_price * patient_insurance_company_rate -
                    (total_price *
                      patient_insurance_company_rate *
                      discount_percentage) /
                      100
                  ).toLocaleString("en-US")} LBP`}
            </Text>
          </View>
        </View>
      </View>
      <View style={[{ textAlign: "center" }, styles.AmountBox]} wrap={false}>
        <Text>
          {amountToWords(
            total_price * patient_insurance_company_rate -
              (total_price *
                patient_insurance_company_rate *
                discount_percentage) /
                100,
            currency
          )}
        </Text>
      </View>
    </View>
  );
};
export default TestsTableInvoice;
