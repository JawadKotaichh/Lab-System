
  
import { StyleSheet } from '@react-pdf/renderer';
import { Font } from "@react-pdf/renderer";
Font.register({
  family: "Amiri",
  src: "/fonts/Amiri-Regular.ttf", 
  fontWeight: "normal",
});

export const styles = StyleSheet.create({
  tableRowWithoutBorder:{
      flexDirection: 'row',
      borderRightWidth:0,},
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
  lab_header:{
    width:"100%",
    objectFit: "cover",
  },
  lab_signature:{
    position: 'absolute',
    marginTop: - 20, 
    marginRight:-25,
    right: 0, 
    width: 120,
    height: 100,
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
   labTitle:{
    paddingBottom:5,
    fontSize:15,
    fontWeight:"bold",
    textAlign:'center',
  },
   patientCard: {  
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
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
  },
  tableWrapper: {
    width: '100%', 
    borderWidth:1,        
    borderColor: '#262626',
  },
  tableColHeader: {
  flex: 1,
  borderStyle: 'solid',
  borderColor: '#262626',
  backgroundColor: '#f0f0f0',
  padding: 4,
  borderBottom: 1,
  textAlign: 'center',
},
tableCol: {
  flex: 1,
  borderColor: '#262626',
  padding: 4,
  textAlign: 'center', 
},
  tableCellText: {
    fontSize: 10,
  }, footer: {
    position: "absolute",
    bottom: 20,         
    left: 40,
    right: 40,
    textAlign: "center",
  },
  footerImage: {
    width: 500,         
    height: 30,
    objectFit: "contain",
  },
  tableCellTextHeader:{
    fontSize: 10,
    paddingTop:5,
    textAlign: 'center',
  },
  tableColLast: {
  flex: 1,
  borderRightWidth: 0,
  padding: 4,
}
});