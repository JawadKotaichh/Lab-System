import { Text, View } from "@react-pdf/renderer";
import { styles } from "./InvoiceStyle";
import amountToWords from "./amountToWords";
import type {
  InvoiceWrapperProps,
  lab_test_changed,
  labPanel,
  labTest,
} from "../types";
import { useEffect, useState } from "react";

const TestsTableInvoice = ({
  list_of_tests,
  total_price,
  list_of_lab_panels,
  currency,
  patient_insurance_company_rate,
  invoiceData,
}: InvoiceWrapperProps) => {
  const headers = ["Nssf ID", "Test Name", "Price"];

  console.log(`currency :${currency}`);
  const [priceEdits, setPriceEdits] = useState<Record<string, number>>({});
  useEffect(() => {
    const next: Record<string, number> = {};
    console.log(
      "list_of_lab_tests_ids_changed",
      invoiceData.list_of_lab_tests_ids_changed,
    );
    (invoiceData.list_of_lab_tests_ids_changed ?? []).forEach(
      (x: lab_test_changed) => {
        next[String(x.lab_test_id)] = x.new_price;
      },
    );
    setPriceEdits(next);
  }, [invoiceData.list_of_lab_tests_ids_changed]);

  const getDisplayedPrice = (labTestTypeId: string, basePrice: number) => {
    console.log("test id: ", labTestTypeId);
    const override = priceEdits[labTestTypeId];
    if (override !== undefined) {
      console.log("Adjusted price", override);
      return override;
    }

    const rate = invoiceData.patient_insurance_company_rate ?? 1;
    console.log("Base price", basePrice * rate);
    return basePrice * rate;
  };

  const formatPrice = (currency: string, value: number = 0) => {
    return currency === "USD"
      ? `${value.toFixed(2)} $`
      : `${value.toLocaleString("en-US")} LBP`;
  };

  const getPrice = (test: labTest) =>
    formatPrice(currency, getDisplayedPrice(test.lab_test_id, test.price));

  const getPanelPrice = (panel: labPanel) =>
    formatPrice(
      currency,
      panel.lab_panel_price! * patient_insurance_company_rate,
    );

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
                ? `${total_price.toFixed(2)} $`
                : `${total_price.toLocaleString("en-US")} LBP`}
            </Text>
          </View>
        </View>
      </View>
      <View style={[{ textAlign: "center" }, styles.AmountBox]} wrap={false}>
        <Text>{amountToWords(total_price, currency)}</Text>
      </View>
    </View>
  );
};
export default TestsTableInvoice;
