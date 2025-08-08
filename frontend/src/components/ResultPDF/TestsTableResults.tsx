import { Text, View } from "@react-pdf/renderer";
import type { visitResultData } from "../types";
import { styles } from "./ResultStyle";
import groupByCategory from "./groupByCategory";

const TestsTableResults = ({
  list_of_standalone_test_results,
  list_of_panel_results,
}: visitResultData) => {
  const headers = [
    "Test Name",
    "Result",
    "Unit",
    "Normal Value",
    "Previous Result",
  ];

  const groupedData = groupByCategory(
    list_of_standalone_test_results,
    list_of_panel_results
  );
  // console.log("Grouped data: ", groupedData);

  return (
    <View>
      <View style={styles.tableWrapper}>
        <View style={styles.tableRowWithoutBorder}>
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
        {groupedData.map((currentCategory, rowIdx) => (
          <View key={rowIdx}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                borderBottom: 1,
                borderTop: 1,
                paddingBottom: 5,
                paddingTop: 2,
                padding: 4,
              }}
            >
              {currentCategory.category}
            </Text>
            {currentCategory.items.map((item, idx) => {
              if (item.type == "standalone") {
                const t = item.test;
                return (
                  <View
                    style={[
                      styles.tableRow,
                      { borderBottom: 0.3, borderStyle: "dotted" },
                    ]}
                    key={`${rowIdx}-s-${idx}`}
                  >
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCellText}>
                        {t.lab_test_type.name}
                      </Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCellText}>{t.result}</Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCellText}>
                        {t.lab_test_type.unit}
                      </Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCellText}>
                        {t.lab_test_type.lower_bound}{" "}
                        {t.lab_test_type.upper_bound}
                      </Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCellText}>
                        {t.prev_result}{" "}
                        {t.prev_date
                          ? new Date(t.prev_date).toISOString().split("T")[0]
                          : null}
                      </Text>
                    </View>
                  </View>
                );
              } else {
                const p = item.panel;
                return (
                  <View key={`${rowIdx}-p-${idx}`}>
                    <View
                      style={styles.tableRow}
                      key={`${rowIdx}-p-${idx}-r-$`}
                    >
                      <Text
                        style={[
                          styles.tableCellText,
                          {
                            fontSize: 11,
                            padding: 4,
                            width: "100%",
                            fontWeight: "bold",
                            borderStyle: "dotted",
                            borderBottomWidth: 0.3,
                          },
                        ]}
                      >
                        {p.lab_panel_name}
                      </Text>
                    </View>
                    {p.list_of_test_results.map((t, i) => (
                      <View
                        style={[
                          styles.tableRow,
                          { borderBottom: 0.3, borderStyle: "dotted" },
                        ]}
                        key={`${rowIdx}-p-${idx}-r-${i}`}
                      >
                        <View style={styles.tableCol}>
                          <Text style={styles.tableCellText}>
                            {t.lab_test_type.name}
                          </Text>
                        </View>
                        <View style={styles.tableCol}>
                          <Text
                            style={[
                              styles.tableCellText,
                              { textAlign: "center" },
                            ]}
                          >
                            {t.result}
                          </Text>
                        </View>
                        <View style={styles.tableCol}>
                          <Text style={styles.tableCellText}>
                            {t.lab_test_type.unit}
                          </Text>
                        </View>
                        <View style={styles.tableCol}>
                          <Text style={styles.tableCellText}>
                            {t.lab_test_type.lower_bound}{" "}
                            {t.lab_test_type.upper_bound}
                          </Text>
                        </View>
                        <View style={styles.tableCol}>
                          <Text style={styles.tableCellText}>
                            {t.prev_result}{" "}
                            {t.prev_date
                              ? new Date(t.prev_date)
                                  .toISOString()
                                  .split("T")[0]
                              : null}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                );
              }
            })}
          </View>
        ))}
      </View>
    </View>
  );
};
export default TestsTableResults;
