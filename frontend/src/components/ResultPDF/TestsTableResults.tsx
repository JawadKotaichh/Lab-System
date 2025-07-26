import { Text, View } from "@react-pdf/renderer";
import type { TestResult, visitResultData } from "../types";
import { styles } from "./ResultStyle";

type Row = {
  panelName: string;
  categoryName: string;
  testName: string;
  result: string;
  unit: string;
  lowerBound: string;
  upperBound: string;
};

const TestsTableResults = ({ listOfLabTestResults }: visitResultData) => {
  const headers = [
    "Category Name",
    "Test Name",
    "Result",
    "Unit",
    "Lower Bound",
    "Upper Bound",
  ];

  const panelNameToTests = new Map<string, TestResult[]>();
  const testResults: TestResult[] = [];
  listOfLabTestResults.map((t) => {
    if (t.lab_panel_name != "" && t.lab_panel_name != null) {
      const tests = panelNameToTests.get(t.lab_panel_name);
      if (tests) {
        tests.push(t);
      } else panelNameToTests.set(t.lab_panel_name, [t]);
    } else {
      testResults.push(t);
    }
  });

  const testResultData = testResults.map((t) => [
    t.lab_panel_name,
    t.lab_test_category_name,
    t.name,
    t.result,
    t.unit,
    t.lower_bound,
    t.upper_bound,
  ]);
  const rows: Row[] = [];

  panelNameToTests.forEach((tests, panelName) => {
    tests.forEach((t, idx) => {
      rows.push({
        panelName: idx === 0 ? panelName : "",
        categoryName: t.lab_test_category_name,
        testName: t.name,
        result: t.result,
        unit: t.unit,
        lowerBound: t.lower_bound,
        upperBound: t.upper_bound,
      });
    });
  });

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
        {testResultData.map((resultVals, rowIdx) => (
          <View
            style={[
              styles.tableRow,
              rowIdx === testResultData.length - 1
                ? styles.tableRowWithoutBorder
                : {},
            ]}
            key={listOfLabTestResults[rowIdx].name}
          >
            {resultVals.map((val, colIdx) => (
              <View
                key={colIdx}
                style={[
                  styles.tableCol,
                  colIdx === resultVals.length - 1 ? styles.tableColLast : {},
                ]}
              >
                <Text style={styles.tableCellText}>{val}</Text>
              </View>
            ))}
          </View>
        ))}
        {rows.map((r, rowIdx) => (
          <View
            style={[
              styles.tableRow,
              rowIdx === rows.length - 1 ? styles.tableRowWithoutBorder : {},
            ]}
            key={`${r.panelName || "__"}-${rowIdx}`}
          >
            r.panelName && (
            <View style={styles.tableRow}>
              <Text>{r.panelName}</Text>
            </View>
            )
            {[
              r.categoryName,
              r.testName,
              r.result,
              r.unit,
              r.lowerBound,
              r.upperBound,
            ].map((val, colIdx) => (
              <View
                key={colIdx}
                style={[
                  styles.tableCol,
                  colIdx === headers.length - 1 ? styles.tableColLast : {},
                ]}
              >
                <Text style={styles.tableCellText}>{val}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};
export default TestsTableResults;
