import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    backgroundColor:'#fff',
    color:'#262626',
    fontFamily:'Helvetica',
    fontSize:12,
    padding:"30px 50px"
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  header:{
    flexDirection:"row",
    justifyContent:"space-between",
    marginBottom:20,
  },
  logo: {
    position: 'absolute',
    right: 0, 
    width: 50,
    height: 50,
  },
  title: {
   fontSize:24,
  },
  textBold:{   
    fontFamily:"Helvetica-Bold",
  },
  spaceY:{
    display:"flex",
    flexDirection:"column",
    gap:"2px",
  },
   patientCard: {  
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    marginTop:20,
    backgroundColor: '#f9f9f9',
  },
  patientInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  patientInfoPair: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop:5,
    flex: 1,               
  },
  patientLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 2,         
  },
  patientValue: {
    fontSize: 10,
  },
  tableRow:{
    flexDirection: 'row',
    borderBottom:1,
  },
  tableRowWithoutBorder:{
      flexDirection: 'row',
      borderRightWidth:0,
  },
  tableWrapper: {
    width: '100%', 
    borderWidth:1,        
    borderColor: '#262626',
  },
  tableColHeader: {
    width: '33.33%',             
    borderStyle: 'solid',
    borderColor: '#262626',
    backgroundColor: '#f0f0f0',
    padding: 4,
    borderBottom:1,
  },
  tableCol: {
    flex: 1,
    borderColor: '#262626',
    padding: 4,
    borderRight:1,
  },
  tableCellText: {
    fontSize: 10,
    textAlign: 'center',
  },
  tableCellTextHeader:{
    fontSize: 10,
    textAlign: 'left',
  },
  subTotal:{
    borderTop:1,
    textAlign: 'right',
  },
  subTotalCol: {
  width: "66.815%",
  padding: 4,
  borderRightWidth: 1,
},
  tableColLast: {
  flex: 1,
  borderRightWidth: 0,
  padding: 4,
},
subtotalCellText: {
    fontSize: 12,
    textAlign: 'left',
  },
  invoiceNumber:{
    fontSize:12,
    fontWeight:5000,
    textAlign:'center',
  },
  AmountBox: {  
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    marginTop:20,
    backgroundColor: '#e0e0e0',
  },
});