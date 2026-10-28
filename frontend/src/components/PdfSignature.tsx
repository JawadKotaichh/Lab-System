import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";
import { baseURLL } from "../api";

const styles = StyleSheet.create({
  block: { position: "relative", alignItems: "flex-end", height: 125 },
  stamp: { position: "absolute", top: 0, right: 0, width: 110, height: 110, objectFit: "contain" },
  signature: { position: "absolute", top: 20, right: 5, width: 100, height: 70, objectFit: "contain" },
  label: { position: "absolute", top: 110, right: 0, width: 110, fontSize: 12, textAlign: "center" },
});

export default function PdfSignature({ show }: { show?: boolean }) {
  return <View style={styles.block} wrap={false}>
    {show && <>
      <Image src={`${baseURLL}/branding/lab_signature`} style={styles.stamp} />
      <Image src={`${baseURLL}/branding/signature`} style={styles.signature} />
    </>}
    <Text style={styles.label}>Signature</Text>
  </View>;
}
