import { Document, Page, PDFViewer, Text, View } from "@react-pdf/renderer";
import { styles } from "./InvoiceStyle";

export default function Invoice() {
  const InvoicePdf = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text></Text>
            <Text></Text>
          </View>
          <View>
            <Text></Text>
            <Text></Text>
          </View>
        </View>
      </Page>
    </Document>
  );
  return (
    <div className="w-full h-[750px]">
      <PDFViewer width="100%" height="100%">
        <InvoicePdf />
      </PDFViewer>
    </div>
  );
}
