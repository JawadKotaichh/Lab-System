import { Text, View } from "@react-pdf/renderer";
import type { visitResultData } from "../types";
import { styles } from "./ResultStyle";
import groupByCategory from "./groupByCategory";
import renderNormalValue from "../renderNormalValue";
import AnalyseResult from "./AnalyseResult";

interface TestsTableResultsProps extends visitResultData {
  patientGender?: string;
}

const TestsTableResults = ({
  list_of_standalone_test_results,
  list_of_panel_results,
  patientGender,
}: TestsTableResultsProps) => {
  const isNormalForGender = (
    nv: unknown,
    result: string | number,
    gender?: string
  ): boolean => {
    const verdict = AnalyseResult(nv, String(result));
    const rec = nv as Record<string, unknown>;
    const hasSexSplit =
      "male_normal_value_type" in rec && "female_normal_value_type" in rec;

    if (hasSexSplit) {
      const g = (gender ?? "").toString().toLowerCase();
      const idx = g === "male" ? 0 : g === "female" ? 1 : -1;
      if (idx >= 0) return !!verdict[idx];
      return !!(verdict[0] || verdict[1]);
    }
    return !!verdict[0];
  };

  const isAbnormal = (
    normalValueList: unknown[] | undefined,
    result: string | number,
    gender?: string
  ): boolean => {
    if (!normalValueList?.length) return false;
    return !normalValueList.some((nv) => isNormalForGender(nv, result, gender));
  };

  const groupedData = groupByCategory(
    list_of_standalone_test_results,
    list_of_panel_results
  );
  // console.log("Grouped data: ", groupedData);

  return (
    <View>
      <View style={styles.tableWrapper}>
        {groupedData.map((currentCategory, rowIdx) => (
          <View key={rowIdx}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                borderBottomWidth: 1,
                borderTopWidth: 1,
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
                      {
                        borderWidth: 0,
                        borderBottomWidth: 0.3,
                        borderStyle: "dotted",
                      },
                    ]}
                    key={`${rowIdx}-s-${idx}`}
                  >
                    <View style={styles.tableColleft}>
                      <Text style={styles.tableCellText}>
                        {t.lab_test_type.name}
                      </Text>
                    </View>
                    <View style={[styles.tableCol, { textAlign: "center" }]}>
                      <Text style={styles.tableCellText}>
                        {t.result}{" "}
                        {isAbnormal(
                          t.lab_test_type?.normal_value_list,
                          t.result,
                          patientGender
                        )
                          ? " *"
                          : ""}
                      </Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCellText}>
                        {t.lab_test_type.unit}
                      </Text>
                    </View>
                    <View style={styles.tableCol}>
                      {t.lab_test_type?.normal_value_list?.length ? (
                        <View>
                          {t.lab_test_type.normal_value_list.map((nv, i) => (
                            <Text
                              key={i}
                              style={[
                                styles.tableCellText,
                                { textAlign: "left" },
                              ]}
                            >
                              {renderNormalValue(nv, { ascii: true })}
                            </Text>
                          ))}
                        </View>
                      ) : (
                        <Text style={[styles.tableCellText, { opacity: 0.6 }]}>
                          —
                        </Text>
                      )}
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
                          {
                            borderWidth: 0,
                            borderBottomWidth: 0.3,
                            borderStyle: "dotted",
                          },
                        ]}
                        key={`${rowIdx}-p-${idx}-r-${i}`}
                      >
                        <View style={styles.tableColleft}>
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
                            {isAbnormal(
                              t.lab_test_type?.normal_value_list,
                              t.result,
                              patientGender
                            )
                              ? " *"
                              : ""}
                          </Text>
                        </View>
                        <View style={styles.tableCol}>
                          <Text style={styles.tableCellText}>
                            {t.lab_test_type.unit}
                          </Text>
                        </View>
                        <View style={styles.tableCol}>
                          {t.lab_test_type?.normal_value_list?.length ? (
                            <View>
                              {t.lab_test_type.normal_value_list.map(
                                (nv, i) => (
                                  <Text
                                    key={i}
                                    style={[
                                      styles.tableCellText,
                                      { textAlign: "left" },
                                    ]}
                                  >
                                    {renderNormalValue(nv, { ascii: true })}
                                  </Text>
                                )
                              )}
                            </View>
                          ) : (
                            <Text
                              style={[
                                styles.tableCellText,
                                { opacity: 0.6, textAlign: "left" },
                              ]}
                            >
                              —
                            </Text>
                          )}
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
